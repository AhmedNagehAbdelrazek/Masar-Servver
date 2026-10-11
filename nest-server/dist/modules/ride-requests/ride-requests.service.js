var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RideRequestsService_1;
import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { generateReferenceCode } from '../../common/utils/reference-code.js';
import { parseOptionalTimezoneAware } from '../../common/utils/time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RedisService } from '../../redis/redis.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
const MATCH_WINDOW_BEFORE_MS = 24 * 3600 * 1000;
const MATCH_WINDOW_AFTER_MS = 2 * 24 * 3600 * 1000;
const MATCH_LIMIT = 10;
const REQUEST_OFFER_TTL_HOURS = 24;
function genderCompatible(trip, request) {
    const pref = request.attributesPreferred?.gender_preference;
    if (!pref || pref === 'all')
        return true;
    if (!trip.genderPreference || trip.genderPreference === 'all')
        return true;
    return trip.genderPreference === pref;
}
function matchScore(trip, request) {
    let score = 0;
    if (trip.originCity === request.originCity)
        score += 100;
    if (trip.destinationCity === request.destinationCity)
        score += 100;
    const requested = request.originTime ? new Date(request.originTime).getTime() : Date.now();
    const actual = new Date(trip.departureTime).getTime();
    const diffMin = Math.round(Math.abs(requested - actual) / 60000);
    score -= Math.min(diffMin, 720) / 12;
    score += Math.min(Number(trip.availableSeats), 4);
    if (genderCompatible(trip, request))
        score += 5;
    return score;
}
function serializeOffer(offer) {
    return {
        id: offer.id,
        request_id: offer.requestId,
        driver_id: offer.driverId,
        driver_name: offer.driver?.fullName ?? null,
        trip_id: offer.tripId,
        offered_fare: offer.offeredFare != null ? Number(offer.offeredFare) : null,
        message: offer.message,
        status: offer.status,
        agreed_fare: offer.agreedFare != null ? Number(offer.agreedFare) : null,
        booking_id: offer.bookingId,
        created_at: offer.createdAt,
    };
}
function serializeRideRequest(request, { includeOffers = false } = {}) {
    const out = {
        id: request.id,
        passenger_id: request.passengerId,
        passenger_name: request.passenger?.fullName ?? null,
        passenger_phone_masked: request.passenger ? maskPhone(request.passenger.phone) : null,
        origin_place: request.originPlace,
        origin_city: request.originCity,
        origin_lat: request.originLat != null ? Number(request.originLat) : null,
        origin_lng: request.originLng != null ? Number(request.originLng) : null,
        origin_time: request.originTime,
        destination_place: request.destinationPlace,
        destination_city: request.destinationCity,
        destination_lat: request.destinationLat != null ? Number(request.destinationLat) : null,
        destination_lng: request.destinationLng != null ? Number(request.destinationLng) : null,
        arrival_deadline: request.arrivalDeadline,
        seats_needed: request.seatsNeeded,
        max_budget: request.maxBudget != null ? Number(request.maxBudget) : null,
        currency: request.currency,
        attributes_preferred: request.attributesPreferred,
        note: request.note ?? null,
        status: request.status,
        expires_at: request.expiresAt,
        created_at: request.createdAt,
    };
    if (includeOffers) {
        out.offers = (request.offers ?? []).map(serializeOffer);
    }
    return out;
}
let RideRequestsService = RideRequestsService_1 = class RideRequestsService {
    prisma;
    notifications;
    home;
    redis;
    realtime;
    logger = new Logger(RideRequestsService_1.name);
    constructor(prisma, notifications, home, redis, realtime) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.home = home;
        this.redis = redis;
        this.realtime = realtime;
    }
    async expireStale() {
        const now = new Date();
        await this.prisma.rideRequest.updateMany({
            where: {
                status: { in: ['open', 'offered'] },
                OR: [{ arrivalDeadline: { not: null, lt: now } }, { expiresAt: { lt: now } }],
            },
            data: { status: 'expired' },
        });
        const ttlCutoff = new Date(now.getTime() - REQUEST_OFFER_TTL_HOURS * 3600 * 1000);
        await this.prisma.requestOffer.updateMany({
            where: { status: 'sent', createdAt: { lt: ttlCutoff } },
            data: { status: 'expired' },
        });
    }
    computeExpiresAt(arrivalDeadline, originTime) {
        const deadline = parseOptionalTimezoneAware(arrivalDeadline);
        if (deadline)
            return deadline;
        const base = parseOptionalTimezoneAware(originTime) ?? new Date();
        return new Date(base.getTime() + REQUEST_OFFER_TTL_HOURS * 3600 * 1000);
    }
    async createRideRequest(userId, payload) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        const request = await this.prisma.rideRequest.create({
            data: {
                passengerId: userId,
                originPlace: payload.origin_place ?? payload.origin_city,
                originCity: payload.origin_city,
                originLat: payload.origin_lat !== undefined ? Number(payload.origin_lat) : null,
                originLng: payload.origin_lng !== undefined ? Number(payload.origin_lng) : null,
                originTime: parseOptionalTimezoneAware(payload.origin_time),
                destinationPlace: payload.destination_place ?? payload.destination_city,
                destinationCity: payload.destination_city,
                destinationLat: payload.destination_lat !== undefined ? Number(payload.destination_lat) : null,
                destinationLng: payload.destination_lng !== undefined ? Number(payload.destination_lng) : null,
                arrivalDeadline: parseOptionalTimezoneAware(payload.arrival_deadline),
                seatsNeeded: payload.seats_needed ?? 1,
                maxBudget: payload.max_budget !== undefined ? Number(payload.max_budget) : null,
                currency: 'JOD',
                attributesPreferred: (payload.attributes_preferred ?? {}),
                note: payload.note ? String(payload.note).trim() : null,
                status: 'open',
                expiresAt: this.computeExpiresAt(payload.arrival_deadline, payload.origin_time),
            },
            include: { passenger: { select: { fullName: true, phone: true } } },
        });
        return serializeRideRequest(request);
    }
    async listRequests(user, filters = {}) {
        await this.expireStale();
        const { page, limit, offset } = parsePagination(filters);
        const where = user.role === 'driver'
            ? { passengerId: { not: user.id }, status: filters.status ?? 'open' }
            : { passengerId: user.id, ...(filters.status ? { status: filters.status } : {}) };
        const [rows, count] = await Promise.all([
            this.prisma.rideRequest.findMany({
                where: where,
                include: { passenger: { select: { id: true, fullName: true, phone: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.rideRequest.count({ where: where }),
        ]);
        return {
            data: rows.map((r) => serializeRideRequest(r)),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getRequest(user, requestId) {
        await this.expireStale();
        const request = await this.prisma.rideRequest.findUnique({
            where: { id: requestId },
            include: {
                passenger: { select: { id: true, fullName: true, phone: true } },
                offers: { include: { driver: { select: { id: true, fullName: true, phone: true } } } },
            },
        });
        if (!request) {
            throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
        }
        const isOwner = request.passengerId === user.id;
        const isDriver = user.role === 'driver';
        if (!isOwner && !isDriver) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_VIEW_YOUR_OWN_RIDE_REQUESTS',
                code: 'FORBIDDEN',
            });
        }
        return {
            ride_request: serializeRideRequest(request, { includeOffers: true }),
        };
    }
    async updateRideRequest(userId, requestId, payload) {
        await this.expireStale();
        const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
        }
        if (request.passengerId !== userId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_UPDATE_YOUR_OWN_RIDE_REQUESTS',
                code: 'FORBIDDEN',
            });
        }
        if (!['open', 'offered'].includes(request.status)) {
            throw new ConflictException({
                message: 'ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED',
                code: 'ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED',
            });
        }
        if (payload.action === 'cancel') {
            const updated = await this.prisma.rideRequest.update({
                where: { id: requestId },
                data: { status: 'cancelled' },
            });
            await this.prisma.requestOffer.updateMany({
                where: { requestId, status: 'sent' },
                data: { status: 'declined' },
            });
            return { ride_request: serializeRideRequest(updated) };
        }
        const data = {};
        if (payload.origin_place !== undefined)
            data.originPlace = payload.origin_place;
        if (payload.origin_city !== undefined)
            data.originCity = payload.origin_city;
        if (payload.origin_time !== undefined) {
            data.originTime = parseOptionalTimezoneAware(payload.origin_time);
        }
        if (payload.destination_city !== undefined)
            data.destinationCity = payload.destination_city;
        if (payload.arrival_deadline !== undefined) {
            data.arrivalDeadline = parseOptionalTimezoneAware(payload.arrival_deadline);
        }
        if (payload.seats_needed !== undefined)
            data.seatsNeeded = payload.seats_needed;
        if (payload.max_budget !== undefined)
            data.maxBudget = Number(payload.max_budget);
        if (payload.attributes_preferred !== undefined)
            data.attributesPreferred = payload.attributes_preferred;
        if (payload.note !== undefined) {
            data.note = payload.note ? String(payload.note).trim() : null;
        }
        const updated = await this.prisma.rideRequest.update({ where: { id: requestId }, data: data });
        if (payload.arrival_deadline !== undefined) {
            const expiresAt = this.computeExpiresAt(payload.arrival_deadline, payload.origin_time ?? undefined);
            await this.prisma.rideRequest.update({ where: { id: requestId }, data: { expiresAt } });
            const refetched = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
            return { ride_request: serializeRideRequest(refetched) };
        }
        return { ride_request: serializeRideRequest(updated) };
    }
    async submitOffer(driverId, requestId, payload) {
        await this.expireStale();
        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!driver)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
        }
        if (!['open', 'offered'].includes(request.status)) {
            throw new ConflictException({
                message: 'THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS',
                code: 'THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS',
            });
        }
        const duplicate = await this.prisma.requestOffer.findFirst({
            where: { requestId, driverId, status: 'sent' },
        });
        if (duplicate) {
            throw new ConflictException({
                message: 'YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST',
                code: 'YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST',
            });
        }
        const offer = await this.prisma.requestOffer.create({
            data: {
                requestId,
                driverId,
                tripId: payload.trip_id ?? null,
                offeredFare: payload.offered_fare !== undefined && payload.offered_fare !== null ? Number(payload.offered_fare) : null,
                message: payload.message ?? null,
                status: 'sent',
            },
        });
        if (request.status === 'open') {
            await this.prisma.rideRequest.update({ where: { id: requestId }, data: { status: 'offered' } });
        }
        try {
            const passenger = await this.prisma.user.findUnique({ where: { id: request.passengerId } });
            if (passenger) {
                await this.notifications.sendToUser(passenger, 'OFFER_RECEIVED', {
                    channels: ['in_app', 'push'],
                    vars: {
                        driver: driver.fullName,
                        offered_fare: payload.offered_fare !== undefined && payload.offered_fare !== null
                            ? String(payload.offered_fare)
                            : 'a proposed price',
                    },
                    data: { request_id: requestId, offer_id: offer.id },
                });
            }
        }
        catch (err) {
            this.logger.warn(`offer notify failed: ${err.message}`);
        }
        return serializeOffer(offer);
    }
    async listOffersForRequest(userId, requestId) {
        await this.expireStale();
        const request = await this.prisma.rideRequest.findUnique({
            where: { id: requestId },
            include: { offers: { include: { driver: { select: { id: true, fullName: true, phone: true } } } } },
        });
        if (!request) {
            throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
        }
        const offers = (request.offers ?? []);
        const isOwner = request.passengerId === userId;
        const participates = offers.some((o) => o.driverId === userId);
        if (!isOwner && !participates) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_VIEW_OFFERS_ON_YOUR_OWN_REQUESTS_OR',
                code: 'FORBIDDEN',
            });
        }
        return { data: offers.map(serializeOffer) };
    }
    async listDriverOffers(driverId, filters = {}) {
        await this.expireStale();
        const { page, limit, offset } = parsePagination(filters);
        const [rows, count] = await Promise.all([
            this.prisma.requestOffer.findMany({
                where: { driverId, ...(filters.status ? { status: filters.status } : {}) },
                include: {
                    request: {
                        select: {
                            id: true,
                            originCity: true,
                            destinationCity: true,
                            originTime: true,
                            status: true,
                            seatsNeeded: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.requestOffer.count({
                where: { driverId, ...(filters.status ? { status: filters.status } : {}) },
            }),
        ]);
        return {
            data: rows.map((o) => {
                const request = o.request;
                return {
                    ...serializeOffer(o),
                    request: request
                        ? {
                            id: request.id,
                            origin_city: request.originCity,
                            destination_city: request.destinationCity,
                            origin_time: request.originTime,
                            seats_needed: request.seatsNeeded,
                            status: request.status,
                        }
                        : null,
                };
            }),
            pagination: buildPagination(count, page, limit),
        };
    }
    async decideOffer(passengerId, offerId, action) {
        await this.expireStale();
        const offer = await this.prisma.requestOffer.findUnique({
            where: { id: offerId },
            include: {
                request: true,
                driver: { select: { id: true, fullName: true, phone: true, fcmToken: true, locale: true } },
            },
        });
        if (!offer)
            throw new NotFoundException({ message: 'OFFER_NOT_FOUND', code: 'OFFER_NOT_FOUND' });
        const request = offer.request;
        if (!request || request.passengerId !== passengerId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_DECIDE_ON_OFFERS_TO_YOUR_OWN_RIDE',
                code: 'FORBIDDEN',
            });
        }
        if (offer.status !== 'sent') {
            throw new ConflictException({
                message: 'OFFER_NO_LONGER_DECIDABLE',
                code: 'OFFER_NO_LONGER_DECIDABLE',
                details: { status: offer.status },
            });
        }
        if (action === 'accept') {
            const updated = await this.prisma.requestOffer.update({
                where: { id: offerId },
                data: { status: 'accepted' },
            });
            await this.prisma.rideRequest.update({ where: { id: request.id }, data: { status: 'accepted' } });
            await this.prisma.requestOffer.updateMany({
                where: { requestId: request.id, id: { not: offerId }, status: 'sent' },
                data: { status: 'declined' },
            });
            try {
                const driver = offer.driver;
                if (driver) {
                    await this.notifications.sendToUser(driver, 'OFFER_ACCEPTED', {
                        data: { request_id: request.id, offer_id: offerId },
                    });
                }
            }
            catch (err) {
                this.logger.warn(`offer accept notify failed: ${err.message}`);
            }
            return serializeOffer(updated);
        }
        const updated = await this.prisma.requestOffer.update({
            where: { id: offerId },
            data: { status: 'declined' },
        });
        const remaining = await this.prisma.requestOffer.count({
            where: { requestId: request.id, status: 'sent' },
        });
        if (remaining === 0) {
            const fresh = await this.prisma.rideRequest.findUnique({ where: { id: request.id } });
            if (fresh && fresh.status === 'offered') {
                await this.prisma.rideRequest.update({ where: { id: request.id }, data: { status: 'open' } });
            }
        }
        try {
            const driver = offer.driver;
            if (driver) {
                await this.notifications.sendToUser(driver, 'OFFER_DECLINED', {
                    data: { request_id: request.id, offer_id: offerId },
                });
            }
        }
        catch (err) {
            this.logger.warn(`offer decline notify failed: ${err.message}`);
        }
        return serializeOffer(updated);
    }
    async agreeOfferPrice(passengerId, offerId, agreedFare) {
        await this.expireStale();
        const offer = await this.prisma.requestOffer.findUnique({
            where: { id: offerId },
            include: {
                request: true,
                driver: { select: { id: true, fullName: true, phone: true, fcmToken: true, locale: true } },
            },
        });
        if (!offer)
            throw new NotFoundException({ message: 'OFFER_NOT_FOUND', code: 'OFFER_NOT_FOUND' });
        const request = offer.request;
        if (!request || request.passengerId !== passengerId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_AGREE_PRICES_ON_OFFERS_TO_YOUR_OWN',
                code: 'FORBIDDEN',
            });
        }
        if (offer.status !== 'accepted') {
            throw new ConflictException({
                message: 'ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE',
                code: 'ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE',
            });
        }
        if (['cancelled', 'expired'].includes(request.status)) {
            throw new ConflictException({
                message: 'THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE',
                code: 'THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE',
            });
        }
        const updated = await this.prisma.requestOffer.update({
            where: { id: offerId },
            data: { agreedFare: Number(agreedFare) },
        });
        try {
            const driver = offer.driver;
            if (driver) {
                await this.notifications.sendToUser(driver, 'OFFER_PRICE_AGREED', {
                    vars: { agreed_fare: String(agreedFare) },
                    data: { request_id: request.id, offer_id: offerId },
                });
            }
        }
        catch (err) {
            this.logger.warn(`price agree notify failed: ${err.message}`);
        }
        return serializeOffer(updated);
    }
    async attachOfferToTrip(driverId, tripId, offerId, payload = {}) {
        const offer = await this.prisma.requestOffer.findUnique({
            where: { id: offerId },
            include: { request: true },
        });
        if (!offer)
            throw new NotFoundException({ message: 'OFFER_NOT_FOUND', code: 'OFFER_NOT_FOUND' });
        if (offer.driverId !== driverId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_ATTACH_YOUR_OWN_OFFERS',
                code: 'FORBIDDEN',
            });
        }
        if (offer.bookingId) {
            throw new ConflictException({
                message: 'OFFER_ALREADY_ATTACHED_TO_A_BOOKING',
                code: 'OFFER_ALREADY_ATTACHED_TO_A_BOOKING',
            });
        }
        if (offer.status !== 'accepted') {
            throw new ConflictException({
                message: 'ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP',
                code: 'ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP',
            });
        }
        const request = offer.request;
        if (!request || request.status !== 'accepted') {
            throw new ConflictException({
                message: 'THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE',
                code: 'THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE',
            });
        }
        if (offer.agreedFare === null || offer.agreedFare === undefined) {
            throw new ConflictException({
                message: 'AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO',
                code: 'AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO',
            });
        }
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
        if (trip.driverId !== driverId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_ATTACH_OFFERS_TO_YOUR_OWN_TRIPS',
                code: 'FORBIDDEN',
            });
        }
        if (!['published', 'full'].includes(trip.status)) {
            throw new ConflictException({
                message: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED',
                code: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED',
            });
        }
        const seatsNeeded = request.seatsNeeded || 1;
        const referenceCode = await this.uniqueBookingCode();
        const booking = await this.prisma.$transaction(async (tx) => {
            const freshTrip = await tx.trip.findUnique({ where: { id: tripId } });
            if (!freshTrip)
                throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
            const remaining = Number(freshTrip.availableSeats) - seatsNeeded;
            if (remaining < 0) {
                throw new ConflictException({
                    message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
                    code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
                });
            }
            const created = await tx.booking.create({
                data: {
                    tripId,
                    passengerId: request.passengerId,
                    seatNumber: null,
                    seatsBooked: seatsNeeded,
                    agreedFare: Number(offer.agreedFare),
                    currency: request.currency ?? 'JOD',
                    dropoffPlace: payload.dropoff_place ?? null,
                    dropoffDeadline: parseOptionalTimezoneAware(payload.dropoff_deadline),
                    status: 'confirmed',
                    paymentStatus: 'pending',
                    referenceCode,
                    cancelledBy: null,
                },
            });
            await tx.trip.update({
                where: { id: tripId },
                data: {
                    availableSeats: remaining,
                    ...(remaining === 0 && freshTrip.status === 'published' ? { status: 'full' } : {}),
                },
            });
            await tx.requestOffer.update({ where: { id: offerId }, data: { bookingId: created.id } });
            return created;
        });
        try {
            await this.redis.deleteKey(`passenger_home:${request.passengerId}`, `driver_home:${driverId}`);
        }
        catch {
        }
        try {
            await this.home.invalidateHomeForTrip(tripId, driverId);
        }
        catch {
        }
        try {
            this.realtime.emitToUser(request.passengerId, 'home:invalidate', { trip_id: tripId });
            this.realtime.emitToUser(driverId, 'home:invalidate', { trip_id: tripId });
        }
        catch {
        }
        try {
            const passenger = await this.prisma.user.findUnique({ where: { id: request.passengerId } });
            if (passenger) {
                await this.notifications.sendToUser(passenger, 'BOOKING_CREATED_FROM_OFFER', {
                    vars: { reference_code: booking.referenceCode },
                    data: { trip_id: tripId, booking_id: booking.id },
                });
            }
        }
        catch (err) {
            this.logger.warn(`attach notify failed: ${err.message}`);
        }
        const refetched = await this.prisma.requestOffer.findUnique({ where: { id: offerId } });
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
            offer: serializeOffer(refetched),
        };
    }
    async uniqueBookingCode() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateReferenceCode('MSR');
            const existing = await this.prisma.booking.findFirst({ where: { referenceCode: code } });
            if (!existing)
                return code;
        }
        throw new UnprocessableEntityException({
            message: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE',
            code: 'INTERNAL_ERROR',
        });
    }
    async getMatches(user, requestId) {
        await this.expireStale();
        const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
        }
        if (request.passengerId !== user.id) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS',
                code: 'YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS',
            });
        }
        const seatsNeeded = Math.max(1, request.seatsNeeded || 1);
        const requestedMs = request.originTime ? new Date(request.originTime).getTime() : Date.now();
        const windowStart = new Date(requestedMs - MATCH_WINDOW_BEFORE_MS);
        const windowEnd = new Date(requestedMs + MATCH_WINDOW_AFTER_MS);
        const trips = await this.prisma.trip.findMany({
            where: {
                status: { in: ['published', 'full'] },
                availableSeats: { gte: seatsNeeded },
                departureTime: { gte: windowStart, lte: windowEnd },
            },
            include: {
                driver: { select: { id: true, fullName: true, avgRating: true } },
            },
            orderBy: { departureTime: 'asc' },
        });
        const scored = trips.map((t) => ({
            trip: t,
            score: matchScore({
                originCity: t.originCity,
                destinationCity: t.destinationCity,
                departureTime: t.departureTime,
                availableSeats: t.availableSeats,
                genderPreference: t.genderPreference,
            }, {
                originCity: request.originCity,
                destinationCity: request.destinationCity,
                originTime: request.originTime,
                attributesPreferred: request.attributesPreferred,
            }),
        }));
        scored.sort((a, b) => b.score - a.score);
        return {
            ride_request_id: request.id,
            matches: scored.slice(0, MATCH_LIMIT).map((s, idx) => {
                const t = s.trip;
                const driver = t.driver;
                return {
                    trip_id: t.id,
                    score_rank: idx + 1,
                    origin: {
                        city: t.originCity,
                        lat: t.originLat != null ? Number(t.originLat) : null,
                        lng: t.originLng != null ? Number(t.originLng) : null,
                    },
                    destination: { city: t.destinationCity },
                    departure_time: t.departureTime,
                    available_seats: Number(t.availableSeats),
                    fare_per_seat: Number(t.farePerSeat),
                    currency: t.currency ?? 'JOD',
                    gender_preference: t.genderPreference ?? 'all',
                    driver: driver
                        ? {
                            id: driver.id,
                            full_name: driver.fullName,
                            rating: Number(driver.avgRating) || 0,
                        }
                        : null,
                };
            }),
        };
    }
};
RideRequestsService = RideRequestsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService,
        HomeService,
        RedisService,
        RealtimeGateway])
], RideRequestsService);
export { RideRequestsService };
//# sourceMappingURL=ride-requests.service.js.map