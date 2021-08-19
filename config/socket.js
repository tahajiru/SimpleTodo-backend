module.exports = (io) => {
  //Socket.io server
  io.on("connection", (socket) => {
    //Join room
    socket.on("join", (data) => {
      socket.join("User:" + data.id);
    });

    //Add Task
    socket.on("send-add-task", (taskInfo) => {
      if (taskInfo.collabrators) {
        taskInfo.collabrators.forEach((collabrator) => {
          socket
            .to("User:" + collabrator.user._id)
            .emit("recieve-add-task", taskInfo);
        });
      } else {
        socket.to("User:" + taskInfo.userId).emit("recieve-add-task", taskInfo);
      }
    });

    //Delete Task
    socket.on("send-delete-task", (taskInfo) => {
      if (taskInfo.collabrators) {
        taskInfo.collabrators.forEach((collabrator) => {
          socket
            .to("User:" + collabrator.user._id)
            .emit("recieve-delete-task", taskInfo);
        });
      } else {
        socket
          .to("User:" + taskInfo.userId)
          .emit("recieve-delete-task", taskInfo);
      }
    });

    //Update Task
    socket.on("send-update-task", (taskInfo) => {
      if (taskInfo.collabrators) {
        taskInfo.collabrators.forEach((collabrator) => {
          socket
            .to("User:" + collabrator.user._id)
            .emit("recieve-update-task", taskInfo);
        });
      } else {
        socket
          .to("User:" + taskInfo.userId)
          .emit("recieve-update-task", taskInfo);
      }
    });
  });
};
