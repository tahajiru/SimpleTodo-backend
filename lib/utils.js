const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const isUrl = require("is-url");
var urlToTitle = require("url-to-title");

function issueJWT(user, secret_key) {
  const _id = user._id;

  const expiresIn = "1d";

  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jwt.sign(payload, secret_key, {
    expiresIn: expiresIn,
    algorithm: "HS256",
  });

  return {
    token: signedToken,
    expires: expiresIn,
  };
}

function sendEmail(email, subject, message) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "simpletodoapps@gmail.com",
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "simpletodoapps@gmail.com",
    to: email,
    subject: subject,
    html: message,
  };

  console.log("sending mail");
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

async function sanitizeText(text) {
  //Remove the leading and trailing spaces
  text = text.trim();

  //Split the text based upon 1 or more space
  const words = text.split(/\s{1,}/g);

  //Convert url to anchor links
  const res = await Promise.all(
    words.map(async (word) => {
      if (isUrl(word)) {
        const title = await urlToTitle(word);
        if (title) {
          return `<a href="${word}">${title}</a>`;
        } else {
          return `<a href="${word}">${word}</a>`;
        }
      } else {
        return word;
      }
    })
  );

  return res.join(" ");
}

module.exports.issueJWT = issueJWT;
module.exports.sendEmail = sendEmail;
module.exports.sanitizeText = sanitizeText;
