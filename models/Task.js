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
  reminder: {
    date: { type: Date, default: null },
    jobId: { type: mongoose.Types.ObjectId, default: null },
  },
});

module.exports = mongoose.model("Task", TaskSchema);
