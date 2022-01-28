const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const agenda = require("../config/agenda");
const { welcomeEmails } = require("../campaigns/welcome");

const User = require("../models/User");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../lib/validation");
const { issueJWT, sendEmail } = require("../lib/utils");
const jwtDecode = require("jwt-decode");

//csrf
const csrf = require("csurf");
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN,
  },
});

//Register User
router.post("/register", async (req, res) => {
  //Validation
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const email = req.body.email.toLowerCase();

  //Checking if email exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(400).json({
      success: false,
      message: "Email already exists.",
    });
  }

  //Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //Creating a new user
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: email,
    password: hashedPassword,
  });

  // Schedule Welcome email campaign
  await agenda.start();

  const emails = welcomeEmails(req.body.firstName);

  emails.forEach(async (email) => {

    await agenda.schedule(email.time, "send emails", {
      to: user.email,
      emailSubject: email.subject,
      emailMessage: email.body,
    });

  });

  try {
    await user.save();
    res.status(200).json({
      success: true,
      message: "Registration Successful.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

//Login User
router.post("/login", async (req, res) => {
  //Validation
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const email = req.body.email.toLowerCase();

  //Checking if doesn't email exists
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  //Checking the password
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const tokenObject = issueJWT(user, process.env.JWT_SECRET_KEY);
  const decodedToken = jwtDecode(tokenObject.token);
  const expiresAt = decodedToken.exp;

  res.cookie("token", tokenObject.token, {
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN,
    maxAge: expiresAt,
  });

  res.status(200).json({
    success: true,
    message: "Login Successful.",
    expiresAt: expiresAt,
    userInfo: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
});

//Forgot Password
router.post("/forgotPassword", async (req, res) => {
  //Validation
  const { error } = forgotPasswordValidation(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const email = req.body.email.toLowerCase();

  //Checking if doesn't email exists
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "This email is not registered",
    });
  }

  //Since email exist, generate one time password reset link
  const secret_key = process.env.JWT_SECRET_KEY + user.password;

  const token = issueJWT(user, secret_key).token;
  const link = `${process.env.FRONTEND_URL}/reset-password/${user.id}/${token}`;

  const emailSubject = "Reset your password";

  const emailMessage = `
  <center>
  <h1>Password Reset Instructions</h1>
  <p>
    It looks like you forgot your password. You can choose a new one by clicking
    the button below:
  </p>
  <div style="text-align: center;">
    <button style="background-color: purple; color: white; padding: 8px 16px;">
      <a href="${link}" style="text-decoration:none;  color: white;">
        Change my password
      </a>
    </button>
  </div>
</center>
  `;

  //Send mail
  sendEmail(user.email, emailSubject, emailMessage);

  return res.status(400).json({
    success: true,
    message: "Password reset email has been sent to your registered email",
  });
});

//Validate Reset Link
router.post("/validateResetLink", async (req, res) => {
  const { id, token } = req.body;

  //Check if user id exists
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid reset link.",
    });
  }

  const secret = process.env.JWT_SECRET_KEY + user.password;
  try {
    const payload = jwt.verify(token, secret);
    return res.status(200).json({
      success: true,
      message: "Valid reset link",
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: "Invalid reset link.",
    });
  }
});

//Reset Password
router.post("/resetPassword", async (req, res) => {
  //Validation
  const { error } = resetPasswordValidation(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { id, password } = req.body;

  const user = await User.findOne({ _id: id });

  //Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //Update Password
  try {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        password: hashedPassword,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (e) {
    return res.status(400).json({
      success: true,
      message: "Something went wrong. Please try again.",
    });
  }
});

router.use(csrfProtection);

router.get("/csrf-token", (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
  });
});

const attachUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Authentication invalid" });
  }
  const decodedToken = jwtDecode(token);

  if (!decodedToken) {
    return res.status(401).json({
      message: "There was a problem authorizing the request",
    });
  } else {
    req.userId = decodedToken.sub;
    next();
  }
};

router.use(attachUser);


router.get("/paymentStatus", async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne({ _id: userId })

    return res.status(200).json({
      success: true,
      paymentStatus: user.payment.status,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
})

module.exports = router;
