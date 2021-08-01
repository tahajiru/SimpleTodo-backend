module.exports = (server) => {
  var io = require("socket.io")(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE"],
    },
    withCredentials: true,
  });

  //Socket.io server
  io.on("connection", (socket) => {
    console.log("connected");

    //Add Task
    socket.on("send-add-task", (taskInfo) => {
      socket.broadcast.emit("recieve-add-task", taskInfo);
    });

    //Delete Task
    socket.on("send-delete-task", (taskInfo) => {
      socket.broadcast.emit("recieve-delete-task", taskInfo);
    });

    // //Add Collabrator
    // socket.on("send-add-collabrator", (listInfo) => {
    //   console.log(listInfo);
    //   //socket.broadcast.emit("recieve-delete-task", taskInfo);
    // });
  });
};
