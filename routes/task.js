const express = require("express");
const router = express.Router();
const passport = require("passport");
const Task = require("../models/Task");
const List = require("../models/List");
const { sanitizeText } = require("../lib/utils");

//Add Task
router.post(
  "/add",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const description = await sanitizeText(req.body.description);
      const details = req.body.details
        ? await sanitizeText(req.body.details)
        : "";

      //Create a new task
      const task = new Task({
        description: description,
        completed: req.body.completed,
        details: details,
        dueDate: req.body.dueDate,
        recurring: req.body.recurring,
      });

      await task.save();

      await List.findOneAndUpdate(
        { _id: req.body.listId },
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
      const list = await List.findOne({ _id: req.body.listId }).populate(
        "tasks"
      );

      res.status(200).json({
        success: true,
        tasks: list.tasks,
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
  "/updateTask",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Update task description
      await Task.findOneAndUpdate(
        { _id: req.body.taskId },
        {
          description: req.body.description,
          details: req.body.details,
          dueDate: req.body.dueDate,
          recurring: req.body.recurring,
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
        { _id: req.body.taskId },
        {
          completed: req.body.completed,
        }
      );

      //Remove the task
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        { $pull: { tasks: req.body.taskId } }
      );

      //Add the task to proper position
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        {
          $push: {
            tasks: {
              $each: [req.body.taskId],
              $position: req.body.position,
            },
          },
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
      //Delete the task
      await Task.findOneAndDelete({ _id: req.body.taskId });

      //Remove the  task from list
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        { $pull: { tasks: req.body.taskId } }
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

//reorder task
router.put(
  "/reorder",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Remove the task
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        { $pull: { tasks: req.body.taskId } }
      );

      //Add the task to proper position
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        {
          $push: {
            tasks: {
              $each: [req.body.taskId],
              $position: req.body.position,
            },
          },
        }
      );

      res.status(200).json({
        success: true,
        message: "Task position updated",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }
);

//undo a deleted task
router.post(
  "/undoDelete",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Create a new task
      const task = new Task(req.body.task);

      await task.save();

      //Add the task to proper position
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        {
          $push: {
            tasks: {
              $each: [task._id],
              $position: req.body.position,
            },
          },
        }
      );

      res.status(200).json({
        success: true,
        message: "Undo Successful",
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

module.exports = router;
