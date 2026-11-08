// @ts-nocheck
import { Op } from 'sequelize';
import { RideRequest, RequestOffer, Trip, User, Booking } from '../Models';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';

const MATCHED_OFFER = ['sent', 'offered'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function prefsOf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function slotList(prefs, originTime, arrivalDeadline) {
  if (Array.isArray(prefs.slots) && prefs.slots.length > 0) {
    return prefs.slots.map((s) => ({ date: s?.date ?? null, preferred: s?.preferred === true }));
  }
  const single = originTime || arrivalDeadline;
  return [{ date: single ? new Date(single).toISOString() : null, preferred: true }];
}

async function getStats() {
  const [total, open, offered, accepted, cancelled, expired] = await Promise.all([
    RideRequest.count(),
    RideRequest.count({ where: { status: 'open' } }),
    RideRequest.count({ where: { status: 'offered' } }),
    RideRequest.count({ where: { status: 'accepted' } }),
    RideRequest.count({ where: { status: 'cancelled' } }),
    RideRequest.count({ where: { status: 'expired' } }),
  ]);
  return {
    total_requests: total,
    searching: open,
    matched: offered,
    completed: accepted,
    cancelled,
    expired,
  };
}

async function listRequests(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  if (query.status && query.status !== 'all') where.status = query.status;
  if (query.search) {
    const term = query.search;
    where[Op.or] = UUID_RE.test(term)
      ? [{ id: term }]
      : [
        { '$passenger.full_name$': { [Op.iLike]: `%${term}%` } },
        { '$passenger.phone$': { [Op.iLike]: `%${term}%` } },
      ];
  }
  if (query.from || query.to) {
    where.createdat = {};
    if (query.from) where.createdat[Op.gte] = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.createdat[Op.lte] = new Date(`${query.to}T23:59:59.999Z`);
  }

  const { rows, count } = await RideRequest.findAndCountAll({
    where,
    include: [
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'], required: Boolean(query.search) },
      { model: RequestOffer, as: 'offers', attributes: ['id'], required: false },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
    distinct: true,
    subQuery: false,
  });

  return {
    data: rows.map((r) => {
      const prefs = prefsOf(r.attributesPreferred);
      const slots = slotList(prefs, r.originTime, r.arrivalDeadline);
      return {
        id: r.id,
        request_no: r.id,
        passenger: r.passenger
          ? { id: r.passenger.id, name: r.passenger.fullName, phone: maskPhone(r.passenger.phone) }
          : null,
        route: `${r.originCity} ← ${r.destinationCity}`,
        created_at: r.createdat,
        slots_count: slots.length,
        slots_label: slots.length > 1 ? `${slots.length} مواعيد` : null,
        seats_needed: r.seatsNeeded,
        gender: prefs.gender || null,
        status: r.status,
        offers_count: r.offers?.length || 0,
      };
    }),
    pagination: buildPagination(count, page, limit),
  };
}

async function getDetail(requestId) {
  const request = await RideRequest.findByPk(requestId, {
    include: [
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'age', 'gender', 'createdat', 'lastLoginAt'] },
      {
        model: RequestOffer,
        as: 'offers',
        include: [{
          model: Trip,
          as: 'trip',
          attributes: ['id', 'originCity', 'destinationCity', 'departureTime', 'totalSeats', 'availableSeats', 'farePerSeat', 'status'],
          include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
        }],
      },
    ],
  });
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');

  const prefs = prefsOf(request.attributesPreferred);
  const slots = slotList(prefs, request.originTime, request.arrivalDeadline);
  const offers = request.offers || [];
  const matched = offers.find((o) => o.status === 'accepted' && o.trip)
    || offers.find((o) => MATCHED_OFFER.includes(o.status) && o.trip)
    || null;

  const log = [
    { event: 'created', at: request.createdat },
    { event: 'search_started', at: request.createdat },
  ];
  const firstMatch = [...offers].reverse().find((o) => o.trip);
  if (firstMatch?.trip) log.push({ event: 'matched', trip_id: firstMatch.trip.id, at: firstMatch.createdat });
  if (request.status === 'accepted') log.push({ event: 'completed', at: request.updatedat });
  if (request.status === 'cancelled') log.push({ event: 'cancelled', at: request.updatedat, note: request.note });
  if (request.status === 'expired') log.push({ event: 'expired', at: request.expiresAt });

  const [totalBookings, completedBookings, cancelledBookings] = await Promise.all([
    Booking.count({ where: { passengerId: request.passengerId } }),
    Booking.count({ where: { passengerId: request.passengerId, status: 'completed' } }),
    Booking.count({ where: { passengerId: request.passengerId, status: 'cancelled' } }),
  ]);

  return {
    request: {
      id: request.id,
      request_no: request.id,
      seats_needed: request.seatsNeeded,
      slots_count: slots.length,
      recurring: prefs.recurring === true,
      status: request.status,
      origin_city: request.originCity,
      origin_place: request.originPlace,
      destination_city: request.destinationCity,
      destination_place: request.destinationPlace,
      time_from: prefs.timeFrom || null,
      time_to: prefs.timeTo || null,
      preferred_time: prefs.preferredTime || null,
      gender: prefs.gender || null,
      max_budget: request.maxBudget != null ? Number(request.maxBudget) : null,
      currency: request.currency,
      note: request.note,
      created_date: request.createdat,
      expires_at: request.expiresAt,
    },
    slots,
    passenger: request.passenger
      ? { ...request.passenger.toJSON(), phone: maskPhone(request.passenger.phone) }
      : null,
    passenger_activity: {
      total_bookings: totalBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    match: matched?.trip
      ? {
        offer_id: matched.id,
        offer_status: matched.status,
        matched_at: matched.createdat,
        trip: {
          id: matched.trip.id,
          route: `${matched.trip.originCity} ← ${matched.trip.destinationCity}`,
          departure_time: matched.trip.departureTime,
          seats_booked: request.seatsNeeded,
          seat_price: Number(matched.trip.farePerSeat),
          total_seats: Number(matched.trip.totalSeats),
          available_seats: Number(matched.trip.availableSeats),
          status: matched.trip.status,
        },
        driver: matched.trip.driver
          ? { ...matched.trip.driver.toJSON(), phone: maskPhone(matched.trip.driver.phone) }
          : null,
      }
      : null,
    cancellation: request.status === 'cancelled' ? { reason: request.note, cancelled_at: request.updatedat } : null,
    expiry: request.status === 'expired' ? { expired_at: request.expiresAt } : null,
    log,
  };
}

module.exports = { getStats, listRequests, getDetail };
export { getStats, listRequests, getDetail };
export default module.exports;
