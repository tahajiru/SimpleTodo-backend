const mongoose = require("mongoose");

const unregisteredUserSchema = mongoose.Schema({
  email: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
});

module.exports = mongoose.model("UnregisteredUser", unregisteredUserSchema);
