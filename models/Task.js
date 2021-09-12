const mongoose = require("mongoose");

const TaskSchema = mongoose.Schema({
  description: { type: String, required: true },
  completed: { type: Boolean, default: false },
  details: { type: String },
  dueDate: {
    date: { type: Date, default: null },
    time: { type: Date, default: null },
  },
  recurring: {
    type: { type: String },
    repeat: {
      every: { type: Number },
      on: { type: Object },
    },
    end: { type: Object },
  },
});

module.exports = mongoose.model("Task", TaskSchema);
