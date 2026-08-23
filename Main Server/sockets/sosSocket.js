const sosService = require('../Services/sosService');
const realtimeMetrics = require('../Services/realtimeMetrics');
const { checkRateLimit } = require('../Services/socketRateLimiter');
const { ok, errorFromApiError, rateLimited } = require('../utils/socketAck');

/**
 * SOS emergency alerts (Requirement 6). Repeat triggers during an active
 * event reuse the existing event (dedupe) without consuming the rate limit.
 */
module.exports = (io, socket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('sos:trigger', async (payload, ack) => {
    try {
      const active = await sosService.findActiveForUser(user.id);
      if (active) {
        return ack ? ack(ok({ sos_event_id: active.id, reused: true })) : undefined;
      }

      const rl = await checkRateLimit('sos', 'sos', user.id);
      if (!rl.allowed) {
        realtimeMetrics.recordRateLimited();
        return ack ? ack(rateLimited()) : undefined;
      }

      const result = await sosService.trigger(user, {
        tripId: payload ? payload.trip_id : undefined,
        lat: payload ? payload.lat : undefined,
        lng: payload ? payload.lng : undefined,
        urgency: payload ? payload.urgency : undefined,
      });
      return ack ? ack(ok(result)) : undefined;
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });
};
