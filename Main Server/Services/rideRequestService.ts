// @ts-nocheck
import { Op } from 'sequelize';
import { ApiErrors } from '../utils/ApiError';
import { parsePagination, buildPagination } from '../utils/pagination';
import { maskPhone } from '../utils/masking';
import auditService from './auditService';
import notificationService from './notificationService';
import { generateReferenceCode } from '../utils/referenceCode';
import { RideRequest, RequestOffer, Booking, Trip, TripSeat, User, Vehicle, sequelize } from '../Models';
import { BOOKING_STATUS, PAYMENT_STATUS, TRIP_STATUS, REQUEST_OFFER_STATUS, RIDE_REQUEST_STATUS, REQUEST_OFFER_TTL_HOURS, SEAT_TYPE, GENDER_PREFERENCE, PICKUP_TYPE, PICKUP_STATUS } from '../config/constants';
import { REDIS_KEYS } from '../utils/redisKeys';
import { deleteKey } from '../config/redis';
import homeService from './homeService';
import realtimeService from './realtimeService';
import routeService from './routeService';
import tripService from './tripService';
import { parseOptionalTimezoneAware } from '../utils/time';

const MATCH_WINDOW_BEFORE_MS = 24 * 60 * 60 * 1000;
const MATCH_WINDOW_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const MATCH_LIMIT = 10; // support at least 10 candidates

function genderCompatible(trip, request) {
  const pref = request.attributesPreferred && request.attributesPreferred.gender_preference;
  if (!pref || pref === 'all') return true;
  if (!trip.genderPreference || trip.genderPreference === 'all') return true;
  return trip.genderPreference === pref;
}

function matchScore(trip, request) {
  let score = 0;

  // 1. Route match — the strongest signal.
  if (trip.originCity === request.originCity) score += 100;
  if (trip.destinationCity === request.destinationCity) score += 100;

  // 2. Time window — trips closest to the requested departure rank higher.
  const requested = request.originTime ? new Date(request.originTime).getTime() : Date.now();
  const actual = new Date(trip.departureTime).getTime();
  const diffMin = Math.round(Math.abs(requested - actual) / 60000);
  score -= Math.min(diffMin, 720) / 12; // up to ~60 points beyond 12h

  // 3. Seat availability — more free seats is a little better.
  score += Math.min(Number(trip.availableSeats), 4);

  // 4. Gender preference compatibility.
  if (genderCompatible(trip, request)) score += 5;

  return score;
}

/** US6: ranked trip suggestions for a passenger's ride request (never books). */
async function getMatches(user, requestId) {
  await expireStale();

  const request = await RideRequest.findByPk(requestId);
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
  if (request.passengerId !== user.id) {
    throw ApiErrors.custom('YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS', 403, 'YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS');
  }

  const seatsNeeded = Math.max(1, request.seatsNeeded || 1);
  const requestedMs = request.originTime
    ? new Date(request.originTime).getTime()
    : Date.now();
  const windowStart = new Date(requestedMs - MATCH_WINDOW_BEFORE_MS);
  const windowEnd = new Date(requestedMs + MATCH_WINDOW_AFTER_MS);

  const trips = await Trip.findAll({
    where: {
      status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] },
      availableSeats: { [Op.gte]: seatsNeeded },
      departureTime: { [Op.between]: [windowStart, windowEnd] },
    },
    include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'avgRating'] }],
    order: [['departureTime', 'ASC']],
  });

  const scored = trips
    .map((trip) => ({ trip, score: matchScore(trip, request) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MATCH_LIMIT);

  return {
    ride_request_id: request.id,
    matches: scored.map(({ trip }, index) => ({
      trip_id: trip.id,
      score_rank: index + 1,
      origin: {
        city: trip.originCity,
        lat: trip.originLat !== null && trip.originLat !== undefined ? Number(trip.originLat) : null,
        lng: trip.originLng !== null && trip.originLng !== undefined ? Number(trip.originLng) : null,
      },
      destination: { city: trip.destinationCity },
      departure_time: trip.departureTime,
      available_seats: Number(trip.availableSeats),
      fare_per_seat: Number(trip.farePerSeat),
      currency: trip.currency || 'JOD',
      gender_preference: trip.genderPreference || 'all',
      driver: trip.driver
        ? {
            id: trip.driver.id,
            full_name: trip.driver.fullName,
            rating: Number(trip.driver.avgRating) || 0,
          }
        : null,
    })),
  };
}


function serializeRideRequest(request : RideRequest, options = {}) {
  const base = {
    id: request.id,
    passenger_id: request.passengerId,
    passenger_name: request.passenger ? request.passenger.fullName : null,
    passenger_phone_masked: request.passenger ? maskPhone(request.passenger.phone) : null,
    origin_place: request.originPlace,
    origin_city: request.originCity,
    origin_lat: request.originLat !== null && request.originLat !== undefined ? Number(request.originLat) : null,
    origin_lng: request.originLng !== null && request.originLng !== undefined ? Number(request.originLng) : null,
    origin_time: request.originTime,
    destination_place: request.destinationPlace,
    destination_city: request.destinationCity,
    destination_lat: request.destinationLat !== null && request.destinationLat !== undefined ? Number(request.destinationLat) : null,
    destination_lng: request.destinationLng !== null && request.destinationLng !== undefined ? Number(request.destinationLng) : null,
    arrival_deadline: request.arrivalDeadline,
    seats_needed: request.seatsNeeded,
    max_budget: request.maxBudget !== null && request.maxBudget !== undefined ? Number(request.maxBudget) : null,
    currency: request.currency,
    attributes_preferred: request.attributesPreferred,
    note: request.note || null,
    status: request.status,
    expires_at: request.expiresAt,
    created_at: request.createdat || request.createdAt,
  };
  if (options.includeOffers) {
    base.offers = (request.offers || []).map(serializeOffer);
  }
  return base;
}

function serializeOffer(offer) {
  return {
    id: offer.id,
    request_id: offer.requestId,
    driver_id: offer.driverId,
    driver_name: offer.driver ? offer.driver.fullName : null,
    trip_id: offer.tripId,
    offered_fare: offer.offeredFare !== null && offer.offeredFare !== undefined ? Number(offer.offeredFare) : null,
    message: offer.message,
    status: offer.status,
    agreed_fare: offer.agreedFare !== null && offer.agreedFare !== undefined ? Number(offer.agreedFare) : null,
    booking_id: offer.bookingId,
    created_at: offer.createdat || offer.createdAt,
  };
}

/**
 * Lazily close stale records (spec clarification Q4/Q1):
 * - open/offered ride requests whose expiresAt (or arrival deadline) passed
 * - sent offers older than REQUEST_OFFER_TTL_HOURS
 */
async function expireStale() {
  const now = new Date();

  await RideRequest.update(
    { status: RIDE_REQUEST_STATUS.EXPIRED },
    {
      where: {
        status: { [Op.in]: [RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFERED] },
        [Op.or]: [
          { arrivalDeadline: { [Op.and]: [{ [Op.ne]: null }, { [Op.lt]: now }] } },
          { expiresAt: { [Op.lt]: now } },
        ],
      },
    }
  );

  const ttlCutoff = new Date(now.getTime() - REQUEST_OFFER_TTL_HOURS * 60 * 60 * 1000);
  await RequestOffer.update(
    { status: REQUEST_OFFER_STATUS.EXPIRED },
    {
      where: {
        status: REQUEST_OFFER_STATUS.SENT,
        createdat: { [Op.lt]: ttlCutoff },
      },
    }
  );
}

function computeExpiresAt(arrivalDeadline, originTime) {
  const deadline = parseOptionalTimezoneAware(arrivalDeadline);
  if (deadline) return deadline;
  const base = parseOptionalTimezoneAware(originTime) || new Date();
  return new Date(base.getTime() + REQUEST_OFFER_TTL_HOURS * 60 * 60 * 1000);
}

async function createRideRequest(userId, payload) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

  const request = await RideRequest.create({
    passengerId: userId,
    originPlace: payload.origin_place || payload.origin_city,
    originCity: payload.origin_city,
    originLat: payload.origin_lat !== undefined ? payload.origin_lat : null,
    originLng: payload.origin_lng !== undefined ? payload.origin_lng : null,
    originTime: parseOptionalTimezoneAware(payload.origin_time),
    destinationPlace: payload.destination_place || payload.destination_city,
    destinationCity: payload.destination_city,
    destinationLat: payload.destination_lat !== undefined ? payload.destination_lat : null,
    destinationLng: payload.destination_lng !== undefined ? payload.destination_lng : null,
    arrivalDeadline: parseOptionalTimezoneAware(payload.arrival_deadline),
    seatsNeeded: payload.seats_needed || 1,
    maxBudget: payload.max_budget !== undefined ? payload.max_budget : null,
    currency: 'JOD',
    attributesPreferred: payload.attributes_preferred || {},
    note: payload.note ? String(payload.note).trim() : null,
    status: RIDE_REQUEST_STATUS.OPEN,
    expiresAt: computeExpiresAt(payload.arrival_deadline, payload.origin_time),
  });

  auditService.track({
    action: 'ride_request.created',
    resourceType: 'ride_request',
    resourceId: request.id,
    actorId: userId,
    actorType: 'passenger',
    payload: { origin_city: request.originCity, destination_city: request.destinationCity },
  });

  return serializeRideRequest(request);
}

async function listRequests(user, filters = {}) {
  await expireStale();

  const { status } = filters;
  const { page, limit, offset } = parsePagination(filters);

  let where = {};
  if (user.role === 'driver') {
    where = { passengerId: { [Op.ne]: user.id } };
    where.status = status || RIDE_REQUEST_STATUS.OPEN;
  } else {
    where = { passengerId: user.id };
    if (status) where.status = status;
  }

  const { rows, count } = await RideRequest.findAndCountAll({
    where,
    include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] }],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map((r) => serializeRideRequest(r)),
    pagination: buildPagination(count, page, limit),
  };
}

async function getRequest(user, requestId) {
  await expireStale();

  const request = await RideRequest.findByPk(requestId, {
    include: [
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] },
      {
        model: RequestOffer,
        as: 'offers',
        include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
      },
    ],
  });
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');

  const isOwner = request.passengerId === user.id;
  const isDriver = user.role === 'driver';
  if (!isOwner && !isDriver) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_YOUR_OWN_RIDE_REQUESTS');
  }

  return { ride_request: serializeRideRequest(request, { includeOffers: true }) };
}

async function updateRideRequest(userId, requestId, payload) {
  await expireStale();

  const request = await RideRequest.findByPk(requestId);
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
  if (request.passengerId !== userId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_UPDATE_YOUR_OWN_RIDE_REQUESTS');
  }
  if (![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
    throw ApiErrors.conflict('ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED');
  }

  if (payload.action === 'cancel') {
    request.status = RIDE_REQUEST_STATUS.CANCELLED;
    await request.save();
    await RequestOffer.update(
      { status: REQUEST_OFFER_STATUS.DECLINED },
      { where: { requestId: request.id, status: REQUEST_OFFER_STATUS.SENT } }
    );
    auditService.track({
      action: 'ride_request.cancelled',
      resourceType: 'ride_request',
      resourceId: request.id,
      actorId: userId,
      actorType: 'passenger',
    });
    return serializeRideRequest(request);
  }

  const updatable = {};
  if (payload.origin_place !== undefined) updatable.originPlace = payload.origin_place;
  if (payload.origin_city !== undefined) updatable.originCity = payload.origin_city;
  if (payload.origin_time !== undefined) updatable.originTime = parseOptionalTimezoneAware(payload.origin_time);
  if (payload.destination_city !== undefined) updatable.destinationCity = payload.destination_city;
  if (payload.arrival_deadline !== undefined) {
    updatable.arrivalDeadline = parseOptionalTimezoneAware(payload.arrival_deadline);
  }
  if (payload.seats_needed !== undefined) updatable.seatsNeeded = payload.seats_needed;
  if (payload.max_budget !== undefined) updatable.maxBudget = payload.max_budget;
  if (payload.attributes_preferred !== undefined) updatable.attributesPreferred = payload.attributes_preferred;
  if (payload.note !== undefined) updatable.note = payload.note ? String(payload.note).trim() : null;

  await request.update(updatable);
  if (updatable.arrivalDeadline !== undefined) {
    request.expiresAt = computeExpiresAt(request.arrivalDeadline, request.originTime);
    await request.save();
  }

  auditService.track({
    action: 'ride_request.updated',
    resourceType: 'ride_request',
    resourceId: request.id,
    actorId: userId,
    actorType: 'passenger',
    payload: { fields: Object.keys(updatable) },
  });

  return serializeRideRequest(request);
}

async function submitOffer(driverId, requestId, payload) {
  await expireStale();

  const driver = await User.findByPk(driverId);
  if (!driver) throw ApiErrors.notFound('USER_NOT_FOUND');

  const request = await RideRequest.findByPk(requestId);
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
  if (![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
    throw ApiErrors.conflict('THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS');
  }

  const duplicate = await RequestOffer.findOne({
    where: {
      requestId,
      driverId,
      status: REQUEST_OFFER_STATUS.SENT,
    },
  });
  if (duplicate) {
    throw ApiErrors.conflict('YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST');
  }

  const offer = await RequestOffer.create({
    requestId,
    driverId,
    tripId: payload.trip_id || null,
    offeredFare: payload.offered_fare !== undefined ? payload.offered_fare : null,
    message: payload.message || null,
    status: REQUEST_OFFER_STATUS.SENT,
  });

  if (request.status === RIDE_REQUEST_STATUS.OPEN) {
    request.status = RIDE_REQUEST_STATUS.OFFERED;
    await request.save();
  }

  auditService.track({
    action: 'offer.submitted',
    resourceType: 'request_offer',
    resourceId: offer.id,
    actorId: driverId,
    actorType: 'driver',
    payload: { request_id: requestId, offered_fare: offer.offeredFare },
  });

  const passenger = await User.findByPk(request.passengerId);
  if (passenger) {
    await notificationService.sendToUser(passenger, 'OFFER_RECEIVED', {
      channels: ['in_app', 'push'],
      vars: {
        driver: driver.fullName,
        offered_fare: offer.offeredFare !== null ? String(offer.offeredFare) : 'a proposed price',
      },
    });
  }

  return serializeOffer(offer);
}

async function listOffersForRequest(userId, requestId) {
  await expireStale();

  const request = await RideRequest.findByPk(requestId, {
    include: [
      {
        model: RequestOffer,
        as: 'offers',
        include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
      },
    ],
  });
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');

  const isOwner = request.passengerId === userId;
  const participates = (request.offers || []).some((o) => o.driverId === userId);
  if (!isOwner && !participates) {
    // drivers who never offered cannot browse others' offers
    throw ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_OFFERS_ON_YOUR_OWN_REQUESTS_OR');
  }

  return { data: (request.offers || []).map(serializeOffer) };
}

async function listDriverOffers(driverId, filters = {}) {
  await expireStale();

  const { status } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const where = { driverId };
  if (status) where.status = status;

  const { rows, count } = await RequestOffer.findAndCountAll({
    where,
    include: [
      {
        model: RideRequest,
        as: 'rideRequest',
        attributes: ['id', 'originCity', 'destinationCity', 'originTime', 'status', 'seatsNeeded'],
      },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map((o) => ({
      ...serializeOffer(o),
      request: o.rideRequest
        ? {
            id: o.rideRequest.id,
            origin_city: o.rideRequest.originCity,
            destination_city: o.rideRequest.destinationCity,
            origin_time: o.rideRequest.originTime,
            seats_needed: o.rideRequest.seatsNeeded,
            status: o.rideRequest.status,
          }
        : null,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function decideOffer(passengerId, offerId, action) {
  await expireStale();

  const offer = await RequestOffer.findByPk(offerId, {
    include: [
      { model: RideRequest, as: 'rideRequest' },
      { model: User, as: 'driver', attributes: ['id', 'fullName'] },
    ],
  });
  if (!offer) throw ApiErrors.notFound('OFFER_NOT_FOUND');
  if (!offer.rideRequest || offer.rideRequest.passengerId !== passengerId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_DECIDE_ON_OFFERS_TO_YOUR_OWN_RIDE');
  }
  if (offer.status !== REQUEST_OFFER_STATUS.SENT) {
    throw ApiErrors.conflict('OFFER_NO_LONGER_DECIDABLE', null, { status: offer.status });
  }

  if (action === 'accept') {
    offer.status = REQUEST_OFFER_STATUS.ACCEPTED;
    await offer.save();

    offer.rideRequest.status = RIDE_REQUEST_STATUS.ACCEPTED;
    await offer.rideRequest.save();

    await RequestOffer.update(
      { status: REQUEST_OFFER_STATUS.DECLINED },
      {
        where: {
          requestId: offer.requestId,
          id: { [Op.ne]: offer.id },
          status: REQUEST_OFFER_STATUS.SENT,
        },
      }
    );

    auditService.track({
      action: 'offer.accepted',
      resourceType: 'request_offer',
      resourceId: offer.id,
      actorId: passengerId,
      actorType: 'passenger',
      payload: { request_id: offer.requestId, driver_id: offer.driverId },
    });

    if (offer.driver) {
      await notificationService.sendToUser(offer.driver, 'OFFER_ACCEPTED', {
        channels: ['in_app', 'push'],
        vars: {},
      });
    }
  } else {
    offer.status = REQUEST_OFFER_STATUS.DECLINED;
    await offer.save();

    const remaining = await RequestOffer.count({
      where: { requestId: offer.requestId, status: REQUEST_OFFER_STATUS.SENT },
    });
    if (
      remaining === 0 &&
      offer.rideRequest.status === RIDE_REQUEST_STATUS.OFFERED
    ) {
      offer.rideRequest.status = RIDE_REQUEST_STATUS.OPEN;
      await offer.rideRequest.save();
    }

    auditService.track({
      action: 'offer.declined',
      resourceType: 'request_offer',
      resourceId: offer.id,
      actorId: passengerId,
      actorType: 'passenger',
      payload: { request_id: offer.requestId },
    });

    if (offer.driver) {
      await notificationService.sendToUser(offer.driver, 'OFFER_DECLINED', {
        channels: ['in_app', 'push'],
        vars: {},
      });
    }
  }

  return serializeOffer(offer);
}

async function agreeOfferPrice(passengerId, offerId, agreedFare) {
  await expireStale();

  const offer = await RequestOffer.findByPk(offerId, {
    include: [
      { model: RideRequest, as: 'rideRequest' },
      { model: User, as: 'driver', attributes: ['id', 'fullName'] },
    ],
  });
  if (!offer) throw ApiErrors.notFound('OFFER_NOT_FOUND');
  if (!offer.rideRequest || offer.rideRequest.passengerId !== passengerId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_AGREE_PRICES_ON_OFFERS_TO_YOUR_OWN');
  }
  if (offer.status !== REQUEST_OFFER_STATUS.ACCEPTED) {
    throw ApiErrors.conflict('ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE');
  }
  if (offer.rideRequest.status === RIDE_REQUEST_STATUS.CANCELLED || offer.rideRequest.status === RIDE_REQUEST_STATUS.EXPIRED) {
    throw ApiErrors.conflict('THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE');
  }

  offer.agreedFare = agreedFare;
  await offer.save();

  auditService.track({
    action: 'offer.price_agreed',
    resourceType: 'request_offer',
    resourceId: offer.id,
    actorId: passengerId,
    actorType: 'passenger',
    payload: { request_id: offer.requestId, agreed_fare: agreedFare },
  });

  if (offer.driver) {
    await notificationService.sendToUser(offer.driver, 'OFFER_PRICE_AGREED', {
      channels: ['in_app', 'push'],
      vars: { agreed_fare: String(agreedFare) },
    });
  }

  return serializeOffer(offer);
}

/**
 * Deferred materialization (spec clarifications Q2/Q3):
 * The confirmed booking row is created only here, when the accepted driver
 * attaches the offer to one of their trips.
 */
async function attachOfferToTrip(driverId, tripId, offerId, payload = {}) {
  const offer = await RequestOffer.findByPk(offerId, {
    include: [
      { model: RideRequest, as: 'rideRequest' },
      { model: User, as: 'driver', attributes: ['id', 'fullName'] },
    ],
  });
  if (!offer) throw ApiErrors.notFound('OFFER_NOT_FOUND');
  if (offer.driverId !== driverId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_ATTACH_YOUR_OWN_OFFERS');
  }
  if (offer.bookingId) {
    throw ApiErrors.conflict('OFFER_ALREADY_ATTACHED_TO_A_BOOKING');
  }
  if (offer.status !== REQUEST_OFFER_STATUS.ACCEPTED) {
    throw ApiErrors.conflict('ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP');
  }
  if (!offer.rideRequest || offer.rideRequest.status !== RIDE_REQUEST_STATUS.ACCEPTED) {
    throw ApiErrors.conflict('THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE');
  }
  if (offer.agreedFare === null || offer.agreedFare === undefined) {
    throw ApiErrors.conflict('AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO');
  }

  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_ATTACH_OFFERS_TO_YOUR_OWN_TRIPS');
  }
  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('TRIP_IS_ALREADY_ONGOING_OR_COMPLETED');
  }

  const seatsNeeded = offer.rideRequest.seatsNeeded || 1;

  async function uniqueBookingCode() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferenceCode('MSR');
      const existing = await Booking.findOne({ where: { referenceCode: code } });
      if (!existing) return code;
    }
    throw ApiErrors.serverError('COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE');
  }

  const referenceCode = await uniqueBookingCode();

  const booking = await sequelize.transaction(async (t) => {
    const freshTrip = await Trip.findByPk(tripId, { transaction: t, lock: t.LOCK.UPDATE });
    const remainingSeats = freshTrip.availableSeats - seatsNeeded;
    if (remainingSeats < 0) {
      throw ApiErrors.conflict('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
    }

    const row = await Booking.create(
      {
        tripId,
        passengerId: offer.rideRequest.passengerId,
        seatNumber: null,
        seatsBooked: seatsNeeded,
        agreedFare: offer.agreedFare,
        currency: offer.rideRequest.currency || 'JOD',
        dropoffPlace: payload.dropoff_place || null,
        dropoffDeadline: parseOptionalTimezoneAware(payload.dropoff_deadline),
        status: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        referenceCode,
        cancelledBy: null,
      },
      { transaction: t }
    );

    freshTrip.availableSeats = remainingSeats;
    if (remainingSeats === 0 && freshTrip.status === TRIP_STATUS.PUBLISHED) {
      freshTrip.status = TRIP_STATUS.FULL;
    }
    await freshTrip.save({ transaction: t });

    offer.bookingId = row.id;
    await offer.save({ transaction: t });

    return row;
  });

  auditService.track({
    action: 'booking.created_from_offer',
    resourceType: 'booking',
    resourceId: booking.id,
    actorId: driverId,
    actorType: 'driver',
    payload: {
      trip_id: tripId,
      offer_id: offer.id,
      request_id: offer.requestId,
      reference_code: booking.referenceCode,
    },
  });

  // Invalidate passenger + driver home caches and emit socket event
  const passengerId = offer.rideRequest.passengerId;
  try {
    await deleteKey(REDIS_KEYS.PASSENGER_HOME(passengerId));
  } catch (err) {
    console.warn('[rideRequestService] passenger home cache invalidation failed:', (err as Error).message);
  }
  try {
    await deleteKey(REDIS_KEYS.DRIVER_HOME(driverId));
  } catch (err) {
    console.warn('[rideRequestService] driver home cache invalidation failed:', (err as Error).message);
  }
  try {
    await homeService.invalidateHomeForTrip(tripId, driverId);
  } catch (_err) {}
  try {
    realtimeService.emitToUser(passengerId, 'home:invalidate', { trip_id: tripId });
    realtimeService.emitToUser(driverId, 'home:invalidate', { trip_id: tripId });
  } catch (_err) {}

  const passenger = await User.findByPk(passengerId);
  if (passenger) {
    await notificationService.sendToUser(passenger, 'BOOKING_CREATED_FROM_OFFER', {
      channels: ['in_app', 'push'],
      vars: { reference_code: booking.referenceCode },
    });
  }

  return {
    booking: {
      id: booking.id,
      reference_code: booking.referenceCode,
      trip_id: booking.tripId,
      passenger_id: booking.passengerId,
      seats_booked: booking.seatsBooked,
      agreed_fare: Number(booking.agreedFare),
      currency: booking.currency,
      status: booking.status,
      payment_status: booking.paymentStatus,
    },
    offer: serializeOffer(await RequestOffer.findByPk(offer.id)),
  };
}

/**
 * Driver accepts a ride request directly without requiring an offer first.
 *
 * Materialization rules:
 * - `trip_id` -> attach the passenger to that existing trip (driver-owned).
 * - otherwise pick the driver's closest matching open trip on the same route.
 * - when no matching trip exists, create a trip from the ride request using
 *   the driver's vehicle (all passenger seats available).
 *
 * The confirmed booking is added to the trip schedule. Its pickup point comes
 * from the ride request origin and is included in the trip route by the
 * post-booking route recompute.
 */
async function resolveAcceptTrip(driverId, request, payload, seatsNeeded) {
  if (payload.trip_id) {
    const trip = await Trip.findByPk(payload.trip_id);
    if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId) {
      throw ApiErrors.forbidden('YOU_CAN_ONLY_ATTACH_RIDES_TO_YOUR_OWN_TRIPS');
    }
    if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
      throw ApiErrors.conflict('TRIP_IS_ALREADY_ONGOING_OR_COMPLETED');
    }
    if (Number(trip.availableSeats) < seatsNeeded) {
      throw ApiErrors.conflict('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
    }
    return trip;
  }

  const candidates = await Trip.findAll({
    where: {
      driverId,
      status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] },
      availableSeats: { [Op.gte]: seatsNeeded },
      departureTime: { [Op.gte]: new Date() },
    },
    order: [['departureTime', 'ASC']],
  });
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const sameRoute = candidates.filter(
    (candidate) =>
      normalize(candidate.originCity) === normalize(request.originCity)
      && normalize(candidate.destinationCity) === normalize(request.destinationCity)
  );

  if (sameRoute.length > 0) {
    if (!request.originTime) return sameRoute[0];
    const wanted = new Date(request.originTime).getTime();
    return sameRoute.sort(
      (a, b) =>
        Math.abs(new Date(a.departureTime).getTime() - wanted)
        - Math.abs(new Date(b.departureTime).getTime() - wanted)
    )[0];
  }

  return createTripFromRideRequest(driverId, request, payload);
}

async function createTripFromRideRequest(driverId, request, payload) {
  const vehicle = await Vehicle.findOne({ where: { driverId } });
  if (!vehicle) throw ApiErrors.forbidden('DRIVER_HAS_NO_REGISTERED_VEHICLE');
  if (!vehicle.isVerified) throw ApiErrors.forbidden('DRIVER_VEHICLE_IS_NOT_VERIFIED');

  const totalSeats = Number(vehicle.seats) || 0;
  const seatsNeeded = Math.max(1, Number(request.seatsNeeded) || 1);
  if (totalSeats < seatsNeeded + 1) {
    throw ApiErrors.conflict('NOT_ENOUGH_SEATS_ON_DRIVER_VEHICLE');
  }

  const seats =
    Array.isArray(payload.seats) && payload.seats.length > 0
      ? payload.seats
      : [
          { seat_number: 1, type: SEAT_TYPE.DRIVER },
          ...Array.from({ length: totalSeats - 1 }, (_, index) => ({
            seat_number: index + 2,
            type: SEAT_TYPE.AVAILABLE,
          })),
        ];

  let departure = parseOptionalTimezoneAware(payload.origin_time);
  if (!departure && request.originTime) departure = new Date(request.originTime);
  if (!departure || departure.getTime() <= Date.now()) {
    departure = new Date(Date.now() + 60 * 60 * 1000);
  }

  const created = await tripService.createTrip(driverId, {
    origin_city: request.originCity,
    origin_lat: request.originLat != null ? Number(request.originLat) : undefined,
    origin_lng: request.originLng != null ? Number(request.originLng) : undefined,
    destination_city: request.destinationCity,
    destination_lat: request.destinationLat != null ? Number(request.destinationLat) : undefined,
    destination_lng: request.destinationLng != null ? Number(request.destinationLng) : undefined,
    departure_time: departure.toISOString(),
    fare_per_seat:
      payload.fare_per_seat != null
        ? Number(payload.fare_per_seat)
        : request.maxBudget != null
          ? Number(request.maxBudget)
          : 0,
    seats,
    type_of_trip: payload.type_of_trip === 'repeated' ? 'repeated' : 'once',
    repeated_days: payload.repeated_days,
    repeated_end_date: payload.repeated_end_date,
    allowed_type: payload.allowed_type || GENDER_PREFERENCE.ALL,
    instructions: payload.instructions || [],
    additional_instructions: payload.additional_instructions,
    pickup_point: payload.pickup_point,
    dropoff_point: payload.dropoff_point,
    waypoints: payload.waypoints,
    stops: payload.stops,
  });

  const trip = await Trip.findByPk(created.trip_id);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  return trip;
}

async function uniqueAcceptBookingCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferenceCode('MSR');
    const existing = await Booking.findOne({ where: { referenceCode: code } });
    if (!existing) return code;
  }
  throw ApiErrors.serverError('COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE');
}

async function createDirectAcceptBooking(trip, request, fare, seatsNeeded) {
  const availableSeats = await TripSeat.findAll({
    where: { tripId: trip.id, seatType: SEAT_TYPE.AVAILABLE },
    order: [['seatNumber', 'ASC']],
    limit: seatsNeeded,
  });
  if (availableSeats.length < seatsNeeded) {
    throw ApiErrors.conflict('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
  }

  const seatNumbers = availableSeats.map((seat) => Number(seat.seatNumber));
  const referenceCode = await uniqueAcceptBookingCode();
  const pickupLat = request.originLat != null ? Number(request.originLat) : trip.originLat != null ? Number(trip.originLat) : null;
  const pickupLng = request.originLng != null ? Number(request.originLng) : trip.originLng != null ? Number(trip.originLng) : null;
  const pickupLabel = request.originPlace || request.originCity || null;
  const dropoffLat = request.destinationLat != null ? Number(request.destinationLat) : trip.destinationLat != null ? Number(trip.destinationLat) : null;
  const dropoffLng = request.destinationLng != null ? Number(request.destinationLng) : trip.destinationLng != null ? Number(trip.destinationLng) : null;
  const dropoffPlace = request.destinationPlace || request.destinationCity || null;

  const booking = await sequelize.transaction(async (transaction) => {
    const freshTrip = await Trip.findByPk(trip.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!freshTrip || ![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(freshTrip.status)) {
      throw ApiErrors.conflict('TRIP_NOT_BOOKABLE');
    }

    const remainingSeats = Number(freshTrip.availableSeats) - seatsNeeded;
    if (remainingSeats < 0) {
      throw ApiErrors.conflict('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
    }

    const [claimed] = await TripSeat.update(
      { seatType: SEAT_TYPE.UNAVAILABLE },
      {
        where: {
          tripId: trip.id,
          seatNumber: { [Op.in]: seatNumbers },
          seatType: SEAT_TYPE.AVAILABLE,
        },
        transaction,
      }
    );
    if (Number(claimed) !== seatsNeeded) {
      throw ApiErrors.conflict('SEAT_ALREADY_BOOKED');
    }

    const row = await Booking.create(
      {
        tripId: trip.id,
        passengerId: request.passengerId,
        seatNumber: seatNumbers[0],
        seatNumbers,
        seatsBooked: seatsNeeded,
        agreedFare: fare,
        currency: request.currency || 'JOD',
        pickupPlace: pickupLabel,
        pickupLat,
        pickupLng,
        pickupOrder: null,
        pickupType: PICKUP_TYPE.CUSTOM,
        pickupStopId: null,
        pickupLabel,
        pickupCity: request.originCity || null,
        pickupArea: null,
        detourSeconds: 0,
        pickupStatus: PICKUP_STATUS.PENDING,
        dropoffPlace,
        dropoffLat,
        dropoffLng,
        dropoffDeadline: null,
        status: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        referenceCode,
        cancelledBy: null,
      },
      { transaction }
    );

    freshTrip.availableSeats = remainingSeats;
    if (remainingSeats === 0 && freshTrip.status === TRIP_STATUS.PUBLISHED) {
      freshTrip.status = TRIP_STATUS.FULL;
    }
    await freshTrip.save({ transaction });

    return row;
  });

  // Route recompute is best-effort after the booking exists; this is what
  // adds the ride request's point to the trip route.
  try {
    const recomputed = await routeService.computeTripRoute(trip.id);
    if (recomputed.ok) {
      try {
        realtimeService.emitToRoom(`trip:${trip.id}`, 'tracking:route_updated', {
          route_version: recomputed.routeVersion,
        });
      } catch (_err) {
        // socket layer offline (e.g. tests) — ignore
      }
    }
  } catch (err) {
    console.warn('[rideRequestService] post-accept recompute failed:', (err as Error).message);
  }

  return booking;
}

async function upsertAcceptedOffer(driverId, requestId, trip, fare, booking) {
  const existing = await RequestOffer.findOne({
    where: { requestId, driverId },
    order: [['createdat', 'DESC']],
  });

  if (existing) {
    if (existing.status === REQUEST_OFFER_STATUS.ACCEPTED && existing.bookingId) {
      throw ApiErrors.conflict('YOU_HAVE_ALREADY_ACCEPTED_THIS_RIDE_REQUEST');
    }
    existing.tripId = trip.id;
    existing.agreedFare = fare;
    if (existing.offeredFare === null || existing.offeredFare === undefined) {
      existing.offeredFare = fare;
    }
    existing.status = REQUEST_OFFER_STATUS.ACCEPTED;
    existing.bookingId = booking.id;
    existing.message = existing.message || 'Direct acceptance by driver';
    await existing.save();
    return existing;
  }

  return RequestOffer.create({
    requestId,
    driverId,
    tripId: trip.id,
    offeredFare: fare,
    agreedFare: fare,
    message: 'Direct acceptance by driver',
    status: REQUEST_OFFER_STATUS.ACCEPTED,
    bookingId: booking.id,
  });
}

async function acceptRideRequest(driverId, requestId, payload = {}) {
  payload = payload || {};
  await expireStale();

  const driver = await User.findByPk(driverId);
  if (!driver) throw ApiErrors.notFound('USER_NOT_FOUND');
  if (driver.role !== 'driver') throw ApiErrors.forbidden('ONLY_DRIVERS_CAN_ACCEPT_RIDE_REQUESTS');
  if (!driver.isVerified) throw ApiErrors.forbidden('DRIVER_NOT_VERIFIED');

  const request = await RideRequest.findByPk(requestId);
  if (!request) throw ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
  if (![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
    throw ApiErrors.conflict('RIDE_REQUEST_NO_LONGER_ACCEPTING');
  }

  const seatsNeeded = Math.max(1, Number(request.seatsNeeded) || 1);
  const trip = await resolveAcceptTrip(driverId, request, payload, seatsNeeded);
  const fare =
    payload.fare_per_seat != null
      ? Number(payload.fare_per_seat)
      : trip.farePerSeat != null
        ? Number(trip.farePerSeat)
        : request.maxBudget != null
          ? Number(request.maxBudget)
          : 0;

  const booking = await createDirectAcceptBooking(trip, request, fare, seatsNeeded);
  const offer = await upsertAcceptedOffer(driverId, requestId, trip, fare, booking);

  request.status = RIDE_REQUEST_STATUS.ACCEPTED;
  await request.save();

  // A direct acceptance takes the ride; every other pending offer is declined.
  await RequestOffer.update(
    { status: REQUEST_OFFER_STATUS.DECLINED },
    {
      where: {
        requestId: request.id,
        id: { [Op.ne]: offer.id },
        status: REQUEST_OFFER_STATUS.SENT,
      },
    }
  );

  auditService.track({
    action: 'ride_request.accepted_direct',
    resourceType: 'ride_request',
    resourceId: request.id,
    actorId: driverId,
    actorType: 'driver',
    payload: { trip_id: trip.id, booking_id: booking.id },
  });

  const passenger = await User.findByPk(request.passengerId);
  if (passenger) {
    try {
      await notificationService.sendToUser(passenger, 'RIDE_REQUEST_ACCEPTED', {
        channels: ['in_app', 'push'],
        vars: {
          driver: driver.fullName,
          trip_id: trip.id,
          booking_reference: booking.referenceCode,
        },
        data: { trip_id: trip.id, booking_id: booking.id },
      });
    } catch (err) {
      console.warn('[rideRequestService] accept notification failed:', (err as Error).message);
    }
  }

  try {
    await deleteKey(REDIS_KEYS.PASSENGER_HOME(request.passengerId));
  } catch (err) {
    console.warn('[rideRequestService] passenger home cache invalidation failed:', (err as Error).message);
  }
  try {
    await deleteKey(REDIS_KEYS.DRIVER_HOME(driverId));
  } catch (err) {
    console.warn('[rideRequestService] driver home cache invalidation failed:', (err as Error).message);
  }
  try {
    await homeService.invalidateHomeForTrip(trip.id, driverId);
  } catch (_err) {
    // best-effort
  }
  try {
    realtimeService.emitToUser(request.passengerId, 'home:invalidate', { trip_id: trip.id });
    realtimeService.emitToUser(driverId, 'home:invalidate', { trip_id: trip.id });
  } catch (_err) {
    // socket layer offline
  }

  return {
    trip: {
      id: trip.id,
      origin_city: trip.originCity,
      destination_city: trip.destinationCity,
      departure_time: trip.departureTime,
      fare_per_seat: Number(trip.farePerSeat),
      available_seats: Number(trip.availableSeats),
      status: trip.status,
    },
    booking: {
      id: booking.id,
      reference_code: booking.referenceCode,
      trip_id: booking.tripId,
      passenger_id: booking.passengerId,
      seats_booked: booking.seatsBooked,
      seat_numbers: booking.seatNumbers || [],
      agreed_fare: Number(booking.agreedFare),
      currency: booking.currency,
      pickup_place: booking.pickupPlace,
      pickup_lat: booking.pickupLat != null ? Number(booking.pickupLat) : null,
      pickup_lng: booking.pickupLng != null ? Number(booking.pickupLng) : null,
      status: booking.status,
      payment_status: booking.paymentStatus,
    },
    offer: serializeOffer(offer),
  };
}module.exports = {
  createRideRequest,
  listRequests,
  getRequest,
  updateRideRequest,
  submitOffer,
  listOffersForRequest,
  listDriverOffers,
  decideOffer,
  agreeOfferPrice,
  attachOfferToTrip,
  acceptRideRequest,
  getMatches,
  expireStale,
};
export { createRideRequest, listRequests, getRequest, updateRideRequest, submitOffer, listOffersForRequest, listDriverOffers, decideOffer, agreeOfferPrice, attachOfferToTrip, acceptRideRequest, getMatches, expireStale };
export default module.exports;