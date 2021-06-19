const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: { type: Date, default: Date.now },
  lists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
