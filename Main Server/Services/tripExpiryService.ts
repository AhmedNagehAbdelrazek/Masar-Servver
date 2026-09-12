// @ts-nocheck
import { Op } from 'sequelize';
import { Booking, Trip, TripSeat } from '../Models';
import { BOOKING_STATUS, TRIP_DURATION_HOURS, TRIP_LIFECYCLE_GRACE_HOURS, TRIP_STATUS } from '../config/constants';
import * as tripService from './tripService';
import notificationService from './notificationService';
import homeService from './homeService';
import auditService from './auditService';
import { releaseSeatLock } from '../utils/seatLock';

const { completeTrip } = tripService;

// Trips that were started but never finished.
const STARTED_STATUSES = [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING];
// Trips that never left the station.
const UNOPERATED_STATUSES = [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL];
const STALE_STATUSES = [...STARTED_STATUSES, ...UNOPERATED_STATUSES];

function lifecycleCutoff(now = new Date()) {
  return new Date(now.getTime() - (TRIP_DURATION_HOURS + TRIP_LIFECYCLE_GRACE_HOURS) * 60 * 60 * 1000);
}

async function expireUnoperatedTrip(trip) {
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
  } catch (err) {
    console.warn(`[tripExpiryService] lock release failed for trip ${trip.id}:`, err.message);
  }

  try {
    await notificationService.notifyConfirmedPassengers(
      [trip.id],
      'TRIP_CANCELLED',
      { data: { trip_id: trip.id } }
    );
  } catch (err) {
    console.warn('[tripExpiryService] passenger notification failed:', err.message);
  }

  try {
    await homeService.invalidateHomeForTrip(trip.id, trip.driverId);
  } catch (err) {
    console.warn('[tripExpiryService] home invalidation failed:', err.message);
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

async function closeOutStaleTrip(trip, result) {
  try {
    if (STARTED_STATUSES.includes(trip.status)) {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[tripExpiryService] trip ${trip.id} close-out failed:`, message);
    result.errors.push({ tripId: trip.id, message });
  }
}

/**
 * Bring trips to their terminal lifecycle state when their assumed end
 * (departure + duration + grace) is in the past:
 * - started trips are auto-completed through the normal completeTrip flow
 * - never-operated trips are cancelled and their bookings become NO_SHOW
 *
 * Recurring series are excluded (stored departureTime is the first occurrence
 * only). Idempotent — only non-terminal statuses are touched.
 *
 * Pass `tripIds` to scope the sweep (read paths); omit it for the global
 * sweep (cron job). NEVER throws — collects errors instead, so it is safe to
 * call at the start of read endpoints before serializing the fresh state.
 */
async function refreshStaleTrips(tripIds = null) {
  const result = { autoCompleted: [], expiredUnoperated: [], noShowBookings: 0, errors: [], touched: 0 };
  try {
    const cutoff = lifecycleCutoff(new Date());
    const where = {
      isRecurring: false,
      departureTime: { [Op.lte]: cutoff },
      status: { [Op.in]: STALE_STATUSES },
    };
    if (tripIds !== null && tripIds !== undefined) {
      const ids = [...new Set((Array.isArray(tripIds) ? tripIds : [tripIds]).filter(Boolean))].map(String);
      if (ids.length === 0) return result;
      where.id = { [Op.in]: ids };
    }
    const stale = await Trip.findAll({
      where,
      attributes: ['id', 'driverId', 'status', 'departureTime'],
    });
    for (const trip of stale) {
      await closeOutStaleTrip(trip, result);
    }
    result.touched = result.autoCompleted.length + result.expiredUnoperated.length;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[tripExpiryService] refresh failed:', message);
    result.errors.push({ tripId: null, message });
  }
  return result;
}

module.exports = { refreshStaleTrips, lifecycleCutoff };
export { refreshStaleTrips, lifecycleCutoff };
export default module.exports;
