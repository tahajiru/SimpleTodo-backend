const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  type: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  message: { type: String, required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
