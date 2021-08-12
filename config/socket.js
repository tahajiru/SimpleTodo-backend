module.exports = (io) => {
  //Socket.io server
  io.on("connection", (socket) => {
    //Join room
    socket.on("join", (data) => {
      socket.join("User:" + data.id);
    });

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
