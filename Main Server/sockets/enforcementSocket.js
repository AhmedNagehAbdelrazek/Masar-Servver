const realtimeMetrics = require('../Services/realtimeMetrics');

/**
 * Enforcement (Requirement 8) is server-initiated: penalty issuance calls
 * `enforcementService.revoke`, which emits `enforcement:revoke` to
 * `user:{userId}` and force-disconnects the user's sockets. This module only
 * acknowledges client-side handling for observability; reconnect blocking is
 * handled at the handshake (socketAuth rejects suspended/banned users).
 */
module.exports = (io, socket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('enforcement:ack', () => {
    realtimeMetrics.recordEvent('enforcement:ack');
  });
};
