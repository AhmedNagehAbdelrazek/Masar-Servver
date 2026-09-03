"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRideRequest = createRideRequest;
exports.listRequests = listRequests;
exports.getRequest = getRequest;
exports.updateRideRequest = updateRideRequest;
exports.submitOffer = submitOffer;
exports.listOffersForRequest = listOffersForRequest;
exports.listDriverOffers = listDriverOffers;
exports.decideOffer = decideOffer;
exports.agreeOfferPrice = agreeOfferPrice;
exports.attachOfferToTrip = attachOfferToTrip;
exports.getMatches = getMatches;
exports.expireStale = expireStale;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const masking_1 = require("../utils/masking");
const auditService_1 = __importDefault(require("./auditService"));
const notificationService_1 = __importDefault(require("./notificationService"));
const referenceCode_1 = require("../utils/referenceCode");
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const MATCH_WINDOW_BEFORE_MS = 24 * 60 * 60 * 1000;
const MATCH_WINDOW_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const MATCH_LIMIT = 10; // support at least 10 candidates
function genderCompatible(trip, request) {
    const pref = request.attributesPreferred && request.attributesPreferred.gender_preference;
    if (!pref || pref === 'all')
        return true;
    if (!trip.genderPreference || trip.genderPreference === 'all')
        return true;
    return trip.genderPreference === pref;
}
function matchScore(trip, request) {
    let score = 0;
    // 1. Route match — the strongest signal.
    if (trip.originCity === request.originCity)
        score += 100;
    if (trip.destinationCity === request.destinationCity)
        score += 100;
    // 2. Time window — trips closest to the requested departure rank higher.
    const requested = request.originTime ? new Date(request.originTime).getTime() : Date.now();
    const actual = new Date(trip.departureTime).getTime();
    const diffMin = Math.round(Math.abs(requested - actual) / 60000);
    score -= Math.min(diffMin, 720) / 12; // up to ~60 points beyond 12h
    // 3. Seat availability — more free seats is a little better.
    score += Math.min(Number(trip.availableSeats), 4);
    // 4. Gender preference compatibility.
    if (genderCompatible(trip, request))
        score += 5;
    return score;
}
/** US6: ranked trip suggestions for a passenger's ride request (never books). */
async function getMatches(user, requestId) {
    await expireStale();
    const request = await Models_1.RideRequest.findByPk(requestId);
    if (!request)
        throw ApiError_1.ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
    if (request.passengerId !== user.id) {
        throw ApiError_1.ApiErrors.custom('YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS', 403, 'YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS');
    }
    const seatsNeeded = Math.max(1, request.seatsNeeded || 1);
    const requestedMs = request.originTime
        ? new Date(request.originTime).getTime()
        : Date.now();
    const windowStart = new Date(requestedMs - MATCH_WINDOW_BEFORE_MS);
    const windowEnd = new Date(requestedMs + MATCH_WINDOW_AFTER_MS);
    const trips = await Models_1.Trip.findAll({
        where: {
            status: { [sequelize_1.Op.in]: [constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL] },
            availableSeats: { [sequelize_1.Op.gte]: seatsNeeded },
            departureTime: { [sequelize_1.Op.between]: [windowStart, windowEnd] },
        },
        include: [{ model: Models_1.User, as: 'driver', attributes: ['id', 'fullName', 'avgRating'] }],
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
function serializeRideRequest(request, options = {}) {
    const base = {
        id: request.id,
        passenger_id: request.passengerId,
        passenger_name: request.passenger ? request.passenger.fullName : null,
        passenger_phone_masked: request.passenger ? (0, masking_1.maskPhone)(request.passenger.phone) : null,
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
    await Models_1.RideRequest.update({ status: constants_1.RIDE_REQUEST_STATUS.EXPIRED }, {
        where: {
            status: { [sequelize_1.Op.in]: [constants_1.RIDE_REQUEST_STATUS.OPEN, constants_1.RIDE_REQUEST_STATUS.OFFERED] },
            [sequelize_1.Op.or]: [
                { arrivalDeadline: { [sequelize_1.Op.and]: [{ [sequelize_1.Op.ne]: null }, { [sequelize_1.Op.lt]: now }] } },
                { expiresAt: { [sequelize_1.Op.lt]: now } },
            ],
        },
    });
    const ttlCutoff = new Date(now.getTime() - constants_1.REQUEST_OFFER_TTL_HOURS * 60 * 60 * 1000);
    await Models_1.RequestOffer.update({ status: constants_1.REQUEST_OFFER_STATUS.EXPIRED }, {
        where: {
            status: constants_1.REQUEST_OFFER_STATUS.SENT,
            createdat: { [sequelize_1.Op.lt]: ttlCutoff },
        },
    });
}
function computeExpiresAt(arrivalDeadline, originTime) {
    if (arrivalDeadline)
        return new Date(arrivalDeadline);
    const base = originTime ? new Date(originTime) : new Date();
    return new Date(base.getTime() + constants_1.REQUEST_OFFER_TTL_HOURS * 60 * 60 * 1000);
}
async function createRideRequest(userId, payload) {
    const user = await Models_1.User.findByPk(userId);
    if (!user)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    const request = await Models_1.RideRequest.create({
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
        status: constants_1.RIDE_REQUEST_STATUS.OPEN,
        expiresAt: computeExpiresAt(payload.arrival_deadline, payload.origin_time),
    });
    auditService_1.default.track({
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
    const { page, limit, offset } = (0, pagination_1.parsePagination)(filters);
    let where = {};
    if (user.role === 'driver') {
        where = { passengerId: { [sequelize_1.Op.ne]: user.id } };
        where.status = status || constants_1.RIDE_REQUEST_STATUS.OPEN;
    }
    else {
        where = { passengerId: user.id };
        if (status)
            where.status = status;
    }
    const { rows, count } = await Models_1.RideRequest.findAndCountAll({
        where,
        include: [{ model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] }],
        order: [['createdat', 'DESC']],
        offset,
        limit,
    });
    return {
        data: rows.map((r) => serializeRideRequest(r)),
        pagination: (0, pagination_1.buildPagination)(count, page, limit),
    };
}
async function getRequest(user, requestId) {
    await expireStale();
    const request = await Models_1.RideRequest.findByPk(requestId, {
        include: [
            { model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] },
            {
                model: Models_1.RequestOffer,
                as: 'offers',
                include: [{ model: Models_1.User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
            },
        ],
    });
    if (!request)
        throw ApiError_1.ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
    const isOwner = request.passengerId === user.id;
    const isDriver = user.role === 'driver';
    if (!isOwner && !isDriver) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_YOUR_OWN_RIDE_REQUESTS');
    }
    return { ride_request: serializeRideRequest(request, { includeOffers: true }) };
}
async function updateRideRequest(userId, requestId, payload) {
    await expireStale();
    const request = await Models_1.RideRequest.findByPk(requestId);
    if (!request)
        throw ApiError_1.ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
    if (request.passengerId !== userId) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_UPDATE_YOUR_OWN_RIDE_REQUESTS');
    }
    if (![constants_1.RIDE_REQUEST_STATUS.OPEN, constants_1.RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
        throw ApiError_1.ApiErrors.conflict('ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED');
    }
    if (payload.action === 'cancel') {
        request.status = constants_1.RIDE_REQUEST_STATUS.CANCELLED;
        await request.save();
        await Models_1.RequestOffer.update({ status: constants_1.REQUEST_OFFER_STATUS.DECLINED }, { where: { requestId: request.id, status: constants_1.REQUEST_OFFER_STATUS.SENT } });
        auditService_1.default.track({
            action: 'ride_request.cancelled',
            resourceType: 'ride_request',
            resourceId: request.id,
            actorId: userId,
            actorType: 'passenger',
        });
        return serializeRideRequest(request);
    }
    const updatable = {};
    if (payload.origin_place !== undefined)
        updatable.originPlace = payload.origin_place;
    if (payload.origin_city !== undefined)
        updatable.originCity = payload.origin_city;
    if (payload.origin_time !== undefined)
        updatable.originTime = payload.origin_time ? new Date(payload.origin_time) : null;
    if (payload.destination_city !== undefined)
        updatable.destinationCity = payload.destination_city;
    if (payload.arrival_deadline !== undefined) {
        updatable.arrivalDeadline = payload.arrival_deadline ? new Date(payload.arrival_deadline) : null;
    }
    if (payload.seats_needed !== undefined)
        updatable.seatsNeeded = payload.seats_needed;
    if (payload.max_budget !== undefined)
        updatable.maxBudget = payload.max_budget;
    if (payload.attributes_preferred !== undefined)
        updatable.attributesPreferred = payload.attributes_preferred;
    await request.update(updatable);
    if (updatable.arrivalDeadline !== undefined) {
        request.expiresAt = computeExpiresAt(request.arrivalDeadline, request.originTime);
        await request.save();
    }
    auditService_1.default.track({
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
    const driver = await Models_1.User.findByPk(driverId);
    if (!driver)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    const request = await Models_1.RideRequest.findByPk(requestId);
    if (!request)
        throw ApiError_1.ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
    if (![constants_1.RIDE_REQUEST_STATUS.OPEN, constants_1.RIDE_REQUEST_STATUS.OFFERED].includes(request.status)) {
        throw ApiError_1.ApiErrors.conflict('THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS');
    }
    const duplicate = await Models_1.RequestOffer.findOne({
        where: {
            requestId,
            driverId,
            status: constants_1.REQUEST_OFFER_STATUS.SENT,
        },
    });
    if (duplicate) {
        throw ApiError_1.ApiErrors.conflict('YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST');
    }
    const offer = await Models_1.RequestOffer.create({
        requestId,
        driverId,
        tripId: payload.trip_id || null,
        offeredFare: payload.offered_fare !== undefined ? payload.offered_fare : null,
        message: payload.message || null,
        status: constants_1.REQUEST_OFFER_STATUS.SENT,
    });
    if (request.status === constants_1.RIDE_REQUEST_STATUS.OPEN) {
        request.status = constants_1.RIDE_REQUEST_STATUS.OFFERED;
        await request.save();
    }
    auditService_1.default.track({
        action: 'offer.submitted',
        resourceType: 'request_offer',
        resourceId: offer.id,
        actorId: driverId,
        actorType: 'driver',
        payload: { request_id: requestId, offered_fare: offer.offeredFare },
    });
    const passenger = await Models_1.User.findByPk(request.passengerId);
    if (passenger) {
        await notificationService_1.default.sendToUser(passenger, 'OFFER_RECEIVED', {
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
    const request = await Models_1.RideRequest.findByPk(requestId, {
        include: [
            {
                model: Models_1.RequestOffer,
                as: 'offers',
                include: [{ model: Models_1.User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
            },
        ],
    });
    if (!request)
        throw ApiError_1.ApiErrors.notFound('RIDE_REQUEST_NOT_FOUND');
    const isOwner = request.passengerId === userId;
    const participates = (request.offers || []).some((o) => o.driverId === userId);
    if (!isOwner && !participates) {
        // drivers who never offered cannot browse others' offers
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_OFFERS_ON_YOUR_OWN_REQUESTS_OR');
    }
    return { data: (request.offers || []).map(serializeOffer) };
}
async function listDriverOffers(driverId, filters = {}) {
    await expireStale();
    const { status } = filters;
    const { page, limit, offset } = (0, pagination_1.parsePagination)(filters);
    const where = { driverId };
    if (status)
        where.status = status;
    const { rows, count } = await Models_1.RequestOffer.findAndCountAll({
        where,
        include: [
            {
                model: Models_1.RideRequest,
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
        pagination: (0, pagination_1.buildPagination)(count, page, limit),
    };
}
async function decideOffer(passengerId, offerId, action) {
    await expireStale();
    const offer = await Models_1.RequestOffer.findByPk(offerId, {
        include: [
            { model: Models_1.RideRequest, as: 'rideRequest' },
            { model: Models_1.User, as: 'driver', attributes: ['id', 'fullName'] },
        ],
    });
    if (!offer)
        throw ApiError_1.ApiErrors.notFound('OFFER_NOT_FOUND');
    if (!offer.rideRequest || offer.rideRequest.passengerId !== passengerId) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_DECIDE_ON_OFFERS_TO_YOUR_OWN_RIDE');
    }
    if (offer.status !== constants_1.REQUEST_OFFER_STATUS.SENT) {
        throw ApiError_1.ApiErrors.conflict('OFFER_NO_LONGER_DECIDABLE', null, { status: offer.status });
    }
    if (action === 'accept') {
        offer.status = constants_1.REQUEST_OFFER_STATUS.ACCEPTED;
        await offer.save();
        offer.rideRequest.status = constants_1.RIDE_REQUEST_STATUS.ACCEPTED;
        await offer.rideRequest.save();
        await Models_1.RequestOffer.update({ status: constants_1.REQUEST_OFFER_STATUS.DECLINED }, {
            where: {
                requestId: offer.requestId,
                id: { [sequelize_1.Op.ne]: offer.id },
                status: constants_1.REQUEST_OFFER_STATUS.SENT,
            },
        });
        auditService_1.default.track({
            action: 'offer.accepted',
            resourceType: 'request_offer',
            resourceId: offer.id,
            actorId: passengerId,
            actorType: 'passenger',
            payload: { request_id: offer.requestId, driver_id: offer.driverId },
        });
        if (offer.driver) {
            await notificationService_1.default.sendToUser(offer.driver, 'OFFER_ACCEPTED', {
                channels: ['in_app', 'push'],
                vars: {},
            });
        }
    }
    else {
        offer.status = constants_1.REQUEST_OFFER_STATUS.DECLINED;
        await offer.save();
        const remaining = await Models_1.RequestOffer.count({
            where: { requestId: offer.requestId, status: constants_1.REQUEST_OFFER_STATUS.SENT },
        });
        if (remaining === 0 &&
            offer.rideRequest.status === constants_1.RIDE_REQUEST_STATUS.OFFERED) {
            offer.rideRequest.status = constants_1.RIDE_REQUEST_STATUS.OPEN;
            await offer.rideRequest.save();
        }
        auditService_1.default.track({
            action: 'offer.declined',
            resourceType: 'request_offer',
            resourceId: offer.id,
            actorId: passengerId,
            actorType: 'passenger',
            payload: { request_id: offer.requestId },
        });
        if (offer.driver) {
            await notificationService_1.default.sendToUser(offer.driver, 'OFFER_DECLINED', {
                channels: ['in_app', 'push'],
                vars: {},
            });
        }
    }
    return serializeOffer(offer);
}
async function agreeOfferPrice(passengerId, offerId, agreedFare) {
    await expireStale();
    const offer = await Models_1.RequestOffer.findByPk(offerId, {
        include: [
            { model: Models_1.RideRequest, as: 'rideRequest' },
            { model: Models_1.User, as: 'driver', attributes: ['id', 'fullName'] },
        ],
    });
    if (!offer)
        throw ApiError_1.ApiErrors.notFound('OFFER_NOT_FOUND');
    if (!offer.rideRequest || offer.rideRequest.passengerId !== passengerId) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_AGREE_PRICES_ON_OFFERS_TO_YOUR_OWN');
    }
    if (offer.status !== constants_1.REQUEST_OFFER_STATUS.ACCEPTED) {
        throw ApiError_1.ApiErrors.conflict('ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE');
    }
    if (offer.rideRequest.status === constants_1.RIDE_REQUEST_STATUS.CANCELLED || offer.rideRequest.status === constants_1.RIDE_REQUEST_STATUS.EXPIRED) {
        throw ApiError_1.ApiErrors.conflict('THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE');
    }
    offer.agreedFare = agreedFare;
    await offer.save();
    auditService_1.default.track({
        action: 'offer.price_agreed',
        resourceType: 'request_offer',
        resourceId: offer.id,
        actorId: passengerId,
        actorType: 'passenger',
        payload: { request_id: offer.requestId, agreed_fare: agreedFare },
    });
    if (offer.driver) {
        await notificationService_1.default.sendToUser(offer.driver, 'OFFER_PRICE_AGREED', {
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
    const offer = await Models_1.RequestOffer.findByPk(offerId, {
        include: [
            { model: Models_1.RideRequest, as: 'rideRequest' },
            { model: Models_1.User, as: 'driver', attributes: ['id', 'fullName'] },
        ],
    });
    if (!offer)
        throw ApiError_1.ApiErrors.notFound('OFFER_NOT_FOUND');
    if (offer.driverId !== driverId) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_ATTACH_YOUR_OWN_OFFERS');
    }
    if (offer.bookingId) {
        throw ApiError_1.ApiErrors.conflict('OFFER_ALREADY_ATTACHED_TO_A_BOOKING');
    }
    if (offer.status !== constants_1.REQUEST_OFFER_STATUS.ACCEPTED) {
        throw ApiError_1.ApiErrors.conflict('ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP');
    }
    if (!offer.rideRequest || offer.rideRequest.status !== constants_1.RIDE_REQUEST_STATUS.ACCEPTED) {
        throw ApiError_1.ApiErrors.conflict('THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE');
    }
    if (offer.agreedFare === null || offer.agreedFare === undefined) {
        throw ApiError_1.ApiErrors.conflict('AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO');
    }
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_ATTACH_OFFERS_TO_YOUR_OWN_TRIPS');
    }
    if (![constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL].includes(trip.status)) {
        throw ApiError_1.ApiErrors.conflict('TRIP_IS_ALREADY_ONGOING_OR_COMPLETED');
    }
    const seatsNeeded = offer.rideRequest.seatsNeeded || 1;
    async function uniqueBookingCode() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = (0, referenceCode_1.generateReferenceCode)('MSR');
            const existing = await Models_1.Booking.findOne({ where: { referenceCode: code } });
            if (!existing)
                return code;
        }
        throw ApiError_1.ApiErrors.serverError('COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE');
    }
    const referenceCode = await uniqueBookingCode();
    const booking = await Models_1.sequelize.transaction(async (t) => {
        const freshTrip = await Models_1.Trip.findByPk(tripId, { transaction: t, lock: t.LOCK.UPDATE });
        const remainingSeats = freshTrip.availableSeats - seatsNeeded;
        if (remainingSeats < 0) {
            throw ApiError_1.ApiErrors.conflict('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
        }
        const row = await Models_1.Booking.create({
            tripId,
            passengerId: offer.rideRequest.passengerId,
            seatNumber: null,
            seatsBooked: seatsNeeded,
            agreedFare: offer.agreedFare,
            currency: offer.rideRequest.currency || 'JOD',
            dropoffPlace: payload.dropoff_place || null,
            dropoffDeadline: payload.dropoff_deadline ? new Date(payload.dropoff_deadline) : null,
            status: constants_1.BOOKING_STATUS.CONFIRMED,
            paymentStatus: constants_1.PAYMENT_STATUS.PENDING,
            referenceCode,
            cancelledBy: null,
        }, { transaction: t });
        freshTrip.availableSeats = remainingSeats;
        if (remainingSeats === 0 && freshTrip.status === constants_1.TRIP_STATUS.PUBLISHED) {
            freshTrip.status = constants_1.TRIP_STATUS.FULL;
        }
        await freshTrip.save({ transaction: t });
        offer.bookingId = row.id;
        await offer.save({ transaction: t });
        return row;
    });
    auditService_1.default.track({
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
    const passenger = await Models_1.User.findByPk(offer.rideRequest.passengerId);
    if (passenger) {
        await notificationService_1.default.sendToUser(passenger, 'BOOKING_CREATED_FROM_OFFER', {
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
        offer: serializeOffer(await Models_1.RequestOffer.findByPk(offer.id)),
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
    getMatches,
    expireStale,
};
exports.default = module.exports;
//# sourceMappingURL=rideRequestService.js.map