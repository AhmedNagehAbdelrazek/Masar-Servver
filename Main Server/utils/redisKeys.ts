export const REDIS_KEYS = {
  SEAT_LOCK: (tripId: string, seatNumber: number | string): string => `seat_lock:${tripId}:${seatNumber}`,
  DRIVER_DASHBOARD: (driverId: string): string => `driver_dashboard:${driverId}`,
  DRIVER_HOME: (driverId: string): string => `driver_home:${driverId}`,
  PASSENGER_HOME: (passengerId: string): string => `passenger_home:${passengerId}`,
  TRIP_CACHE: (tripId: string): string => `trip:${tripId}`,
  OTP: (phone: string): string => `otp:${phone}`,
  REFRESH_TOKEN: (userId: string): string => `refresh:${userId}`,
  PLANS_ACTIVE: 'plans:active',
} as const;

export const CACHE_TTL = {
  DASHBOARD: 30, // 30 seconds
  HOME: 30, // 30 seconds
  TRIP: 60, // 60 seconds
  SEAT_LOCK: 300, // 5 minutes
  PLANS: 60, // 60 seconds
} as const;

export type RedisKeys = typeof REDIS_KEYS;
export type CacheTtl = typeof CACHE_TTL;

const redisKeys = { REDIS_KEYS, CACHE_TTL };
export default redisKeys;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { REDIS_KEYS, CACHE_TTL };
  // @ts-ignore
  module.exports.REDIS_KEYS = REDIS_KEYS;
  // @ts-ignore
  module.exports.CACHE_TTL = CACHE_TTL;
  // @ts-ignore
  module.exports.default = redisKeys;
}
