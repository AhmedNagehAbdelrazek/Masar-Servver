import { refreshStaleTrips } from '../Services/tripExpiryService';

export interface TripLifecycleResult {
  autoCompleted: string[];
  expiredUnoperated: string[];
  noShowBookings: number;
  errors: Array<{ tripId: string | null; message: string }>;
  touched: number;
}

/**
 * Closes out stale trips whose assumed end
 * (departure + TRIP_DURATION_HOURS + TRIP_LIFECYCLE_GRACE_HOURS) is in the past.
 *
 * Delegates to tripExpiryService.refreshStaleTrips (same close-out used by
 * read paths, so cron and reads always converge on the same terminal state).
 *
 * - Started trips (in_progress/ongoing) are auto-completed through the normal
 *   completeTrip flow (commission, bookings, notifications included).
 * - Never-operated trips (published/full) are marked cancelled and their
 *   CONFIRMED/PENDING bookings become NO_SHOW — the driver never showed up.
 *
 * Recurring series are excluded: their stored departureTime is the first
 * occurrence only, so per-occurrence ageing does not apply.
 * Everything is idempotent — only non-terminal statuses are touched.
 */
async function runTripLifecycle(context?: unknown): Promise<TripLifecycleResult> {
  // NOTE: the scheduler invokes tasks as taskFn(context), so the first
  // argument is NOT a Date — refresh derives "now" internally.
  void context;
  const result = await refreshStaleTrips(null);

  if (result.touched > 0) {
    console.log(
      `[tripLifecycleJob] closed ${result.autoCompleted.length} completed + ${result.expiredUnoperated.length} unoperated (${result.noShowBookings} no-show bookings), ${result.errors.length} error(s)`
    );
  }
  return result;
}

export { runTripLifecycle };
export default { runTripLifecycle };
module.exports = { runTripLifecycle };
