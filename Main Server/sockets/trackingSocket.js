const trackingService = require('../Services/trackingService');
const realtimeMetrics = require('../Services/realtimeMetrics');
const { checkRateLimit } = require('../Services/socketRateLimiter');
const { ok, errorFromApiError, rateLimited } = require('../utils/socketAck');

/**
 * Live trip tracking (Requirement 4). Driver shares location to the
 * `trip:{tripId}` room; passengers join the same room via `chat:join`.
 * Location pings are rate-limited (1 / 2s) and persisted before broadcast.
 */
module.exports = (io, socket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('tracking:start', async (payload, ack) => {
    try {
      const result = await trackingService.startTracking(user, payload ? payload.trip_id : undefined);
      return ack ? ack(ok(result)) : undefined;
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });

  socket.on('tracking:location', async (payload, ack) => {
    // TODO: use cache to track the latest location
    try {
      const rl = await checkRateLimit('tracking', 'location', user.id);
      if (!rl.allowed) {
        realtimeMetrics.recordRateLimited();
        return ack ? ack(rateLimited()) : undefined;
      }
      const result = await trackingService.updateLocation(user, {
        tripId: payload ? payload.trip_id : undefined,
        lat: payload ? payload.lat : undefined,
        lng: payload ? payload.lng : undefined,
        speed: payload ? payload.speed : undefined,
        heading: payload ? payload.heading : undefined,
      });
      return ack ? ack(ok(result)) : undefined;
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });

  socket.on('tracking:stop', async (payload, ack) => {
    try {
      const result = await trackingService.stopTracking(user, payload ? payload.trip_id : undefined);
      return ack ? ack(ok(result)) : undefined;
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });
};
