// @ts-nocheck
import { TripEvent, User } from '../Models';

type TripEventInput = {
  tripId?: string;
  bookingId?: string | null;
  passengerId?: string | null;
  eventType?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  details?: Record<string, unknown>;
  occurredAt?: Date;
};

type TripStatusInput = {
  trip: { id?: string } | string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  details?: Record<string, unknown>;
  occurredAt?: Date;
};

/**
 * Append-only trip activity trail used by the admin journey page.
 * Every write is best-effort: history must never break the primary operation.
 */
async function record(params: TripEventInput = {}) {
  const {
    tripId,
    bookingId = null,
    passengerId = null,
    eventType,
    fromStatus = null,
    toStatus = null,
    actorId = null,
    actorRole = null,
    details = {},
    occurredAt = new Date(),
  } = params;
  if (!tripId || !eventType) return null;
  try {
    return await TripEvent.create({
      tripId,
      bookingId: bookingId || null,
      passengerId: passengerId || null,
      eventType,
      fromStatus: fromStatus || null,
      toStatus: toStatus || null,
      actorId: actorId || null,
      actorRole: actorRole || null,
      details: details || {},
      occurredAt,
    });
  } catch (err) {
    console.warn('[tripEventService] record failed:', err.message);
    return null;
  }
}

async function listForTrip(tripId, { limit = 200 } = {}) {
  return TripEvent.findAll({
    where: { tripId },
    include: [
      {
        model: User,
        as: 'passenger',
        attributes: ['id', 'fullName', 'phone'],
        required: false,
      },
      {
        model: User,
        as: 'actor',
        attributes: ['id', 'fullName', 'role'],
        required: false,
      },
    ],
    order: [['occurredAt', 'ASC']],
    limit: Math.max(1, Math.min(Number(limit) || 200, 500)),
  });
}

async function listForBooking(bookingId, { limit = 200 } = {}) {
  return TripEvent.findAll({
    where: { bookingId },
    order: [['occurredAt', 'ASC']],
    limit: Math.max(1, Math.min(Number(limit) || 200, 500)),
  });
}

function statusEventType(toStatus) {
  switch (toStatus) {
    case 'in_progress':
    case 'ongoing':
      return 'trip.started';
    case 'completed':
      return 'trip.completed';
    case 'abandoned':
      return 'trip.abandoned';
    case 'cancelled':
      return 'trip.cancelled';
    default:
      return 'trip.status_changed';
  }
}

async function recordTripStatus(params: TripStatusInput) {
  const {
    trip,
    fromStatus,
    toStatus,
    actorId,
    actorRole,
    details = {},
    occurredAt = new Date(),
  } = params;
  return record({
    tripId: typeof trip === 'string' ? trip : trip.id,
    eventType: statusEventType(toStatus),
    fromStatus,
    toStatus,
    actorId,
    actorRole,
    details,
    occurredAt,
  });
}

export {
  record,
  recordTripStatus,
  listForTrip,
  listForBooking,
  statusEventType,
};

export default {
  record,
  recordTripStatus,
  listForTrip,
  listForBooking,
  statusEventType,
};
module.exports = {
  record,
  recordTripStatus,
  listForTrip,
  listForBooking,
  statusEventType,
};
