// : one flat loader, same fail-soft shape as config/redis.ts. No class, no schema lib.
const num = (v: string | undefined, d: number): number => {
  const n = v !== undefined ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
};

export const mapsConfig = {
  serverApiKey: process.env.GOOGLE_MAPS_SERVER_API_KEY || '',
  regionCode: process.env.GOOGLE_MAPS_REGION_CODE || 'jo',
  countryBias: process.env.GOOGLE_MAPS_COUNTRY_BIAS || 'jo',
  timeoutMs: num(process.env.GOOGLE_MAPS_TIMEOUT_MS, 5000),
  maxRetries: num(process.env.GOOGLE_MAPS_MAX_RETRIES, 2),
  mock: (process.env.MAPS_MOCK || 'true').toLowerCase() !== 'false',

  routeCacheTtlSeconds: num(process.env.ROUTE_CACHE_TTL_SECONDS, 86400),
  pickupMaxDistanceFromRouteM: num(process.env.PICKUP_MAX_DISTANCE_FROM_ROUTE_M, 1500),
  detourMaxSeconds: num(process.env.DETOUR_MAX_SECONDS, 600),
  pickupEditCutoffMinutes: num(process.env.PICKUP_EDIT_CUTOFF_MINUTES, 60),
  maxTripStops: num(process.env.MAX_TRIP_STOPS, 8),

  trackingIntervalSeconds: num(process.env.TRACKING_INTERVAL_SECONDS, 5),
  trackingBatchMaxPoints: num(process.env.TRACKING_BATCH_MAX_POINTS, 60),
  trackingMaxPointAgeSeconds: num(process.env.TRACKING_MAX_POINT_AGE_SECONDS, 300),
  proximityNearMeters: num(process.env.PROXIMITY_NEAR_METERS, 1000),
  proximityArrivedMeters: num(process.env.PROXIMITY_ARRIVED_METERS, 150),
  actualPathSimplifyToleranceM: num(process.env.ACTUAL_PATH_SIMPLIFY_TOLERANCE_M, 10),
} as const;

if (!mapsConfig.mock && !mapsConfig.serverApiKey) {
  throw new Error('GOOGLE_MAPS_SERVER_API_KEY is required when MAPS_MOCK=false');
}

export default mapsConfig;
