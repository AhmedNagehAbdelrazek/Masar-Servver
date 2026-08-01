const { Notification } = require('../../../Models');
const { getIO } = require('../../../socketServer');

/**
 * In-app channel.
 *
 * Persists a Notification row and pushes a live event to the user's
 * Socket.IO room (`user:{userId}`) when a socket server is available.
 */
async function send(user, message, data = {}) {
  if (!user || !user.id) return;

  const notification = await Notification.create({
    userId: user.id,
    type: message.type,
    title: message.title,
    body: message.body,
    data,
    sentVia: ['in_app'],
  });

  const io = getIO();
  if (io) {
    io.to(`user:${user.id}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      created_at: notification.createdat || notification.createdAt,
    });
  }

  return notification;
}

module.exports = { send };
