const mongoose = require("mongoose");

const TaskSchema = mongoose.Schema({
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
  details: { type: String },
});

module.exports = mongoose.model("Task", TaskSchema);
