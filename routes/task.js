const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const User = require("../models/User");
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

//Add Task
router.post(
  "/add",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      //Create a new task
      const task = new Task({
        description: req.body.description,
        completed: req.body.completed,
        time: req.body.time,
      });

      await task.save();

      await User.findOneAndUpdate(
        { _id: userId },
        { $push: { tasks: { _id: task._id } } }
      );

      res.status(200).json({
        success: true,
        message: "Task added",
        task: task,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Get all tasks
router.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      const user = await User.findOne({ _id: userId }).populate("tasks");

      res.status(200).json({
        success: true,
        tasks: user.tasks,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Update task description
router.put(
  "/updateDescription",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Update task description
      await Task.findOneAndUpdate(
        { _id: req.body.id },
        {
          description: req.body.description,
        }
      );

      res.status(200).json({
        success: true,
        message: "Task updated",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Update task completion
router.put(
  "/updateCompletion",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Update task completion
      await Task.findOneAndUpdate(
        { _id: req.body.id },
        {
          completed: req.body.completed,
        }
      );

      res.status(200).json({
        success: true,
        message: "Task updated",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//Delete a task
router.post(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.userId;

      //Delete the task
      await Task.findOneAndDelete({ _id: req.body.id });

      //Remove the  task from user
      await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { tasks: { _id: req.body.id } } }
      );

      res.status(200).json({
        success: true,
        message: "Task deleted",
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
