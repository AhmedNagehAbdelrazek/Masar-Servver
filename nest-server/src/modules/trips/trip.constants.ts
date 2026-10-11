// Shared trip constants. Port of the overlap/lifecycle tunables in
// Main Server/Services/tripService.ts + tripExpiryService.ts.
//
// DEVIATION (verified, intentional): Express ships TRIP_DURATION_HOURS = 0,
// which makes every overlap window zero-width and silently disables the
// driver overlap guard — while the code comments ("05:00 + 2h blocks until
// 07:00"), the test-suite names ("2h window") and the assertions all specify
// a 2-hour window (Express fails 3/35 of its own trip tests on this). The
// port implements the documented 2h intent.
export const TRIP_DURATION_HOURS = 2;
export const TRIP_START_WINDOW_MS = 3600000;

export const BLOCKING_TRIP_STATUSES = ['published', 'full', 'in_progress', 'ongoing'] as const;
