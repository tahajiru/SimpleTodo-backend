const mongoose = require("mongoose");

const TaskSchema = mongoose.Schema({
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
  time: { type: String, default: "none" },
});

module.exports = mongoose.model("Task", TaskSchema);
