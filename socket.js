// socket.js
let io = null;
let onlineUsers = {};

module.exports = {
  init: (server) => {
    const socketIo = require('socket.io')(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io = socketIo;

socketIo.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register', (userId) => {
    onlineUsers[userId] = socket.id;

    // Notify only online users (excluding the newly connected one if you like)
    for (const [uid, sid] of Object.entries(onlineUsers)) {
      if (uid !== String(userId)) {
        socketIo.to(sid).emit('userStatusUpdate', {
          userId,
          status: 'Online',
        });
      }
    }
  });

  socket.on('messageRead', ({ sender_id, reader_id }) => {
    const senderSocket = onlineUsers[sender_id];
    if (senderSocket) {
      socketIo.to(senderSocket).emit('messagesRead', { sender_id, reader_id });
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId = null;

    for (const [uid, sid] of Object.entries(onlineUsers)) {
      if (sid === socket.id) {
        disconnectedUserId = uid;
        delete onlineUsers[uid];
        break;
      }
    }

    if (disconnectedUserId) {
      // Notify only the currently online users about the disconnection
      for (const sid of Object.values(onlineUsers)) {
        socketIo.to(sid).emit('userStatusUpdate', {
          userId: disconnectedUserId,
          status: 'Offline',
        });
      }
    }

    console.log('Socket disconnected:', socket.id);
  });
});


    return socketIo;
  },
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },
  onlineUsers,
};
