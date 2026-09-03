"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.REDIS_KEYS = void 0;
exports.REDIS_KEYS = {
    SEAT_LOCK: (tripId, seatNumber) => `seat_lock:${tripId}:${seatNumber}`,
    DRIVER_DASHBOARD: (driverId) => `driver_dashboard:${driverId}`,
    DRIVER_HOME: (driverId) => `driver_home:${driverId}`,
    PASSENGER_HOME: (passengerId) => `passenger_home:${passengerId}`,
    TRIP_CACHE: (tripId) => `trip:${tripId}`,
    OTP: (phone) => `otp:${phone}`,
    REFRESH_TOKEN: (userId) => `refresh:${userId}`,
    PLANS_ACTIVE: 'plans:active',
};
exports.CACHE_TTL = {
    DASHBOARD: 30, // 30 seconds
    HOME: 30, // 30 seconds
    TRIP: 60, // 60 seconds
    SEAT_LOCK: 300, // 5 minutes
    PLANS: 60, // 60 seconds
};
const redisKeys = { REDIS_KEYS: exports.REDIS_KEYS, CACHE_TTL: exports.CACHE_TTL };
exports.default = redisKeys;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { REDIS_KEYS: exports.REDIS_KEYS, CACHE_TTL: exports.CACHE_TTL };
    // @ts-ignore
    module.exports.REDIS_KEYS = exports.REDIS_KEYS;
    // @ts-ignore
    module.exports.CACHE_TTL = exports.CACHE_TTL;
    // @ts-ignore
    module.exports.default = redisKeys;
}
//# sourceMappingURL=redisKeys.js.map