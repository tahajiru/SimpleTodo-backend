const mongoose = require("mongoose");

// Connect to the correct environment database
mongoose.connect(
  process.env.DB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Connected to db")
);
