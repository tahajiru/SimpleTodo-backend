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

/*
1. Check the email exists

2. If email exists
    2.1 Add the list to the new user


3. If email doesnt exists

*/

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
      ``;
      let collabratorId = collabrator._id;

      //If the user is not regitered
      if (!collabrator) {
        const id = mongoose.Types.ObjectId();

        //Update Collabrator Id
        collabratorId = id;

        //Add an unregistered user
        const unregisteredUser = new UnregisteredUser({
          email: email,
          userId: id,
        });

        await unregisteredUser.save();
      }

      if (user._id !== collabratorId) {
        const notification = new Notification({
          type: `approval_${list._id}`,
          sender: user._id,
          receiver: collabratorId,
          message: `${user.firstName} ${user.lastName} has invited you to join ${list.title}`,
        });

        //Save Notification
        notification.save();
      }

      //Add the collabrators to list
      await list.update({
        $push: {
          collabrators: { collabrator: collabratorId, status: "pending" },
        },
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
      //Add the list to the user
      await User.findOneAndUpdate(
        { _id: req.userId },
        { $push: { lists: { _id: req.body.listId } } }
      );

      //Add the collabrator id to the list
      await List.findOneAndUpdate(
        { _id: req.body.listId },
        { $push: { collabrators: { _id: req.userId } } }
      );

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

module.exports = router;
