const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../models/User");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
} = require("../lib/validation");
const { issueJWT } = require("../lib/utils");
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

  try {
    const savedUser = await user.save();
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

  const tokenObject = issueJWT(user, env.process.JWT_SECRET_KEY);
  decodedToken = jwtDecode(tokenObject.token);
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

  //TODO: Send mail
  console.log(link);

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
      message: "id not found",
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
      message: "Not a valid reset link.",
    });
  }
});

//Reset Password
router.post("/resetPassword", async (req, res) => {
  //Validation
  // const { error } = forgotPasswordValidation(req.body);
  // if (error) {
  //   return res.status(400).json({
  //     success: false,
  //     message: error.details[0].message,
  //   });
  // }

  const id = "wda";
  //Check if user id exists
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "This email is not registered",
    });
  }

  const secret = process.env.JWT_SECRET_KEY + user.password;
  try {
    const payload = jwt.verify(token, secret);
    //Update new password
  } catch (e) {}
});

router.use(csrfProtection);

router.get("/csrf-token", (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
  });
});

module.exports = router;
