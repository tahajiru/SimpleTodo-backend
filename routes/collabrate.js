const express = require("express");
var mongoose = require("mongoose");
const router = express.Router();
const passport = require("passport");
const jwtDecode = require("jwt-decode");
const User = require("../models/User");
const List = require("../models/List");
const Notification = require("../models/Notification");
const UnregisteredUser = require("../models/UnregisteredUser");

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

//Invite a collabrator
router.post(
  "/addCollabrator",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const email = req.body.email.toLowerCase();

      //Fetching the user
      const user = await User.findOne({ _id: req.userId });

      //Checking collabrator with given email exists
      const collabrator = await User.findOne({ email });

      //Fetch the list
      const list = await List.findOne({ _id: req.body.listId });

      // Socket
      const socket = req.app.get("socketio");

      let collabratorId;

      //If the user is not regitered
      if (!collabrator) {
        // const id = mongoose.Types.ObjectId();

        // //Update Collabrator Id
        // collabratorId = id;

        // //Add an unregistered user
        // const unregisteredUser = new UnregisteredUser({
        //   email: email,
        //   userId: id,
        // });

        // await unregisteredUser.save();
        return res.status(200).json({
          success: false,
          message: "User not registered",
        });
      } else {
        collabratorId = collabrator._id;
      }

      if (!user._id.equals(collabratorId)) {
        const notification = new Notification({
          type: `approval_${list._id}`,
          sender: user._id,
          receiver: collabratorId,
          message: `${user.firstName} ${user.lastName} has invited you to join ${list.title}`,
        });

        //Save Notification
        notification.save();

        //Send Real-time Notification
        socket
          .to("User:" + collabratorId)
          .emit("recieve-notification", { notification });
      }

      //Add the collabrators to list
      await list.updateOne({
        $push: {
          collabrators: { user: collabratorId, status: req.body.status },
        },
      });

      //Fetch updated list
      const updatedList = await List.findOne({ _id: req.body.listId }).populate([
        {
          path: "tasks",
          select: [
            "_id",
            "completed",
            "description",
            "details",
            "dueDate",
            "recurring",
            "reminder",
          ],
        },
        {
          path: "collabrators",
          populate: {
            path: "user",
            select: ["firstName", "lastName", "email"],
          },
        },
      ]);

      //Send updated list to all collabrators
      updatedList.collabrators.forEach((collabrator) => {
        socket
          .to("User:" + collabrator.user._id)
          .emit("recieve-list", { list: updatedList });
      });

      res.status(200).json({
        success: true,
        message: "Collabrators added and invite notification sent",
        list: list,
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

router.post(
  "/acceptInvite",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      //Fetching the user
      const user = await User.findOne({ _id: req.userId });

      const list = await List.findOne({ _id: req.body.listId });

      // Socket
      const socket = req.app.get("socketio");

      //Add the list to the user
      await User.findOneAndUpdate(
        { _id: req.userId },
        { $push: { lists: { _id: req.body.listId } } }
      );

      //Update the collabrator status to accepted
      await List.findOneAndUpdate(
        {
          _id: req.body.listId,
          collabrators: {
            $elemMatch: {
              user: user._id,
            },
          },
        },
        {
          $set: {
            "collabrators.$.status": "approved",
          },
        }
      );
      const updatedList = await List.findOne({ _id: req.body.listId }).populate(
        [
          {
            path: "tasks",
            select: [
              "_id",
              "completed",
              "description",
              "details",
              "dueDate",
              "recurring",
              "reminder",
            ],
          },
          {
            path: "collabrators",
            populate: {
              path: "user",
              select: ["firstName", "lastName", "email"],
            },
          },
        ]
      );

      //Send notification to new collabrator
      let notification = new Notification({
        type: "text",
        sender: user._id,
        receiver: user._id,
        message: `You joined ${updatedList.title}`,
      });

      //Save Notification
      notification.save();

      //Send Real-time Notification
      socket
        .to("User:" + user._id)
        .emit("recieve-notification", { notification });

      //Send updated list and notification to all other collabrator

      updatedList.collabrators.forEach((collabrator) => {
        if (!user._id.equals(collabrator.user._id)) {
          notification = new Notification({
            type: "text",
            sender: user._id,
            receiver: collabrator.user._id,
            message: `${user.firstName} ${user.lastName} has joined ${list.title}`,
          });

          //Save Notification
          notification.save();

          //Send Real-time Notification
          socket
            .to("User:" + collabrator.user._id)
            .emit("recieve-notification", { notification });

          socket
            .to("User:" + collabrator.user._id)
            .emit("recieve-list", { list: updatedList });
        }
      });

      res.status(200).json({
        success: true,
        message: "Collabrator Added",
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

router.post(
  "/declineInvite",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Socket
      const socket = req.app.get("socketio");

      //Fetching the user
      const user = await User.findOne({ _id: req.userId });

      //Send Notification about invitation decline
      const notification = new Notification({
        type: "text",
        sender: user._id, //Id of user who declined invite
        receiver: req.body.userId, //Id of user who sent invite
        message: `${user.firstName} ${user.lastName} has declined your invite.`,
      });

      notification.save();

      //Send Real-time Notification
      socket
        .to("User:" + req.body.userId)
        .emit("recieve-notification", { notification });

      //Remove user from collabrator list
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        { $pull: { collabrators: { user: { _id: user._id } } } }
      );

      const updatedList = await List.findOne({ _id: req.body.listId }).populate(
        [
          {
            path: "tasks",
            select: [
              "_id",
              "completed",
              "description",
              "details",
              "dueDate",
              "recurring",
              "reminder",
            ],
          },
          {
            path: "collabrators",
            populate: {
              path: "user",
              select: ["firstName", "lastName", "email"],
            },
          },
        ]
      );

      //Send updated list to all collabrators
      updatedList.collabrators.forEach((collabrator) => {
        socket
          .to("User:" + collabrator.user._id)
          .emit("recieve-list", { list: updatedList });
      });

      res.status(200).json({
        success: true,
        message: "Invite Declined",
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

//Invite a collabrator
router.post(
  "/removeCollabrator",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const email = req.body.email.toLowerCase();

      //Fetching the collabrator
      const collabratorToBeRemoved = await User.findOne({ email: email });

      //Fetching the collabrator
      const user = await User.findOne({ _id: req.userId });

      // Socket
      const socket = req.app.get("socketio");

      //Remove list from collabrator
      await User.findOneAndUpdate(
        { _id: collabratorToBeRemoved._id },
        { $pull: { lists: req.body.listId } }
      );

      //Remove user from collabrator list
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        {
          $pull: {
            collabrators: { user: { _id: collabratorToBeRemoved._id } },
          },
        }
      );

      //Send socketio update to collabrator
      socket
        .to("User:" + collabratorToBeRemoved._id)
        .emit("remove-list", { listId: req.body.listId });

      //Send notification and updated list to all other collabrators
      const updatedList = await List.findOne({ _id: req.body.listId }).populate(
        [
          {
            path: "tasks",
            select: [
              "_id",
              "completed",
              "description",
              "details",
              "dueDate",
              "recurring",
              "reminder",
            ],
          },
          {
            path: "collabrators",
            populate: {
              path: "user",
              select: ["firstName", "lastName", "email"],
            },
          },
        ]
      );

      updatedList.collabrators.forEach((collabrator) => {
        let notification;
        if (!user._id.equals(collabratorToBeRemoved._id)) {
          notification = new Notification({
            type: "text",
            sender: user._id,
            receiver: collabrator.user._id,
            message: `${user.firstName} ${user.lastName} has removed ${collabratorToBeRemoved.firstName} ${collabratorToBeRemoved.lastName} from ${updatedList.title}`,
          });
        } else {
          notification = new Notification({
            type: "text",
            sender: user._id,
            receiver: collabrator.user._id,
            message: `${user.firstName} ${user.lastName} has left ${updatedList.title}`,
          });
        }

        //Save Notification
        notification.save();

        //Send Real-time Notification
        socket
          .to("User:" + collabrator.user._id)
          .emit("recieve-notification", { notification });

        socket
          .to("User:" + collabrator.user._id)
          .emit("recieve-list", { list: updatedList });
      });

      res.status(200).json({
        success: true,
        message: "Removed Collabrator",
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

module.exports = router;
