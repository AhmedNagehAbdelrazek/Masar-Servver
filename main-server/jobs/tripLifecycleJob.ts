import { refreshStaleTrips } from '../Services/tripExpiryService';

export interface TripLifecycleResult {
  autoCompleted: string[];
  expiredUnoperated: string[];
  abandoned: string[];
  warned: string[];
  noShowBookings: number;
  errors: Array<{ tripId: string | null; message: string }>;
  touched: number;
}

/**
 * Closes out stale trips: never-operated ones the moment departure passes,
 * and started trips whose driver stopped sending activity. Started trips are
 * abandoned (never auto-completed) so a dropped trip is not counted as a
 * successful completion.
 */
async function runTripLifecycle(context?: unknown): Promise<TripLifecycleResult> {
  // NOTE: the scheduler invokes tasks as taskFn(context), so the first
  // argument is NOT a Date — refresh derives "now" internally.
  void context;
  const result = await refreshStaleTrips(null);

  if (result.touched > 0) {
    console.log(
      `[tripLifecycleJob] ${result.abandoned.length} abandoned + ${result.warned.length} warned + ${result.expiredUnoperated.length} unoperated (${result.noShowBookings} no-show bookings), ${result.errors.length} error(s)`
    );
  }
  return result;
}

export { runTripLifecycle };
export default { runTripLifecycle };
module.exports = { runTripLifecycle };
