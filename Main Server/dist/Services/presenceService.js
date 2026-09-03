"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRACE_MS = exports.PRESENCE_TTL_SECONDS = void 0;
exports.markOnline = markOnline;
exports.scheduleOffline = scheduleOffline;
exports.getStatus = getStatus;
// @ts-nocheck
const redis_1 = require("../config/redis");
const realtimeService_1 = __importDefault(require("./realtimeService"));
const realtimeMetrics_1 = __importDefault(require("./realtimeMetrics"));
const constants_1 = require("../config/constants");
const PRESENCE_TTL_SECONDS = 60;
exports.PRESENCE_TTL_SECONDS = PRESENCE_TTL_SECONDS;
const GRACE_MS = 60 * 1000;
exports.GRACE_MS = GRACE_MS;
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
    realtimeService_1.default.emitToRole(role, 'presence:status', payload);
    if (status === 'online' && role === constants_1.ROLES.DRIVER) {
        realtimeService_1.default.emitToRole(constants_1.ROLES.ADMIN, 'admin:driver_online', {
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
    if (!userId)
        return null;
    await (0, redis_1.setKey)(presenceKey(userId), 'online', PRESENCE_TTL_SECONDS);
    if (pendingOffline.has(userId)) {
        clearTimeout(pendingOffline.get(userId));
        pendingOffline.delete(userId);
    }
    const payload = emitStatus(userId, role, 'online', new Date().toISOString());
    realtimeMetrics_1.default.recordEvent('presence:online');
    return payload;
}
/**
 * Schedules the offline transition after the 60s grace period. If the user
 * reconnects before the timer fires, `markOnline` cancels it.
 */
function scheduleOffline(userId, role) {
    if (!userId)
        return;
    if (pendingOffline.has(userId)) {
        clearTimeout(pendingOffline.get(userId));
    }
    const timer = setTimeout(async () => {
        pendingOffline.delete(userId);
        try {
            await (0, redis_1.deleteKey)(presenceKey(userId));
            const payload = emitStatus(userId, role, 'offline', new Date().toISOString());
            realtimeMetrics_1.default.recordEvent('presence:offline');
            return payload;
        }
        catch (err) {
            console.warn('[presence] offline transition failed:', err.message);
            return null;
        }
    }, GRACE_MS);
    pendingOffline.set(userId, timer);
}
/** Returns 'online' | 'offline' | null from Redis. */
async function getStatus(userId) {
    if (!userId)
        return 'offline';
    const value = await (0, redis_1.getKey)(presenceKey(userId));
    return value === 'online' ? 'online' : 'offline';
}
module.exports = { markOnline, scheduleOffline, getStatus, PRESENCE_TTL_SECONDS, GRACE_MS };
exports.default = module.exports;
//# sourceMappingURL=presenceService.js.map