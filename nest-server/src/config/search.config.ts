// Proximity search tunables (spec 013 P1). Kept separate from maps config
// because these are search/match rules, not routing rules, even though the
// corridor default mirrors PICKUP_MAX_DISTANCE_FROM_ROUTE_M.
function num(v: string | undefined, d: number): number {
  const n = v !== undefined ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
}

function bool(v: string | undefined, d: boolean): boolean {
  if (v === undefined) return d;
  return ['true', '1', 'yes', 'on'].includes(v.toLowerCase());
}

export interface SearchConfig {
  pickupRadiusM: number;
  dropoffRadiusM: number;
  maxRadiusM: number;
  corridorM: number;
  includeEnroute: boolean;
  allowCustomDropoff: boolean;
  autoWiden: boolean;
  widenFactor: number;
  minRideM: number;
  maxCandidates: number;
}

export function getSearchConfig(): SearchConfig {
  return {
    pickupRadiusM: num(process.env.SEARCH_PICKUP_RADIUS_M, 2000),
    dropoffRadiusM: num(process.env.SEARCH_DROPOFF_RADIUS_M, 2000),
    maxRadiusM: num(process.env.SEARCH_MAX_RADIUS_M, 10000),
    corridorM: num(
      process.env.SEARCH_CORRIDOR_M,
      num(process.env.PICKUP_MAX_DISTANCE_FROM_ROUTE_M, 1500),
    ),
    includeEnroute: bool(process.env.SEARCH_INCLUDE_ENROUTE, true),
    // Booking currently accepts a custom dropoff point (bookings.service.ts),
    // so search mirrors that. Flip to false when dropoff becomes stop-only.
    allowCustomDropoff: bool(process.env.SEARCH_ALLOW_CUSTOM_DROPOFF, true),
    autoWiden: bool(process.env.SEARCH_AUTO_WIDEN, true),
    widenFactor: num(process.env.SEARCH_WIDEN_FACTOR, 2.5),
    minRideM: num(process.env.SEARCH_MIN_RIDE_M, 200),
    maxCandidates: num(process.env.SEARCH_MAX_CANDIDATES, 5000),
  };
}
