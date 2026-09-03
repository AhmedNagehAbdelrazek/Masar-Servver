"use strict";
const { redis } = require('../config/redis');
const SEAT_LOCK_PREFIX = 'seat_lock:';
const SEAT_LOCK_TTL = 300; // 5 minutes
/**
 * Generate Redis key for seat lock
 * @param {string} tripId
 * @param {number} seatNumber
 * @returns {string}
 */
const getSeatLockKey = (tripId, seatNumber) => `${SEAT_LOCK_PREFIX}${tripId}:${seatNumber}`;
/**
 * Acquire a seat lock for a passenger
 * @param {string} tripId
 * @param {number} seatNumber
 * @param {string} passengerId
 * @returns {Promise<{locked: boolean, expiresAt: Date|null}>}
 */
const acquireSeatLock = async (tripId, seatNumber, passengerId) => {
    const key = getSeatLockKey(tripId, seatNumber);
    const now = Date.now();
    const expiresAt = new Date(now + SEAT_LOCK_TTL * 1000);
    const lockData = JSON.stringify({
        passenger_id: passengerId,
        locked_at: now,
        expires_at: expiresAt.getTime(),
    });
    // SETNX with TTL - atomic operation
    const result = await redis.set(key, lockData, 'EX', SEAT_LOCK_TTL, 'NX');
    if (result === 'OK') {
        return { locked: true, expiresAt };
    }
    // Lock exists - check if it's expired (shouldn't happen with TTL, but safety check)
    const existing = await redis.get(key);
    if (!existing) {
        // Lock expired between NX and GET - retry once
        const retry = await redis.set(key, lockData, 'EX', SEAT_LOCK_TTL, 'NX');
        if (retry === 'OK') {
            return { locked: true, expiresAt };
        }
    }
    return { locked: false, expiresAt: null };
};
/**
 * Check if a seat is currently locked
 * @param {string} tripId
 * @param {number} seatNumber
 * @returns {Promise<{locked: boolean, passengerId: string|null, expiresAt: Date|null}>}
 */
const checkSeatLock = async (tripId, seatNumber) => {
    const key = getSeatLockKey(tripId, seatNumber);
    const data = await redis.get(key);
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
/**
 * Release a seat lock
 * @param {string} tripId
 * @param {number} seatNumber
 * @returns {Promise<boolean>}
 */
const releaseSeatLock = async (tripId, seatNumber) => {
    const key = getSeatLockKey(tripId, seatNumber);
    const result = await redis.del(key);
    return result > 0;
};
/**
 * Extend a seat lock TTL
 * @param {string} tripId
 * @param {number} seatNumber
 * @returns {Promise<boolean>}
 */
const extendSeatLock = async (tripId, seatNumber) => {
    const key = getSeatLockKey(tripId, seatNumber);
    const result = await redis.expire(key, SEAT_LOCK_TTL);
    return result === 1;
};
module.exports = {
    acquireSeatLock,
    checkSeatLock,
    releaseSeatLock,
    extendSeatLock,
    getSeatLockKey,
    SEAT_LOCK_TTL,
};
//# sourceMappingURL=seatLock.js.map