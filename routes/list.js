const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const User = require("../models/User");
const List = require("../models/List");

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

//Get all lists
router.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      const user = await User.findOne({ _id: userId }).populate("lists");

      res.status(200).json({
        success: true,
        lists: user.lists,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Add a List
router.post(
  "/add",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      //Create a new list
      const list = new List({
        title: req.body.title,
      });

      await list.save();

      await User.findOneAndUpdate(
        { _id: userId },
        { $push: { lists: { _id: list._id } } }
      );

      res.status(200).json({
        success: true,
        message: "List added",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Update list title
router.put(
  "/updateTitle",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Update list title
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        {
          title: req.body.title,
        }
      );

      res.status(200).json({
        success: true,
        message: "List title updated",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Delete a list
router.post(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      //TODO: Remove all the tasks from list

      //Delete the list
      await List.findOneAndDelete({ _id: req.body.listId });

      //Remove the list from user
      await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { lists: req.body.listId } }
      );

      res.status(200).json({
        success: true,
        message: "list deleted",
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
