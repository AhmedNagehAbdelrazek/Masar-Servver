"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendSeatLock = exports.releaseSeatLock = exports.checkSeatLock = exports.acquireSeatLock = exports.getSeatLockKey = exports.SEAT_LOCK_TTL = exports.SEAT_LOCK_PREFIX = void 0;
const redis_1 = require("../config/redis");
exports.SEAT_LOCK_PREFIX = 'seat_lock:';
exports.SEAT_LOCK_TTL = 300; // 5 minutes
/**
 * Generate Redis key for seat lock
 */
const getSeatLockKey = (tripId, seatNumber) => `${exports.SEAT_LOCK_PREFIX}${tripId}:${seatNumber}`;
exports.getSeatLockKey = getSeatLockKey;
/**
 * Acquire a seat lock for a passenger
 */
const acquireSeatLock = async (tripId, seatNumber, passengerId) => {
    const key = (0, exports.getSeatLockKey)(tripId, seatNumber);
    const now = Date.now();
    const expiresAt = new Date(now + exports.SEAT_LOCK_TTL * 1000);
    const lockData = JSON.stringify({
        passenger_id: passengerId,
        locked_at: now,
        expires_at: expiresAt.getTime(),
    });
    // SETNX with TTL - atomic operation
    const result = await redis_1.redis.set(key, lockData, 'EX', exports.SEAT_LOCK_TTL, 'NX');
    if (result === 'OK') {
        return { locked: true, expiresAt };
    }
    // Lock exists - check if it's expired (shouldn't happen with TTL, but safety check)
    const existing = await redis_1.redis.get(key);
    if (!existing) {
        // Lock expired between NX and GET - retry once
        const retry = await redis_1.redis.set(key, lockData, 'EX', exports.SEAT_LOCK_TTL, 'NX');
        if (retry === 'OK') {
            return { locked: true, expiresAt };
        }
    }
    return { locked: false, expiresAt: null };
};
exports.acquireSeatLock = acquireSeatLock;
/**
 * Check if a seat is currently locked
 */
const checkSeatLock = async (tripId, seatNumber) => {
    const key = (0, exports.getSeatLockKey)(tripId, seatNumber);
    const data = await redis_1.redis.get(key);
    if (!data) {
        return { locked: false, passengerId: null, expiresAt: null };
    }
    try {
        const parsed = JSON.parse(data);
        return {
            locked: true,
            passengerId: parsed.passenger_id,
            expiresAt: new Date(parsed.expires_at),
        };
    }
    catch (_err) {
        return { locked: false, passengerId: null, expiresAt: null };
    }
};
exports.checkSeatLock = checkSeatLock;
/**
 * Release a seat lock
 */
const releaseSeatLock = async (tripId, seatNumber) => {
    const key = (0, exports.getSeatLockKey)(tripId, seatNumber);
    const result = await redis_1.redis.del(key);
    return result > 0;
};
exports.releaseSeatLock = releaseSeatLock;
/**
 * Extend a seat lock TTL
 */
const extendSeatLock = async (tripId, seatNumber) => {
    const key = (0, exports.getSeatLockKey)(tripId, seatNumber);
    const result = await redis_1.redis.expire(key, exports.SEAT_LOCK_TTL);
    return result === 1;
};
exports.extendSeatLock = extendSeatLock;
const seatLock = {
    acquireSeatLock: exports.acquireSeatLock,
    checkSeatLock: exports.checkSeatLock,
    releaseSeatLock: exports.releaseSeatLock,
    extendSeatLock: exports.extendSeatLock,
    getSeatLockKey: exports.getSeatLockKey,
    SEAT_LOCK_TTL: exports.SEAT_LOCK_TTL,
};
exports.default = seatLock;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = {
        acquireSeatLock: exports.acquireSeatLock,
        checkSeatLock: exports.checkSeatLock,
        releaseSeatLock: exports.releaseSeatLock,
        extendSeatLock: exports.extendSeatLock,
        getSeatLockKey: exports.getSeatLockKey,
        SEAT_LOCK_TTL: exports.SEAT_LOCK_TTL,
    };
    // @ts-ignore
    module.exports.acquireSeatLock = exports.acquireSeatLock;
    // @ts-ignore
    module.exports.checkSeatLock = exports.checkSeatLock;
    // @ts-ignore
    module.exports.releaseSeatLock = exports.releaseSeatLock;
    // @ts-ignore
    module.exports.extendSeatLock = exports.extendSeatLock;
    // @ts-ignore
    module.exports.getSeatLockKey = exports.getSeatLockKey;
    // @ts-ignore
    module.exports.SEAT_LOCK_TTL = exports.SEAT_LOCK_TTL;
    // @ts-ignore
    module.exports.default = seatLock;
}
//# sourceMappingURL=seatLock.js.map