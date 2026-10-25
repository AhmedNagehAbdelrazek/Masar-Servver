// Shared trip constants. Port of the overlap/lifecycle tunables in
// Main Server/Services/tripService.ts + tripExpiryService.ts.
//
// Both Express and Nest now enforce a 1-hour minimum gap between trip departures.
// Previously Nest used 2h; Express had a bug with 0h (guard disabled).
export const TRIP_DURATION_HOURS = 1;
export const TRIP_START_WINDOW_MS = 3600000;

export const BLOCKING_TRIP_STATUSES = ['published', 'full', 'in_progress', 'ongoing'] as const;
