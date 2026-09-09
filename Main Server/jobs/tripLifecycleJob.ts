import { Op } from 'sequelize';
import { Booking, Trip, TripSeat } from '../Models';
import { BOOKING_STATUS, TRIP_DURATION_HOURS, TRIP_LIFECYCLE_GRACE_HOURS, TRIP_STATUS } from '../config/constants';
import * as tripService from '../Services/tripService';
import notificationService from '../Services/notificationService';
import homeService from '../Services/homeService';
import auditService from '../Services/auditService';
import { releaseSeatLock } from '../utils/seatLock';

const { completeTrip } = tripService as unknown as {
  completeTrip: (driverId: string, tripId: string) => Promise<unknown>;
};

// Trips that were started but never finished.
const STARTED_STATUSES = [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING];
// Trips that never left the station.
const UNOPERATED_STATUSES = [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL];

export interface TripLifecycleResult {
  autoCompleted: string[];
  expiredUnoperated: string[];
  noShowBookings: number;
  errors: Array<{ tripId: string; message: string }>;
}

/**
 * Closes out stale trips whose assumed end
 * (departure + TRIP_DURATION_HOURS + TRIP_LIFECYCLE_GRACE_HOURS) is in the past.
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
  const result: TripLifecycleResult = { autoCompleted: [], expiredUnoperated: [], noShowBookings: 0, errors: [] };
  // NOTE: the scheduler invokes tasks as taskFn(context), so the first
  // argument is NOT a Date — always derive "now" internally.
  const now = context instanceof Date ? context : new Date();
  const cutoff = new Date(now.getTime() - (TRIP_DURATION_HOURS + TRIP_LIFECYCLE_GRACE_HOURS) * 60 * 60 * 1000);

  const stale = await Trip.findAll({
    where: {
      isRecurring: false,
      departureTime: { [Op.lte]: cutoff },
      status: { [Op.in]: [...STARTED_STATUSES, ...UNOPERATED_STATUSES] },
    },
    attributes: ['id', 'driverId', 'status', 'departureTime'],
  });

  for (const trip of stale) {
    try {
      if ((STARTED_STATUSES as string[]).includes(trip.status)) {
        await completeTrip(trip.driverId, trip.id);
        result.autoCompleted.push(trip.id);
        auditService.track({
          action: 'trip.auto_completed',
          resourceType: 'trip',
          resourceId: trip.id,
          actorId: trip.driverId,
          actorType: 'system',
          payload: { status: trip.status },
        });
      } else {
        result.noShowBookings += await expireUnoperatedTrip(trip);
        result.expiredUnoperated.push(trip.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[tripLifecycleJob] trip ${trip.id} close-out failed:`, message);
      result.errors.push({ tripId: trip.id, message });
    }
  }

  if (stale.length > 0) {
    console.log(
      `[tripLifecycleJob] closed ${result.autoCompleted.length} completed + ${result.expiredUnoperated.length} unoperated (${result.noShowBookings} no-show bookings), ${result.errors.length} error(s)`
    );
  }
  return result;
}

async function expireUnoperatedTrip(trip: InstanceType<typeof Trip>): Promise<number> {
  await trip.update({ status: TRIP_STATUS.CANCELLED });

  const bookings = await Booking.findAll({
    where: { tripId: trip.id, status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] } },
  });
  for (const booking of bookings) {
    await booking.update({ status: BOOKING_STATUS.NO_SHOW });
  }

  // Release any lingering seat locks so they never outlive the trip.
  try {
    const rows = await TripSeat.findAll({
      where: { tripId: trip.id },
      attributes: ['seatNumber'],
    });
    for (const row of rows) {
      try {
        await releaseSeatLock(trip.id, row.seatNumber);
      } catch {
        // best-effort per seat
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[tripLifecycleJob] lock release failed for trip ${trip.id}:`, message);
  }

  try {
    await (notificationService as unknown as { notifyConfirmedPassengers: (ids: string[], type: string, opts: unknown) => Promise<unknown> }).notifyConfirmedPassengers(
      [trip.id],
      'TRIP_CANCELLED',
      { data: { trip_id: trip.id } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[tripLifecycleJob] passenger notification failed:', message);
  }

  try {
    await (homeService as unknown as { invalidateHomeForTrip: (tripId: string, driverId: string) => Promise<unknown> }).invalidateHomeForTrip(trip.id, trip.driverId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[tripLifecycleJob] home cache invalidation failed:', message);
  }

  auditService.track({
    action: 'trip.expired_unoperated',
    resourceType: 'trip',
    resourceId: trip.id,
    actorId: trip.driverId,
    actorType: 'system',
    payload: { no_show_bookings: bookings.length },
  });

  return bookings.length;
}

export { runTripLifecycle };
export default { runTripLifecycle };
module.exports = { runTripLifecycle };
