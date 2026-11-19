/**
 * Booking window helpers.
 *
 * A trip's `status` alone is not enough to decide whether it still accepts new
 * bookings:
 * - the lifecycle sweep is periodic, so a trip can be `published` after its
 *   scheduled departure but before the sweep cancels it;
 * - an admin restore can flip a previously started/completed trip back to
 *   `published` while `startedAt`/`completedAt` still prove it already ran.
 *
 * Treat both as closed. This also means a driver who has physically passed a
 * pickup point can never receive a new booking on that trip, because live
 * movement only happens after the trip has started.
 */
export interface TripScheduleState {
  departureTime: Date | string;
  isRecurring?: boolean | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
}

export function hasTripDeparted(trip: TripScheduleState, now: Date = new Date()): boolean {
  // Recurring series are one row whose stored departureTime is the first
  // occurrence; timestamps cannot tell which occurrence is current, so keep
  // the previous status-only behaviour for them instead of closing the series
  // after its first departure.
  if (trip.isRecurring) return false;
  if (trip.startedAt != null || trip.completedAt != null) return true;
  const departure = new Date(trip.departureTime).getTime();
  return Number.isFinite(departure) && departure <= now.getTime();
}

/**
 * A trip has "started" once the driver began it. Rating (and ride
 * confirmations) unlock for the whole journey from this point on — including
 * `abandoned` trips, where passengers may still have ridden part of the way.
 * `cancelled` trips never started, and `published`/`full` have not departed.
 */
export const TRIP_STARTED_STATUSES = ['in_progress', 'ongoing', 'completed', 'abandoned'];

export function hasTripStarted(tripStatus: string | null | undefined): boolean {
  return tripStatus != null && TRIP_STARTED_STATUSES.includes(tripStatus);
}

/**
 * A booking can be rated once its trip started and the booking still
 * represents a seat on the ride (pending/cancelled bookings never rode).
 */
export function canRateBooking(
  booking: { status?: string | null },
  tripStatus: string | null | undefined,
): boolean {
  const inactive = booking.status == null
    || booking.status === 'pending'
    || booking.status === 'cancelled';
  return hasTripStarted(tripStatus) && !inactive;
}

const tripSchedule = { hasTripDeparted, hasTripStarted, canRateBooking };
export default tripSchedule;

// CommonJS interop (matches the other utils consumed by both tsx and dist).
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = tripSchedule;
  // @ts-ignore
  Object.assign(module.exports, tripSchedule);
  // @ts-ignore
  module.exports.default = tripSchedule;
}
