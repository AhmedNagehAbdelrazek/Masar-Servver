// Shared trip constants. Port of the overlap/lifecycle tunables in
// main-server/Services/tripService.ts + tripExpiryService.ts.
//
// Both Express and Nest now enforce a 1-hour minimum gap between trip departures.
// Previously Nest used 2h; Express had a bug with 0h (guard disabled).
export const TRIP_DURATION_HOURS = 1;
export const TRIP_START_WINDOW_MS = 3600000;

export const TRIP_ABANDON_WARN_MINUTES = Number(process.env.TRIP_ABANDON_WARN_MINUTES || 10);
export const TRIP_ABANDON_AFTER_MINUTES = Number(process.env.TRIP_ABANDON_AFTER_MINUTES || 20);
export const TRIP_REMINDER_LEAD_MINUTES = Number(process.env.TRIP_REMINDER_LEAD_MINUTES || 10);
export const REQUEST_TRIP_TIME_TOLERANCE_MINUTES = Number(
  process.env.REQUEST_TRIP_TIME_TOLERANCE_MINUTES || 15,
);

export const BLOCKING_TRIP_STATUSES = ['published', 'full', 'in_progress', 'ongoing'] as const;
