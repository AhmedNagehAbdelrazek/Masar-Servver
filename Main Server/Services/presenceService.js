const { setKey, getKey, deleteKey } = require('../config/redis');
const realtimeService = require('./realtimeService');
const realtimeMetrics = require('./realtimeMetrics');
const { ROLES } = require('../config/constants');

const PRESENCE_TTL_SECONDS = 60;
const GRACE_MS = 60 * 1000;

const pendingOffline = new Map();

function presenceKey(userId) {
  return `presence:${userId}`;
}

function emitStatus(userId, role, status, lastSeen) {
  const payload = {
    user_id: userId,
    status,
    last_seen: lastSeen,
    timestamp: Date.now(),
  };
  realtimeService.emitToRole(role, 'presence:status', payload);
  if (status === 'online' && role === ROLES.DRIVER) {
    realtimeService.emitToRole(ROLES.ADMIN, 'admin:driver_online', {
      driver_id: userId,
      lat: null,
      lng: null,
      timestamp: Date.now(),
    });
  }
  return payload;
}

/**
 * Marks a user online (Redis TTL-backed) and broadcasts `presence:status` to
 * their role room. Called on connection and on `presence:heartbeat`.
 */
async function markOnline(userId, role) {
  if (!userId) return null;
  await setKey(presenceKey(userId), 'online', PRESENCE_TTL_SECONDS);
  if (pendingOffline.has(userId)) {
    clearTimeout(pendingOffline.get(userId));
    pendingOffline.delete(userId);
  }
  const payload = emitStatus(userId, role, 'online', new Date().toISOString());
  realtimeMetrics.recordEvent('presence:online');
  return payload;
}

/**
 * Schedules the offline transition after the 60s grace period. If the user
 * reconnects before the timer fires, `markOnline` cancels it.
 */
function scheduleOffline(userId, role) {
  if (!userId) return;
  if (pendingOffline.has(userId)) {
    clearTimeout(pendingOffline.get(userId));
  }
  const timer = setTimeout(async () => {
    pendingOffline.delete(userId);
    try {
      await deleteKey(presenceKey(userId));
      const payload = emitStatus(userId, role, 'offline', new Date().toISOString());
      realtimeMetrics.recordEvent('presence:offline');
      return payload;
    } catch (err) {
      console.warn('[presence] offline transition failed:', err.message);
      return null;
    }
  }, GRACE_MS);
  pendingOffline.set(userId, timer);
}

/** Returns 'online' | 'offline' | null from Redis. */
async function getStatus(userId) {
  if (!userId) return 'offline';
  const value = await getKey(presenceKey(userId));
  return value === 'online' ? 'online' : 'offline';
}

module.exports = { markOnline, scheduleOffline, getStatus, PRESENCE_TTL_SECONDS, GRACE_MS };
