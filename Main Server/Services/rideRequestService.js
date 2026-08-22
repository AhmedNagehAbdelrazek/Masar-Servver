const { Op } = require('sequelize');
const {
  RideRequest,
  RequestOffer,
  Booking,
  Trip,
  User,
  sequelize,
} = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { maskPhone } = require('../utils/masking');
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  TRIP_STATUS,
  REQUEST_OFFER_STATUS,
  RIDE_REQUEST_STATUS,
  REQUEST_OFFER_TTL_HOURS,
} = require('../config/constants');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const { generateReferenceCode } = require('../utils/referenceCode');

function serializeRideRequest(request, options = {}) {
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
  if (arrivalDeadline) return new Date(arrivalDeadline);
  const base = originTime ? new Date(originTime) : new Date();
  return new Date(base.getTime() + REQUEST_OFFER_TTL_HOURS * 60 * 60 * 1000);
}

async function createRideRequest(userId, payload) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiErrors.notFound('User not found');

  const request = await RideRequest.create({
    passengerId: userId,
    originPlace: payload.origin_place || payload.origin_city,
    originCity: payload.origin_city,
    originLat: payload.origin_lat !== undefined ? payload.origin_lat : null,
    originLng: payload.origin_lng !== undefined ? payload.origin_lng : null,
    originTime: payload.origin_time ? new Date(payload.origin_time) : null,
    destinationPlace: payload.destination_place || payload.destination_city,
    destinationCity: payload.destination_city,
    destinationLat: payload.destination_lat !== undefined ? payload.destination_lat : null,
    destinationLng: payload.destination_lng !== undefined ? payload.destination_lng : null,
    arrivalDeadline: payload.arrival_deadline ? new Date(payload.arrival_deadline) : null,
    seatsNeeded: payload.seats_needed || 1,
    maxBudget: payload.max_budget !== undefined ? payload.max_budget : null,
    currency: 'JOD',
    attributesPreferred: payload.attributes_preferred || {},
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
  if (!request) throw ApiErrors.notFound('Ride request not found');

  const isOwner = request.passengerId === user.id;
  const isDriver = user.role === 'driver';
  if (!isOwner && !isDriver) {
    throw ApiErrors.forbidden('You can only view your own ride requests');
  }

  return { ride_request: serializeRideRequest(request, { includeOffers: true }) };
}

async function updateRideRequest(userId, requestId, payload) {
  await expireStale();

  const request = await RideRequest.findByPk(requestId);
  if (!request) throw ApiErrors.notFound('Ride request not found');
  if (request.passengerId !== userId) {
    throw ApiErrors.forbidden('You can only update your own ride requests');
  }
  if (![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
    throw ApiErrors.conflict('Only open or offered ride requests can be updated');
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
  if (payload.origin_time !== undefined) updatable.originTime = payload.origin_time ? new Date(payload.origin_time) : null;
  if (payload.destination_city !== undefined) updatable.destinationCity = payload.destination_city;
  if (payload.arrival_deadline !== undefined) {
    updatable.arrivalDeadline = payload.arrival_deadline ? new Date(payload.arrival_deadline) : null;
  }
  if (payload.seats_needed !== undefined) updatable.seatsNeeded = payload.seats_needed;
  if (payload.max_budget !== undefined) updatable.maxBudget = payload.max_budget;
  if (payload.attributes_preferred !== undefined) updatable.attributesPreferred = payload.attributes_preferred;

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
  if (!driver) throw ApiErrors.notFound('User not found');

  const request = await RideRequest.findByPk(requestId);
  if (!request) throw ApiErrors.notFound('Ride request not found');
  if (![RIDE_REQUEST_STATUS.OPEN, RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
    throw ApiErrors.conflict('This ride request is no longer accepting offers');
  }

  const duplicate = await RequestOffer.findOne({
    where: {
      requestId,
      driverId,
      status: REQUEST_OFFER_STATUS.SENT,
    },
  });
  if (duplicate) {
    throw ApiErrors.conflict('You already have a pending offer on this ride request');
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
  if (!request) throw ApiErrors.notFound('Ride request not found');

  const isOwner = request.passengerId === userId;
  const participates = (request.offers || []).some((o) => o.driverId === userId);
  if (!isOwner && !participates) {
    // drivers who never offered cannot browse others' offers
    throw ApiErrors.forbidden('You can only view offers on your own requests or ones you submitted');
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
  if (!offer) throw ApiErrors.notFound('Offer not found');
  if (!offer.rideRequest || offer.rideRequest.passengerId !== passengerId) {
    throw ApiErrors.forbidden('You can only decide on offers to your own ride requests');
  }
  if (offer.status !== REQUEST_OFFER_STATUS.SENT) {
    throw ApiErrors.conflict(`Offer is no longer decidable (status: ${offer.status})`);
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
  if (!offer) throw ApiErrors.notFound('Offer not found');
  if (!offer.rideRequest || offer.rideRequest.passengerId !== passengerId) {
    throw ApiErrors.forbidden('You can only agree prices on offers to your own ride requests');
  }
  if (offer.status !== REQUEST_OFFER_STATUS.ACCEPTED) {
    throw ApiErrors.conflict('Accept the offer before agreeing on a final price');
  }
  if (offer.rideRequest.status === RIDE_REQUEST_STATUS.CANCELLED || offer.rideRequest.status === RIDE_REQUEST_STATUS.EXPIRED) {
    throw ApiErrors.conflict('The ride request is no longer active');
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
  if (!offer) throw ApiErrors.notFound('Offer not found');
  if (offer.driverId !== driverId) {
    throw ApiErrors.forbidden('You can only attach your own offers');
  }
  if (offer.bookingId) {
    throw ApiErrors.conflict('Offer already attached to a booking');
  }
  if (offer.status !== REQUEST_OFFER_STATUS.ACCEPTED) {
    throw ApiErrors.conflict('Only accepted offers can be attached to a trip');
  }
  if (!offer.rideRequest || offer.rideRequest.status !== RIDE_REQUEST_STATUS.ACCEPTED) {
    throw ApiErrors.conflict('The underlying ride request is not in an accepted state');
  }
  if (offer.agreedFare === null || offer.agreedFare === undefined) {
    throw ApiErrors.conflict('Agree on a final price before attaching the offer to a trip');
  }

  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.driverId !== driverId) {
    throw ApiErrors.forbidden('You can only attach offers to your own trips');
  }
  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('Trip is already ongoing or completed');
  }

  const seatsNeeded = offer.rideRequest.seatsNeeded || 1;

  async function uniqueBookingCode() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferenceCode('MSR');
      const existing = await Booking.findOne({ where: { referenceCode: code } });
      if (!existing) return code;
    }
    throw ApiErrors.serverError('Could not generate a unique reference code');
  }

  const referenceCode = await uniqueBookingCode();

  const booking = await sequelize.transaction(async (t) => {
    const freshTrip = await Trip.findByPk(tripId, { transaction: t, lock: t.LOCK.UPDATE });
    const remainingSeats = freshTrip.availableSeats - seatsNeeded;
    if (remainingSeats < 0) {
      throw ApiErrors.conflict('Not enough available seats on the selected trip');
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
        dropoffDeadline: payload.dropoff_deadline ? new Date(payload.dropoff_deadline) : null,
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

  const passenger = await User.findByPk(offer.rideRequest.passengerId);
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

module.exports = {
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
  expireStale,
};
