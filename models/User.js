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
  currentList: {
    type: String,
  },
  payment: {
    customerId: { type: String, default: null },
    subscriptionId: { type: String, default: null },
    status: { type: String }
  }
});

module.exports = mongoose.model("User", userSchema);
