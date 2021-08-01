const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  type: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  message: { type: String, required: true },
  read_by: [
    {
      readerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
