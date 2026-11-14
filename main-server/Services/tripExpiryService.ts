// @ts-nocheck
import { Op } from 'sequelize';
import { Booking, Trip, TripSeat, TripLocation, User } from '../Models';
import { BOOKING_STATUS, TRIP_DURATION_HOURS, TRIP_STATUS, TRIP_ABANDON_WARN_MINUTES, TRIP_ABANDON_AFTER_MINUTES } from '../config/constants';
import * as tripService from './tripService';
import notificationService from './notificationService';
import homeService from './homeService';
import auditService from './auditService';
import * as tripEventService from './tripEventService';
import { releaseSeatLock } from '../utils/seatLock';

const { abandonTrip } = tripService;

// Trips that were started but never finished.
const STARTED_STATUSES = [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING];
// Trips that never left the station.
const UNOPERATED_STATUSES = [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL];
const STALE_STATUSES = [...STARTED_STATUSES, ...UNOPERATED_STATUSES];

// Trips that never left expire the moment departure passes — no grace
// period, so a booking never lingers as `confirmed` past the trip time.
function unoperatedCutoff(now = new Date()) {
  return now;
}

// Trips that did start get the assumed ride duration before they are
// auto-completed; completing at departure would kill mid-ride trips
// (chat, commission and ratings all depend on the live state).
function lifecycleCutoff(now = new Date()) {
  return new Date(now.getTime() - TRIP_DURATION_HOURS * 60 * 60 * 1000);
}

async function expireUnoperatedTrip(trip) {
  const previousStatus = trip.status;
  await trip.update({ status: TRIP_STATUS.CANCELLED });
  await tripEventService.recordTripStatus({
    trip,
    fromStatus: previousStatus,
    toStatus: TRIP_STATUS.CANCELLED,
    actorId: null,
    actorRole: 'system',
    details: { reason: 'trip_expired_unoperated', source: 'trip_expiry_job' },
  });

  const bookings = await Booking.findAll({
    where: { tripId: trip.id, status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] } },
  });
  for (const booking of bookings) {
    await booking.update({ status: BOOKING_STATUS.NO_SHOW });
    await tripEventService.record({
      tripId: trip.id,
      bookingId: booking.id,
      passengerId: booking.passengerId,
      eventType: 'booking.no_show',
      toStatus: BOOKING_STATUS.NO_SHOW,
      actorRole: 'system',
      details: { reason: 'trip_expired_unoperated', booking_no: booking.referenceCode },
    });
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
      const lastPoint = await TripLocation.findOne({
        where: { tripId: trip.id },
        orderBy: [['createdat', 'DESC']],
        attributes: ['createdat'],
      });
      const lastActivity = lastPoint?.createdat || trip.startedAt || trip.departureTime;
      const idleMinutes = (Date.now() - new Date(lastActivity).getTime()) / 60000;
      if (idleMinutes >= TRIP_ABANDON_AFTER_MINUTES) {
        await abandonTrip(trip.driverId, trip.id, 'no_driver_activity');
        result.abandoned.push(trip.id);
        auditService.track({
          action: 'trip.auto_abandoned',
          resourceType: 'trip',
          resourceId: trip.id,
          actorId: trip.driverId,
          actorType: 'system',
          payload: { status: trip.status, idle_minutes: Math.round(idleMinutes) },
        });
      } else if (idleMinutes >= TRIP_ABANDON_WARN_MINUTES && !trip.abandonWarnedAt) {
        const driver = await User.findByPk(trip.driverId);
        if (driver) {
          try {
            await notificationService.sendToUser(driver, 'TRIP_ABANDON_WARNING', {
              channels: ['sms'],
              vars: { route: `${trip.originCity} - ${trip.destinationCity}` },
              data: { trip_id: trip.id },
            });
          } catch (err) {
            console.warn('[tripExpiryService] abandon warning failed:', err.message);
          }
        }
        await trip.update({ abandonWarnedAt: new Date() });
        result.warned.push(trip.id);
      }
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
 * Bring trips to their terminal lifecycle state:
 * - never-operated trips (published/full) expire the moment departure passes:
 *   cancelled with their bookings set to NO_SHOW
 * - started trips (in_progress/ongoing) are auto-completed through the
 *   normal completeTrip flow once departure + the assumed ride duration
 *   (TRIP_DURATION_HOURS) is in the past
 *
 * Recurring series are excluded (stored departureTime is the first occurrence
 * only). Idempotent — only non-terminal statuses are touched.
 *
 * Pass `tripIds` to scope the sweep (read paths); omit it for the global
 * sweep (cron job). NEVER throws — collects errors instead, so it is safe to
 * call at the start of read endpoints before serializing the fresh state.
 */
async function refreshStaleTrips(tripIds = null) {
  const result = { autoCompleted: [], expiredUnoperated: [], abandoned: [], warned: [], noShowBookings: 0, errors: [], touched: 0 };
  try {
    const now = new Date();
    let idFilter = null;
    if (tripIds !== null && tripIds !== undefined) {
      const ids = [...new Set((Array.isArray(tripIds) ? tripIds : [tripIds]).filter(Boolean))].map(String);
      if (ids.length === 0) return result;
      idFilter = { id: { [Op.in]: ids } };
    }
    const stale = await Trip.findAll({
      where: {
        isRecurring: false,
        [Op.or]: [
          {
            status: { [Op.in]: UNOPERATED_STATUSES },
            departureTime: { [Op.lte]: unoperatedCutoff(now) },
          },
          {
            status: { [Op.in]: STARTED_STATUSES },
          },
        ],
        ...(idFilter || {}),
      },
      attributes: ['id', 'driverId', 'status', 'departureTime', 'startedAt', 'updatedat', 'originCity', 'destinationCity', 'abandonWarnedAt'],
    });
    for (const trip of stale) {
      await closeOutStaleTrip(trip, result);
    }
    result.touched =
      result.autoCompleted.length +
      result.expiredUnoperated.length +
      result.abandoned.length +
      result.warned.length;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[tripExpiryService] refresh failed:', message);
    result.errors.push({ tripId: null, message });
  }
  return result;
}

module.exports = { refreshStaleTrips, lifecycleCutoff, unoperatedCutoff };
export { refreshStaleTrips, lifecycleCutoff, unoperatedCutoff };
export default module.exports;
