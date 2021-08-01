const mongoose = require("mongoose");

const listSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: { type: Date, default: Date.now },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  ],

  collabrators: [
    {
      collabrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: { type: String, default: "pending" },
    },
  ],
});

module.exports = mongoose.model("List", listSchema);
