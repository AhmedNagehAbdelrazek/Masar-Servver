// @ts-nocheck
import { incr, redis } from '../config/redis';

/**
 * Per-socket fixed-window rate limits, enforced on top of the global auth.
 * Limits are keyed by user so a user cannot bypass them by opening multiple
 * connections.
 */
const LIMITS = {
  chat: { max: 10, windowSeconds: 10 },
  location: { max: 1, windowSeconds: 2 },
  presence: { max: 60, windowSeconds: 60 },
  sos: { max: 5, windowSeconds: 60 },
  typing: { max: 20, windowSeconds: 10 },
  read: { max: 60, windowSeconds: 10 },
  supportChat: { max: 10, windowSeconds: 10 },
  admin: { max: 60, windowSeconds: 60 },
};

/**
 * Checks the limit for `userId` under `scope`+`limitKey`. Returns
 * { allowed, count, limit, remaining }. Fails OPEN (allows the request) when
 * Redis is unavailable so a Redis outage does not take down chat/SOS; the
 * failure is logged.
 */
async function checkRateLimit(scope, limitKey, userId) {
  const { max, windowSeconds } = LIMITS[limitKey] || { max: 30, windowSeconds: 60 };
  const key = `ratelimit:${scope}:${limitKey}:${userId}`;

  try {
    const count = await incr(key);
    if (count === 1) {
      try {
        await redis.expire(key, windowSeconds);
      } catch (err) {
        console.warn('[socketRateLimiter] failed to set TTL:', err.message);
      }
    }
    return {
      allowed: count <= max,
      count,
      limit: max,
      remaining: Math.max(0, max - count),
    };
  } catch (err) {
    console.warn('[socketRateLimiter] redis unavailable, failing open:', err.message);
    return { allowed: true, count: 0, limit: max, remaining: max };
  }
}

module.exports = { checkRateLimit, LIMITS };
export { checkRateLimit, LIMITS };
export default module.exports;