const { Server } = require('socket.io');

let ioInstance = null;

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  ioInstance = io;

  io.on('connection', (socket) => {
    const userId =
      (socket.handshake.auth && socket.handshake.auth.userId) ||
      (socket.handshake.query && socket.handshake.query.userId);

    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`Client connected: ${socket.id} (user:${userId})`);
    } else {
      console.log('Client connected:', socket.id);
    }

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  return ioInstance;
}

function emitToUser(userId, event, data) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

module.exports = { createSocketServer, getIO, emitToUser };
