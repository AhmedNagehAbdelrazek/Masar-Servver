const presenceService = require('../Services/presenceService');
const { ok } = require('../utils/socketAck');

/**
 * Presence (Requirement 7): marks the user online on connect/heartbeat and
 * schedules the offline transition after the 60s grace period once the last
 * socket disconnects.
 */
module.exports = (io, socket) => {
  const user = socket.data.user;
  if (!user) return;

  presenceService.markOnline(user.id, user.role).catch(() => {});

  socket.on('presence:heartbeat', async (payload, ack) => {
    try {
      await presenceService.markOnline(user.id, user.role);
      if (ack) ack(ok({ status: 'online' }));
    } catch (_err) {
      if (ack) ack(ok({ status: 'online' }));
    }
  });

  socket.on('disconnect', () => {
    presenceService.scheduleOffline(user.id, user.role);
  });
};
