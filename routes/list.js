const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const User = require("../models/User");
const List = require("../models/List");
const Task = require("../models/Task");

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

      const user = await User.findOne({ _id: userId }).populate({
        path: "lists",
        populate: [
          {
            path: "tasks",
            select: ["_id", "completed", "description"],
          },
          {
            path: "collabrators",
            populate: {
              path: "user",
              select: ["firstName", "lastName", "email"],
            },
          },
        ],
      });

      res.status(200).json({
        success: true,
        lists: user.lists,
        currentList: user.currentList ? user.currentList : null,
      });
    } catch (err) {
      console.log(err);
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
        list: list,
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

      //Remove all the tasks from list
      const list = await List.findOne({ _id: req.body.listId });

      list.tasks.forEach(async (task) => {
        //Delete the task
        await Task.findOneAndDelete({ _id: task });
      });

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

//reorder list
router.put(
  "/reorder",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const userId = req.userId;
    try {
      //Remove the List
      await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { lists: req.body.listId } }
      );

      //Add the list to proper position
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            lists: {
              $each: [req.body.listId],
              $position: req.body.position,
            },
          },
        }
      );

      res.status(200).json({
        success: true,
        message: "List position updated",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Update Currentlist
router.put(
  "/updateCurrentList",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const userId = req.userId;
    try {
      //Update the Current List
      await User.findOneAndUpdate(
        { _id: userId },
        {
          currentList: req.body.listId,
        }
      );

      res.status(200).json({
        success: true,
        message: "Current List updated",
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
