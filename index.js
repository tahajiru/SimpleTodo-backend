const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const app = express();
var server = require("http").createServer(app);

const PORT = process.env.PORT || 5000;

//Setup dotenv to access variables set in .env file
dotenv.config();

//Import Route
const userRoute = require("./routes/user");
const listRoute = require("./routes/list");
const taskRoute = require("./routes/task");
const collabrateRoute = require("./routes/collabrate");
const notificationRoute = require("./routes/notification");

//Connect to db
require("./config/database");

// Pass the global passport object into the configuration function
require("./config/passport")(passport);

// This will initialize the passport object on every request
app.use(passport.initialize());

// Socket
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
  },
  withCredentials: true,
});
require("./config/socket")(io);
app.set("socketio", io);

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Allows our Frontend application to make HTTP requests to Express application
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
    credentials: true,
  })
);

//Route Middleware
app.use("/user", userRoute);
app.use("/list", listRoute);
app.use("/task", taskRoute);
app.use("/collabrate", collabrateRoute);
app.use("/notification", notificationRoute);
//HTTP Server
server.listen(PORT, () => console.log(`Server is up on port ${PORT}.`));
