const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
    service: "gmail",
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

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

module.exports.issueJWT = issueJWT;
module.exports.sendEmail = sendEmail;
