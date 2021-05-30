const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const { registerValidation, loginValidation } = require("../lib/validation");
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

  //Checking if email exists
  const emailExists = await User.findOne({ email: req.body.email });
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
    email: req.body.email,
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

  //Checking if doesn't email exists
  const user = await User.findOne({ email: req.body.email });
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

  const tokenObject = issueJWT(user);
  decodedToken = jwtDecode(tokenObject.token);
  const expiresAt = decodedToken.exp;

  res.cookie("token", tokenObject.token, {
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN,
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

router.use(csrfProtection);

router.get("/csrf-token", (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
  });
});

module.exports = router;
