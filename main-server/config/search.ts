// Proximity trip search tunables (spec 013 P1/P2). Mirrors
// nest-server/src/config/search.config.ts so v1 and v2 behave the same.
const num = (v: string | undefined, d: number): number => {
  const n = v !== undefined ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
};

const bool = (v: string | undefined, d: boolean): boolean => {
  if (v === undefined) return d;
  return ['true', '1', 'yes', 'on'].includes(v.toLowerCase());
};

export const searchConfig = {
  pickupRadiusM: num(process.env.SEARCH_PICKUP_RADIUS_M, 2000),
  dropoffRadiusM: num(process.env.SEARCH_DROPOFF_RADIUS_M, 2000),
  maxRadiusM: num(process.env.SEARCH_MAX_RADIUS_M, 10000),
  corridorM: num(
    process.env.SEARCH_CORRIDOR_M,
    num(process.env.PICKUP_MAX_DISTANCE_FROM_ROUTE_M, 1500),
  ),
  includeEnroute: bool(process.env.SEARCH_INCLUDE_ENROUTE, true),
  allowCustomDropoff: bool(process.env.SEARCH_ALLOW_CUSTOM_DROPOFF, true),
  autoWiden: bool(process.env.SEARCH_AUTO_WIDEN, true),
  widenFactor: num(process.env.SEARCH_WIDEN_FACTOR, 2.5),
  minRideM: num(process.env.SEARCH_MIN_RIDE_M, 200),
  maxCandidates: num(process.env.SEARCH_MAX_CANDIDATES, 5000),
} as const;

export default searchConfig;
