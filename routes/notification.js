const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const User = require("../models/User");
const Notification = require("../models/Notification");

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

//Get all notification
router.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      const notifications = await Notification.find({ receiver: userId });

      res.status(200).json({
        success: true,
        notifications: notifications,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Delete notification
router.post(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await Notification.findOneAndDelete({
        _id: req.body.notificationId,
      });

      res.status(200).json({
        success: true,
        message: "Notification Deleted",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

module.exports = router;
