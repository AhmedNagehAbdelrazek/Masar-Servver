const REDIS_KEYS = {
  SEAT_LOCK: (tripId, seatNumber) => `seat_lock:${tripId}:${seatNumber}`,
  DRIVER_DASHBOARD: (driverId) => `driver_dashboard:${driverId}`,
  TRIP_CACHE: (tripId) => `trip:${tripId}`,
  OTP: (phone) => `otp:${phone}`,
  REFRESH_TOKEN: (userId) => `refresh:${userId}`,
};

const CACHE_TTL = {
  DASHBOARD: 30, // 30 seconds
  TRIP: 60, // 60 seconds
  SEAT_LOCK: 300, // 5 minutes
};

module.exports = {
  REDIS_KEYS,
  CACHE_TTL,
};
