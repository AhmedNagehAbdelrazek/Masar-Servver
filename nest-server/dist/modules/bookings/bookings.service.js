var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BookingsService_1;
import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException, UnprocessableEntityException, } from '@nestjs/common';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { generateReferenceCode as generateRefCode } from '../../common/utils/reference-code.js';
import { parseOptionalTimezoneAware } from '../../common/utils/time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { withSerializableRetry } from '../../prisma/transaction.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RedisService } from '../../redis/redis.service.js';
import { getMapsConfig } from '../maps/maps.config.js';
import { PickupService } from '../maps/pickup.service.js';
import { RouteService } from '../maps/route.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { TripExpiryService } from '../trips/trip-expiry.service.js';
function validationError(code, message) {
    return new UnprocessableEntityException({ message, code });
}
function toNumberOrNull(value) {
    if (value === null || value === undefined)
        return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function serializeRoutePoints(stops) {
    return [...stops]
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .map((s) => ({
        stop_order: s.stopOrder,
        stop_name: s.stopName,
        city: s.city,
        address: s.address,
        lat: toNumberOrNull(s.lat) ?? toNumberOrNull(s.stopLat),
        lng: toNumberOrNull(s.lng) ?? toNumberOrNull(s.stopLng),
        stop_type: s.stopType,
        estimated_arrival: s.estimatedArrival,
    }));
}
function getMeetingPoint(trip, stops) {
    const pickup = stops.find((s) => s.stopType === 'pickup') ?? stops.find((s) => s.stopType === 'both');
    if (pickup) {
        return {
            stop_name: pickup.stopName,
            city: pickup.city,
            address: pickup.address,
            lat: toNumberOrNull(pickup.lat) ?? toNumberOrNull(pickup.stopLat),
            lng: toNumberOrNull(pickup.lng) ?? toNumberOrNull(pickup.stopLng),
            estimated_arrival: pickup.estimatedArrival,
        };
    }
    return {
        stop_name: null,
        city: trip.originCity,
        address: trip.originArea,
        lat: toNumberOrNull(trip.originLat),
        lng: toNumberOrNull(trip.originLng),
        estimated_arrival: null,
    };
}
function tripLocationData(trip, stops) {
    return {
        origin: {
            city: trip.originCity,
            area: trip.originArea,
            lat: toNumberOrNull(trip.originLat),
            lng: toNumberOrNull(trip.originLng),
        },
        destination: {
            city: trip.destinationCity,
            area: trip.destinationArea,
            lat: toNumberOrNull(trip.destinationLat),
            lng: toNumberOrNull(trip.destinationLng),
        },
        departure_time: trip.departureTime,
        arrival_time: trip.arrivalTime,
        route_points: serializeRoutePoints(stops),
        meeting_point: getMeetingPoint({
            originCity: trip.originCity,
            originArea: trip.originArea,
            originLat: trip.originLat,
            originLng: trip.originLng,
        }, stops),
    };
}
let BookingsService = BookingsService_1 = class BookingsService {
    prisma;
    redis;
    pickup;
    routes;
    notifications;
    home;
    realtime;
    expiry;
    logger = new Logger(BookingsService_1.name);
    constructor(prisma, redis, pickup, routes, notifications, home, realtime, expiry) {
        this.prisma = prisma;
        this.redis = redis;
        this.pickup = pickup;
        this.routes = routes;
        this.notifications = notifications;
        this.home = home;
        this.realtime = realtime;
        this.expiry = expiry;
    }
    serializeListRow(booking) {
        const trip = booking.trip;
        const passenger = booking.passenger;
        return {
            id: booking.id,
            passenger_name: passenger?.fullName ?? null,
            passenger_phone: maskPhone(passenger?.phone ?? null),
            passenger_rating: passenger ? Number(passenger.avgRating) || 0 : null,
            seats_booked: booking.seatsBooked,
            agreed_fare: Number(booking.agreedFare),
            status: booking.status,
            reference_code: booking.referenceCode,
            booking_created_at: booking.createdAt,
            trip_id: booking.tripId,
            trip: trip
                ? {
                    origin: trip.originCity,
                    destination: trip.destinationCity,
                    price: Number(trip.farePerSeat),
                    status: trip.status,
                    departureTime: trip.departureTime,
                    ...tripLocationData(trip, (trip.stops ?? [])),
                }
                : null,
            pickup_place: booking.pickupPlace ?? null,
            pickup_lat: toNumberOrNull(booking.pickupLat),
            pickup_lng: toNumberOrNull(booking.pickupLng),
            pickup_order: booking.pickupOrder != null ? Number(booking.pickupOrder) : null,
            dropoff_place: booking.dropoffPlace,
            dropoff_lat: toNumberOrNull(booking.dropoffLat),
            dropoff_lng: toNumberOrNull(booking.dropoffLng),
            dropoff_order: booking.dropoffOrder != null ? Number(booking.dropoffOrder) : null,
        };
    }
    serializeDetail(booking) {
        const row = this.serializeListRow(booking);
        return {
            ...row,
            seat_number: booking.seatNumber,
            seat_numbers: booking.seatNumbers ??
                (booking.seatNumber != null ? [booking.seatNumber] : []),
            payment_status: booking.paymentStatus,
            cancellation_reason: booking.cancellationReason,
            cancelled_at: booking.cancelledAt,
        };
    }
    serializePassengerDetail(booking, trip, passenger) {
        trip = (trip ?? booking.trip);
        passenger = (passenger ?? booking.passenger);
        const ratingRow = (booking.ratings ?? [])[0];
        const tripVehicle = trip?.vehicle;
        return {
            id: booking.id,
            reference_code: booking.referenceCode,
            status: booking.status,
            payment_status: booking.paymentStatus,
            seats_booked: booking.seatsBooked,
            seat_number: booking.seatNumber,
            seat_numbers: booking.seatNumbers ??
                (booking.seatNumber != null ? [booking.seatNumber] : []),
            agreed_fare: Number(booking.agreedFare),
            currency: booking.currency,
            pickup_place: booking.pickupPlace ?? null,
            pickup_lat: toNumberOrNull(booking.pickupLat),
            pickup_lng: toNumberOrNull(booking.pickupLng),
            pickup_order: booking.pickupOrder != null ? Number(booking.pickupOrder) : null,
            dropoff_place: booking.dropoffPlace,
            dropoff_lat: toNumberOrNull(booking.dropoffLat),
            dropoff_lng: toNumberOrNull(booking.dropoffLng),
            dropoff_order: booking.dropoffOrder != null ? Number(booking.dropoffOrder) : null,
            dropoff_deadline: booking.dropoffDeadline,
            cancellation_reason: booking.cancellationReason,
            cancelled_at: booking.cancelledAt,
            completed_at: booking.completedAt,
            booking_created_at: booking.createdAt,
            trip: trip
                ? {
                    origin: trip.originCity,
                    destination: trip.destinationCity,
                    price: Number(trip.farePerSeat),
                    status: trip.status,
                    departure_time: trip.departureTime,
                    ...tripLocationData(trip, (trip.stops ?? [])),
                }
                : null,
            driver: trip?.driver != null
                ? {
                    id: trip.driver.id,
                    full_name: trip.driver.fullName,
                    phone_masked: maskPhone(trip.driver.phone),
                    rating: Number(trip.driver.avgRating) || 0,
                    image: trip.driver.avatarUrl,
                }
                : null,
            vehicle: tripVehicle
                ? {
                    vehicle_id: tripVehicle.id,
                    type: tripVehicle.vehicleType,
                    plate: tripVehicle.plateNumber,
                    seats: tripVehicle.seats,
                }
                : null,
            passenger: passenger ? { id: passenger.id, full_name: passenger.fullName } : null,
            passenger_rating: ratingRow ? Number(ratingRow.stars) : null,
        };
    }
    async listForDriver(driverId, filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const bookingWhere = {};
        if (filters.status)
            bookingWhere.status = filters.status;
        if (filters.date_from || filters.date_to) {
            const created = {};
            if (filters.date_from)
                created.gte = new Date(filters.date_from);
            if (filters.date_to) {
                const end = new Date(filters.date_to);
                end.setHours(23, 59, 59, 999);
                created.lte = end;
            }
            bookingWhere.createdAt = created;
        }
        const driverTrips = await this.prisma.trip.findMany({
            where: { driverId },
            select: { id: true },
        });
        const driverTripIds = driverTrips.map((t) => t.id);
        try {
            await this.expiry.refreshStaleTrips(driverTripIds);
        }
        catch {
        }
        const [rows, count] = await Promise.all([
            this.prisma.booking.findMany({
                where: { ...bookingWhere, tripId: { in: driverTripIds } },
                include: {
                    trip: {
                        select: {
                            id: true,
                            originCity: true,
                            originArea: true,
                            originLat: true,
                            originLng: true,
                            destinationCity: true,
                            destinationArea: true,
                            destinationLat: true,
                            destinationLng: true,
                            farePerSeat: true,
                            departureTime: true,
                            status: true,
                        },
                    },
                    passenger: { select: { id: true, fullName: true, phone: true, avgRating: true } },
                },
                orderBy: { trip: { departureTime: 'asc' } },
                skip: offset,
                take: limit,
            }),
            this.prisma.booking.count({
                where: { ...bookingWhere, tripId: { in: driverTripIds } },
            }),
        ]);
        const tripIds = [...new Set(rows.map((r) => r.tripId))];
        const stops = tripIds.length
            ? await this.prisma.tripStop.findMany({ where: { tripId: { in: tripIds } } })
            : [];
        const stopsByTrip = new Map();
        for (const s of stops) {
            const list = stopsByTrip.get(s.tripId) ?? [];
            list.push(s);
            stopsByTrip.set(s.tripId, list);
        }
        return {
            data: rows.map((r) => this.serializeListRow({
                ...r,
                trip: {
                    ...(r.trip ?? {}),
                    stops: stopsByTrip.get(r.tripId) ?? [],
                },
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getForDriver(driverId, bookingId) {
        const fetchBooking = () => this.prisma.booking
            .findUnique({
            where: { id: bookingId },
            include: {
                trip: {
                    select: {
                        id: true,
                        driverId: true,
                        originCity: true,
                        originArea: true,
                        originLat: true,
                        originLng: true,
                        destinationCity: true,
                        destinationArea: true,
                        destinationLat: true,
                        destinationLng: true,
                        farePerSeat: true,
                        departureTime: true,
                        status: true,
                    },
                },
                passenger: { select: { id: true, fullName: true, phone: true, avgRating: true } },
            },
        })
            .then(async (b) => {
            if (!b)
                return null;
            const stops = await this.prisma.tripStop.findMany({ where: { tripId: b.tripId } });
            return { ...b, trip: { ...b.trip, stops } };
        });
        let booking = await fetchBooking();
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        const trip = booking.trip;
        if (!trip || trip.driverId !== driverId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_VIEW_BOOKINGS_ON_YOUR_OWN_TRIPS',
                code: 'FORBIDDEN',
            });
        }
        try {
            const swept = await this.expiry.refreshStaleTrips([booking.tripId]);
            if (swept.touched > 0)
                booking = await fetchBooking();
        }
        catch {
        }
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        return { booking: this.serializeDetail(booking) };
    }
    async uniqueBookingCode() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateRefCode('MSR');
            const existing = await this.prisma.booking.findFirst({ where: { referenceCode: code } });
            if (!existing)
                return code;
        }
        throw new ServiceUnavailableException({
            message: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE',
            code: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE',
        });
    }
    extractNameLatLng(obj) {
        if (!obj || typeof obj !== 'object')
            return { name: null, lat: null, lng: null };
        const rawLat = obj.lat ?? obj.stop_lat ?? obj.latitude;
        const rawLng = obj.lng ?? obj.stop_lng ?? obj.longitude;
        return {
            name: (obj.name ?? obj.stop_name ?? obj.city) ?? null,
            lat: rawLat == null || rawLat === '' ? null : Number(rawLat),
            lng: rawLng == null || rawLng === '' ? null : Number(rawLng),
        };
    }
    async createBooking(passengerId, payload) {
        const user = await this.prisma.user.findUnique({ where: { id: passengerId } });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        if (user.status === 'suspended' || user.status === 'banned') {
            throw new ForbiddenException({
                message: 'ACCOUNT_IS_SUSPENDED_YOU_CANNOT_BOOK_TRIPS',
                code: 'FORBIDDEN',
            });
        }
        if (payload.seat_number !== undefined && payload.seat_number !== null) {
            throw validationError('SEAT_NUMBER_DEPRECATED_USE_SEAT_NUMBERS', 'SEAT_NUMBER_DEPRECATED_USE_SEAT_NUMBERS');
        }
        if (payload.seat_numbers === undefined || payload.seat_numbers === null) {
            throw validationError('SEAT_NUMBERS_IS_REQUIRED', 'SEAT_NUMBERS_IS_REQUIRED');
        }
        const list = Array.isArray(payload.seat_numbers) ? payload.seat_numbers : [payload.seat_numbers];
        const lockedSeats = [...new Set(list.map((n) => Number(n)))];
        if (lockedSeats.length === 0 ||
            lockedSeats.length !== list.length ||
            lockedSeats.some((n) => !Number.isInteger(n) || n < 1)) {
            throw validationError('SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS', 'SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS');
        }
        const requestedSeats = lockedSeats.length;
        if (payload.seats !== undefined && payload.seats !== null && Number(payload.seats) !== requestedSeats) {
            throw validationError('SEATS_COUNT_MUST_MATCH_LOCKED_SEAT_NUMBERS', 'SEATS_COUNT_MUST_MATCH_LOCKED_SEAT_NUMBERS');
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: payload.trip_id },
            include: { stops: true },
        });
        if (!trip)
            throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
        if (!['published', 'full'].includes(trip.status)) {
            throw new ConflictException({ message: 'TRIP_NOT_BOOKABLE', code: 'TRIP_NOT_BOOKABLE' });
        }
        if (payload.agreed_fare === undefined || Number(payload.agreed_fare) !== Number(trip.farePerSeat)) {
            throw validationError('AGREED_FARE_DOES_NOT_MATCH_THE_CURRENT_TRIP_FARE', 'AGREED_FARE_DOES_NOT_MATCH_THE_CURRENT_TRIP_FARE');
        }
        const rawDropoff = (payload.drop_off_point ??
            payload.dropoff_point ??
            payload.dropoff ??
            payload.dropOffPoint ??
            null);
        const rawPickup = (payload.pickup_point ??
            payload.pick_up_point ??
            payload.pickup ??
            null);
        const stops = trip.stops ?? [];
        const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
        let dropoffPlace = payload.dropoff_place ?? null;
        let dropoffLat = null;
        let dropoffLng = null;
        let dropoffOrder = null;
        if (typeof rawDropoff === 'string' && UUID_RE.test(rawDropoff)) {
            const stop = sortedStops.find((s) => s.id === rawDropoff);
            if (!stop) {
                throw new ConflictException({
                    message: 'DROP_OFF_POINT_NOT_ON_TRIP',
                    code: 'DROP_OFF_POINT_NOT_ON_TRIP',
                });
            }
            dropoffPlace = stop.stopName ?? stop.city;
            dropoffLat = toNumberOrNull(stop.lat) ?? toNumberOrNull(stop.stopLat);
            dropoffLng = toNumberOrNull(stop.lng) ?? toNumberOrNull(stop.stopLng);
            dropoffOrder = stop.stopOrder;
        }
        else if (rawDropoff && typeof rawDropoff === 'object') {
            const ex = this.extractNameLatLng(rawDropoff);
            dropoffPlace = ex.name ?? dropoffPlace;
            dropoffLat = ex.lat;
            dropoffLng = ex.lng;
        }
        let resolvedPickupPlace = null;
        let resolvedPickupLat = null;
        let resolvedPickupLng = null;
        let resolvedPickupOrder = null;
        if (typeof rawPickup === 'string' && UUID_RE.test(rawPickup)) {
            const stop = sortedStops.find((s) => s.id === rawPickup);
            if (!stop) {
                throw new ConflictException({
                    message: 'PICKUP_POINT_NOT_ON_TRIP',
                    code: 'PICKUP_POINT_NOT_ON_TRIP',
                });
            }
            resolvedPickupPlace = stop.stopName ?? stop.city;
            resolvedPickupLat = toNumberOrNull(stop.lat) ?? toNumberOrNull(stop.stopLat);
            resolvedPickupLng = toNumberOrNull(stop.lng) ?? toNumberOrNull(stop.stopLng);
            resolvedPickupOrder = stop.stopOrder;
        }
        else if (rawPickup && typeof rawPickup === 'object') {
            const ex = this.extractNameLatLng(rawPickup);
            resolvedPickupPlace = ex.name;
            resolvedPickupLat = ex.lat;
            resolvedPickupLng = ex.lng;
        }
        let pickupType = 'custom';
        let pickupStopId = null;
        let pickupLabel = null;
        let pickupCity = null;
        let pickupArea = null;
        let pickupLat = null;
        let pickupLng = null;
        let detourSeconds = null;
        if (rawPickup === null || rawPickup === undefined) {
            pickupType = 'custom';
            pickupLabel = trip.originCity;
            pickupCity = trip.originCity;
            pickupArea = trip.originArea;
            pickupLat = trip.originLat != null ? Number(trip.originLat) : null;
            pickupLng = trip.originLng != null ? Number(trip.originLng) : null;
            detourSeconds = 0;
        }
        else if (typeof rawPickup === 'string' && UUID_RE.test(rawPickup)) {
            const checked = await this.pickup.validatePickup(trip.id, {
                pickup_type: 'stop',
                pickup_stop_id: rawPickup,
            });
            const stop = sortedStops.find((s) => s.id === rawPickup);
            pickupType = 'stop';
            pickupStopId = rawPickup;
            pickupLabel = checked.point?.label ?? resolvedPickupPlace;
            pickupCity = stop?.city ?? null;
            pickupLat = checked.point ? checked.point.lat : resolvedPickupLat;
            pickupLng = checked.point ? checked.point.lng : resolvedPickupLng;
            detourSeconds = 0;
        }
        else {
            const type = payload.pickup_type === 'stop' ? 'stop' : 'custom';
            const checked = await this.pickup.validatePickup(trip.id, {
                pickup_type: payload.pickup_stop_id ? 'stop' : type,
                pickup_stop_id: payload.pickup_stop_id ?? null,
                lat: resolvedPickupLat,
                lng: resolvedPickupLng,
                pickup_label: resolvedPickupPlace,
            });
            if (!checked.accepted) {
                throw new UnprocessableEntityException({
                    message: checked.reason ?? 'PICKUP_REJECTED',
                    code: checked.reason ?? 'PICKUP_REJECTED',
                });
            }
            pickupType = type;
            pickupStopId = checked.point?.pickupStopId ?? null;
            pickupLabel = checked.point?.label ?? resolvedPickupPlace;
            pickupLat = checked.point ? checked.point.lat : resolvedPickupLat;
            pickupLng = checked.point ? checked.point.lng : resolvedPickupLng;
            detourSeconds = checked.detourSeconds;
        }
        if (requestedSeats > Number(trip.availableSeats)) {
            throw new ConflictException({
                message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
                code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
            });
        }
        for (const n of lockedSeats) {
            const raw = await this.redis.getKey(`seat_lock:${trip.id}:${n}`);
            if (!raw) {
                throw new NotFoundException({ message: 'SEAT_LOCK_EXPIRED_OR_NOT_HELD', code: 'SEAT_LOCK_EXPIRED' });
            }
            try {
                const info = JSON.parse(raw);
                if (info.passenger_id !== passengerId) {
                    throw new NotFoundException({ message: 'SEAT_LOCK_EXPIRED_OR_NOT_HELD', code: 'SEAT_LOCK_EXPIRED' });
                }
            }
            catch (err) {
                if (err?.status === 404)
                    throw err;
                throw new NotFoundException({ message: 'SEAT_LOCK_EXPIRED_OR_NOT_HELD', code: 'SEAT_LOCK_EXPIRED' });
            }
        }
        const seatRows = await this.prisma.tripSeat.findMany({
            where: { tripId: trip.id, seatNumber: { in: lockedSeats } },
        });
        if (seatRows.length !== lockedSeats.length) {
            throw new NotFoundException({ message: 'SEAT_NOT_FOUND_ON_THIS_TRIP', code: 'SEAT_NOT_FOUND_ON_THIS_TRIP' });
        }
        if (seatRows.some((r) => r.seatType !== 'available')) {
            throw new ConflictException({ message: 'SEAT_ALREADY_BOOKED', code: 'SEAT_ALREADY_BOOKED' });
        }
        const referenceCode = await this.uniqueBookingCode();
        const booking = await withSerializableRetry(this.prisma, async (tx) => {
            const freshTrip = await tx.trip.findUnique({ where: { id: trip.id } });
            if (!freshTrip || !['published', 'full'].includes(freshTrip.status)) {
                throw new ConflictException({ message: 'TRIP_NOT_BOOKABLE', code: 'TRIP_NOT_BOOKABLE' });
            }
            const remaining = Number(freshTrip.availableSeats) - requestedSeats;
            if (remaining < 0) {
                throw new ConflictException({
                    message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
                    code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
                });
            }
            const claimed = await tx.tripSeat.updateMany({
                where: { tripId: trip.id, seatNumber: { in: lockedSeats }, seatType: 'available' },
                data: { seatType: 'unavailable' },
            });
            if (claimed.count !== lockedSeats.length) {
                throw new ConflictException({ message: 'SEAT_ALREADY_BOOKED', code: 'SEAT_ALREADY_BOOKED' });
            }
            const created = await tx.booking.create({
                data: {
                    tripId: trip.id,
                    passengerId,
                    seatNumber: lockedSeats[0],
                    seatNumbers: lockedSeats,
                    seatsBooked: requestedSeats,
                    agreedFare: Number(payload.agreed_fare),
                    currency: 'JOD',
                    pickupPlace: resolvedPickupPlace ?? pickupLabel,
                    pickupLat,
                    pickupLng,
                    pickupOrder: resolvedPickupOrder,
                    pickupType,
                    pickupStopId,
                    pickupLabel: pickupLabel,
                    pickupCity,
                    pickupArea,
                    detourSeconds,
                    pickupStatus: 'pending',
                    dropoffPlace,
                    dropoffLat,
                    dropoffLng,
                    dropoffOrder,
                    dropoffDeadline: payload.dropoff_deadline
                        ? parseOptionalTimezoneAware(payload.dropoff_deadline)
                        : null,
                    status: 'confirmed',
                    paymentStatus: 'pending',
                    referenceCode,
                    cancelledBy: null,
                },
            });
            await tx.trip.update({
                where: { id: trip.id },
                data: {
                    availableSeats: remaining,
                    ...(remaining === 0 && freshTrip.status === 'published' ? { status: 'full' } : {}),
                },
            });
            return created;
        });
        for (const n of lockedSeats) {
            try {
                await this.redis.deleteKey(`seat_lock:${trip.id}:${n}`);
            }
            catch {
            }
        }
        try {
            await this.redis.deleteKey(`passenger_home:${passengerId}`, `driver_home:${trip.driverId}`);
        }
        catch {
        }
        try {
            this.realtime.emitToUser(passengerId, 'home:invalidate', { trip_id: trip.id });
            this.realtime.emitToUser(trip.driverId, 'home:invalidate', { trip_id: trip.id });
        }
        catch {
        }
        try {
            await Promise.allSettled([
                this.notifications.sendToUser(user, 'BOOKING_CONFIRMED_PASSENGER', {
                    channels: ['in_app', 'push'],
                    vars: {
                        reference_code: booking.referenceCode,
                        origin: trip.originCity,
                        destination: trip.destinationCity,
                    },
                    data: { trip_id: trip.id, booking_id: booking.id },
                }),
                (async () => {
                    const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
                    if (driver) {
                        await this.notifications.sendToUser(driver, 'BOOKING_CONFIRMED_DRIVER', {
                            channels: ['in_app', 'push'],
                            vars: {
                                passenger: user.fullName,
                                seat_number: lockedSeats[0],
                                seat_numbers: lockedSeats,
                                seats: requestedSeats,
                                route: `${trip.originCity} - ${trip.destinationCity}`,
                            },
                            data: { trip_id: trip.id, booking_id: booking.id },
                        });
                    }
                })(),
            ]);
        }
        catch {
        }
        try {
            const recomputed = await this.routes.computeTripRoute(trip.id);
            if (recomputed.ok) {
                try {
                    this.realtime.emitToRoom(`trip:${trip.id}`, 'tracking:route_updated', {
                        route_version: recomputed.routeVersion,
                    });
                }
                catch {
                }
            }
        }
        catch {
        }
        try {
            const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
            if (driver) {
                await this.notifications.sendToUser(driver, 'PICKUP_ADDED', {
                    vars: {
                        passenger: user.fullName,
                        route: `${trip.originCity} - ${trip.destinationCity}`,
                    },
                    data: { trip_id: trip.id, booking_id: booking.id },
                });
            }
        }
        catch {
        }
        const fullTrip = await this.prisma.trip.findUnique({
            where: { id: trip.id },
            include: {
                driver: { select: { id: true, fullName: true, phone: true, avgRating: true, avatarUrl: true } },
                stops: true,
                vehicle: { select: { id: true, vehicleType: true, plateNumber: true, seats: true } },
            },
        });
        return this.serializePassengerDetail(booking, fullTrip, { id: user.id, fullName: user.fullName });
    }
    async listForPassenger(passengerId, filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const liveTripIds = (await this.prisma.booking.findMany({
            where: { passengerId, status: { in: ['pending', 'confirmed'] } },
            select: { tripId: true },
        })).map((b) => b.tripId);
        try {
            await this.expiry.refreshStaleTrips(liveTripIds);
        }
        catch {
        }
        await this.syncBookingsWithTripStatus(passengerId);
        const where = { passengerId };
        if (filters.status)
            where.status = filters.status;
        if (filters.trip_id)
            where.tripId = filters.trip_id;
        const [rows, count] = await Promise.all([
            this.prisma.booking.findMany({
                where: where,
                include: {
                    trip: {
                        select: {
                            id: true,
                            driverId: true,
                            originCity: true,
                            originArea: true,
                            originLat: true,
                            originLng: true,
                            destinationCity: true,
                            destinationArea: true,
                            destinationLat: true,
                            destinationLng: true,
                            farePerSeat: true,
                            status: true,
                            departureTime: true,
                        },
                    },
                },
                orderBy: { trip: { departureTime: 'asc' } },
                skip: offset,
                take: limit,
            }),
            this.prisma.booking.count({ where: where }),
        ]);
        const tripIds = [...new Set(rows.map((r) => r.tripId))];
        const [drivers, stopsMap, vehicles, ratings] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    id: {
                        in: [...new Set(rows.map((r) => r.trip.driverId))],
                    },
                },
                select: { id: true, fullName: true, phone: true, avgRating: true, avatarUrl: true },
            }),
            this.prisma.tripStop.findMany({ where: { tripId: { in: tripIds } } }),
            this.prisma.vehicle.findMany({
                where: { driverId: { in: [...new Set(rows.map((r) => r.trip.driverId))] } },
                select: { id: true, driverId: true, vehicleType: true, plateNumber: true, seats: true },
            }),
            this.prisma.rating.findMany({
                where: { raterId: passengerId, bookingId: { in: rows.map((r) => r.id) } },
                select: { bookingId: true, stars: true },
            }),
        ]);
        const driverMap = new Map(drivers.map((d) => [d.id, d]));
        const stopsByTrip = new Map();
        for (const s of stopsMap) {
            const list = stopsByTrip.get(s.tripId) ?? [];
            list.push(s);
            stopsByTrip.set(s.tripId, list);
        }
        const vehicleByDriver = new Map(vehicles.map((v) => [v.driverId, v]));
        const ratingByBooking = new Map(ratings.map((r) => [r.bookingId, r.stars]));
        return {
            data: rows.map((b) => {
                const trip = b.trip;
                const driver = driverMap.get(trip.driverId);
                return this.serializePassengerDetail({
                    ...b,
                    ratings: ratingByBooking.has(b.id) ? [{ stars: ratingByBooking.get(b.id) }] : [],
                }, {
                    ...trip,
                    driver: driver ?? null,
                    stops: stopsByTrip.get(b.tripId) ?? [],
                    vehicle: vehicleByDriver.get(trip.driverId) ?? null,
                }, null);
            }),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getForPassenger(passengerId, bookingId) {
        const fetchBooking = async () => {
            const b = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    trip: {
                        select: {
                            id: true,
                            driverId: true,
                            originCity: true,
                            originArea: true,
                            originLat: true,
                            originLng: true,
                            destinationCity: true,
                            destinationArea: true,
                            destinationLat: true,
                            destinationLng: true,
                            farePerSeat: true,
                            departureTime: true,
                            status: true,
                        },
                    },
                    passenger: { select: { id: true, fullName: true } },
                },
            });
            if (!b)
                return null;
            const [driver, stops, vehicle, ratings] = await Promise.all([
                this.prisma.user.findUnique({
                    where: { id: b.trip.driverId },
                    select: { id: true, fullName: true, phone: true, avgRating: true, avatarUrl: true },
                }),
                this.prisma.tripStop.findMany({ where: { tripId: b.tripId } }),
                this.prisma.vehicle.findFirst({
                    where: { driverId: b.trip.driverId },
                    select: { id: true, vehicleType: true, plateNumber: true, seats: true },
                }),
                this.prisma.rating.findMany({
                    where: { bookingId: b.id, raterId: passengerId },
                    select: { stars: true },
                }),
            ]);
            return {
                ...b,
                trip: { ...b.trip, driver, stops, vehicle },
                ratings,
            };
        };
        let booking = await fetchBooking();
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        if (booking.passengerId !== passengerId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_VIEW_YOUR_OWN_BOOKINGS',
                code: 'FORBIDDEN',
            });
        }
        try {
            const swept = await this.expiry.refreshStaleTrips([booking.tripId]);
            if (swept.touched > 0)
                booking = await fetchBooking();
        }
        catch {
        }
        await this.syncBookingsWithTripStatus(passengerId);
        booking = await fetchBooking();
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        return {
            booking: this.serializePassengerDetail(booking, booking.trip, booking.passenger),
        };
    }
    async syncBookingsWithTripStatus(passengerId) {
        const active = await this.prisma.booking.findMany({
            where: { passengerId, status: { in: ['pending', 'confirmed'] } },
            include: { trip: { select: { id: true, driverId: true, status: true } } },
        });
        for (const booking of active) {
            const trip = booking.trip;
            try {
                if (trip?.status === 'cancelled') {
                    await this.prisma.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: 'cancelled',
                            cancellationReason: booking.cancellationReason ?? 'Trip cancelled by driver',
                            cancelledBy: booking.cancelledBy ?? trip.driverId,
                            cancelledAt: booking.cancelledAt ?? new Date(),
                        },
                    });
                }
                else if (trip?.status === 'completed') {
                    await this.prisma.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: 'completed',
                            paymentStatus: booking.paymentStatus === 'pending' ? 'paid_cash' : booking.paymentStatus,
                            completedAt: booking.completedAt ?? new Date(),
                        },
                    });
                }
            }
            catch (err) {
                this.logger.warn(`booking status sync failed: ${err.message}`);
            }
        }
    }
    async cancelBooking(passengerId, bookingId) {
        const user = await this.prisma.user.findUnique({ where: { id: passengerId } });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                trip: {
                    select: {
                        id: true,
                        driverId: true,
                        originCity: true,
                        destinationCity: true,
                        departureTime: true,
                        availableSeats: true,
                        totalSeats: true,
                        status: true,
                    },
                },
            },
        });
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        if (booking.passengerId !== passengerId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_CANCEL_YOUR_OWN_BOOKINGS',
                code: 'FORBIDDEN',
            });
        }
        if (['cancelled', 'completed'].includes(booking.status)) {
            throw new ConflictException({
                message: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
                code: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
            });
        }
        const trip = booking.trip;
        const hoursUntilDeparture = (new Date(trip.departureTime).getTime() - Date.now()) / (3600 * 1000);
        if (hoursUntilDeparture < 1) {
            throw new ConflictException({
                message: 'CANCELLATIONS_ARE_ALLOWED_UP_TO_ONE_HOUR_BEFORE_DEPARTURE',
                code: 'CANCELLATION_WINDOW_CLOSED',
            });
        }
        const updated = await withSerializableRetry(this.prisma, async (tx) => {
            const claimed = await tx.booking.updateMany({
                where: { id: bookingId, status: { notIn: ['cancelled', 'completed'] } },
                data: {
                    status: 'cancelled',
                    cancellationReason: 'cancelled_by_passenger',
                    cancelledAt: new Date(),
                    cancelledBy: passengerId,
                },
            });
            if (claimed.count === 0) {
                throw new ConflictException({
                    message: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
                    code: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
                });
            }
            const cancelled = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
            const freshTrip = await tx.trip.findUnique({ where: { id: booking.tripId } });
            if (freshTrip) {
                const availableSeats = Number(freshTrip.availableSeats) + Number(booking.seatsBooked);
                await tx.trip.update({
                    where: { id: booking.tripId },
                    data: {
                        availableSeats,
                        ...(freshTrip.status === 'full' && availableSeats > 0 && availableSeats <= Number(freshTrip.totalSeats)
                            ? { status: 'published' }
                            : {}),
                    },
                });
            }
            const seat = await tx.tripSeat.findFirst({
                where: { tripId: booking.tripId, seatNumber: booking.seatNumber ?? -1 },
            });
            if (seat) {
                await tx.tripSeat.update({ where: { id: seat.id }, data: { seatType: 'available' } });
            }
            const bookedSeats = booking.seatNumbers && booking.seatNumbers.length > 0
                ? booking.seatNumbers
                : booking.seatNumber != null
                    ? [booking.seatNumber]
                    : [];
            if (bookedSeats.length > 1) {
                const rows = await tx.tripSeat.findMany({
                    where: { tripId: booking.tripId, seatNumber: { in: bookedSeats } },
                });
                for (const row of rows) {
                    if (row.seatType !== 'available') {
                        await tx.tripSeat.update({ where: { id: row.id }, data: { seatType: 'available' } });
                    }
                }
            }
            return cancelled;
        });
        const seatsToRelease = booking.seatNumbers && booking.seatNumbers.length > 0
            ? booking.seatNumbers
            : booking.seatNumber != null
                ? [booking.seatNumber]
                : [];
        for (const n of seatsToRelease) {
            try {
                await this.redis.deleteKey(`seat_lock:${booking.tripId}:${n}`);
            }
            catch {
            }
        }
        try {
            const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
            if (driver) {
                await this.notifications.sendToUser(driver, 'BOOKING_CANCELLED_DRIVER', {
                    vars: {
                        passenger: user.fullName,
                        seat_number: booking.seatNumber,
                        seat_numbers: booking.seatNumbers ??
                            (booking.seatNumber != null ? [booking.seatNumber] : []),
                        route: `${trip.originCity} - ${trip.destinationCity}`,
                    },
                    data: { trip_id: booking.tripId, booking_id: booking.id },
                });
            }
        }
        catch {
        }
        if (['in_progress', 'ongoing'].includes(trip.status)) {
            try {
                const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
                if (driver) {
                    await this.notifications.sendToUser(driver, 'PICKUP_CANCELLED', {
                        vars: { route: `${trip.originCity} - ${trip.destinationCity}` },
                        data: { trip_id: booking.tripId, booking_id: booking.id },
                    });
                }
            }
            catch {
            }
        }
        else {
            try {
                const recomputed = await this.routes.computeTripRoute(booking.tripId);
                if (recomputed.ok) {
                    try {
                        this.realtime.emitToRoom(`trip:${booking.tripId}`, 'tracking:route_updated', {
                            route_version: recomputed.routeVersion,
                        });
                    }
                    catch {
                    }
                }
            }
            catch {
            }
            try {
                const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
                if (driver) {
                    await this.notifications.sendToUser(driver, 'PICKUP_CANCELLED', {
                        vars: { route: `${trip.originCity} - ${trip.destinationCity}` },
                        data: { trip_id: booking.tripId, booking_id: booking.id },
                    });
                }
            }
            catch {
            }
        }
        try {
            await this.home.invalidateHomeForTrip(booking.tripId, trip.driverId);
        }
        catch {
        }
        return {
            booking: { id: updated.id, status: updated.status, cancelled_at: updated.cancelledAt },
        };
    }
    async editPickup(passengerId, bookingId, input) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { trip: true },
        });
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        if (booking.passengerId !== passengerId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_EDIT_YOUR_OWN_BOOKINGS',
                code: 'FORBIDDEN',
            });
        }
        if (booking.status !== 'confirmed') {
            throw new ConflictException({ message: 'BOOKING_IS_NOT_CONFIRMED', code: 'BOOKING_IS_NOT_CONFIRMED' });
        }
        const trip = booking.trip;
        this.pickup.assertBookable({ status: trip.status });
        const cutoffMs = getMapsConfig().pickupEditCutoffMinutes * 60 * 1000;
        if (new Date(trip.departureTime).getTime() - Date.now() < cutoffMs) {
            throw new UnprocessableEntityException({
                message: 'PICKUP_EDIT_CUTOFF_PASSED',
                code: 'PICKUP_EDIT_CUTOFF_PASSED',
            });
        }
        const type = input?.pickup_type ?? (input?.pickup_stop_id ? 'stop' : 'custom');
        const checked = await this.pickup.validatePickup(booking.tripId, {
            pickup_type: type,
            pickup_stop_id: input?.pickup_stop_id ?? null,
            lat: input?.lat != null ? Number(input.lat) : null,
            lng: input?.lng != null ? Number(input.lng) : null,
            pickup_label: input?.pickup_label ?? input?.label ?? null,
        });
        if (!checked.accepted) {
            throw new UnprocessableEntityException({
                message: checked.reason ?? 'PICKUP_REJECTED',
                code: checked.reason ?? 'PICKUP_REJECTED',
            });
        }
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                pickupType: type,
                pickupStopId: checked.point?.pickupStopId ?? null,
                pickupLabel: checked.point?.label ?? null,
                pickupLat: checked.point ? checked.point.lat : null,
                pickupLng: checked.point ? checked.point.lng : null,
                detourSeconds: checked.detourSeconds,
                pickupStatus: 'pending',
                arrivedAt: null,
                pickedUpAt: null,
            },
        });
        try {
            const out = await this.routes.computeTripRoute(booking.tripId);
            if (out.ok) {
                try {
                    this.realtime.emitToRoom(`trip:${booking.tripId}`, 'tracking:route_updated', {
                        route_version: out.routeVersion,
                    });
                }
                catch {
                }
            }
        }
        catch {
        }
        try {
            const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
            const passenger = await this.prisma.user.findUnique({
                where: { id: passengerId },
                select: { fullName: true },
            });
            if (driver) {
                await this.notifications.sendToUser(driver, 'PICKUP_CHANGED', {
                    channels: ['in_app', 'push'],
                    vars: {
                        passenger: passenger?.fullName ?? 'A passenger',
                        route: `${trip.originCity} - ${trip.destinationCity}`,
                    },
                    data: { trip_id: booking.tripId, booking_id: booking.id },
                });
            }
        }
        catch {
        }
        return { booking_id: booking.id, pickup_type: type, detour_seconds: checked.detourSeconds };
    }
    async getDriverReveal(requesterId, requesterRole, bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                trip: {
                    select: {
                        id: true,
                        driverId: true,
                        departureTime: true,
                        driver: {
                            select: { id: true, fullName: true, phone: true, age: true, gender: true, avatarUrl: true, avgRating: true },
                        },
                        vehicle: true,
                    },
                },
            },
        });
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        const trip = booking.trip;
        const isOwner = booking.passengerId === requesterId;
        const isDriver = trip !== null && trip.driverId === requesterId;
        const isAdmin = requesterRole === 'admin';
        if (!isOwner && !isDriver && !isAdmin) {
            throw new ForbiddenException({
                message: 'YOU_DO_NOT_HAVE_ACCESS_TO_THIS_BOOKING_DRIVER_PROFILE',
                code: 'YOU_DO_NOT_HAVE_ACCESS_TO_THIS_BOOKING_DRIVER_PROFILE',
            });
        }
        if (booking.status !== 'confirmed') {
            throw new ConflictException({
                message: 'DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION',
                code: 'DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION',
            });
        }
        const driver = trip?.driver;
        if (!driver)
            throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
        const profile = await this.prisma.driverProfile.findFirst({
            where: { driverId: driver.id },
        });
        const vehicle = trip?.vehicle ?? null;
        const nameParts = String(driver.fullName ?? '').split(/\s+/).filter(Boolean);
        return {
            driver: {
                id: driver.id,
                first_name: nameParts[0] ?? '',
                last_name: nameParts.slice(1).join(' ') || null,
                phone: driver.phone,
                age: driver.age != null ? Number(driver.age) : null,
                gender: driver.gender,
                is_professional_driver: Boolean(profile?.professionalDriver),
                driver_stats: {
                    punctuality_rate: profile?.punctualityRate != null ? Number(profile.punctualityRate) : null,
                    completed_trips: profile ? Number(profile.totalTrips) || 0 : 0,
                    rating: Number(driver.avgRating) || 0,
                },
                vehicle_details: vehicle
                    ? {
                        manufacturer: vehicle.manufacturer,
                        model: vehicle.model,
                        year: vehicle.modelYear,
                        color: vehicle.color,
                        plate_number: vehicle.plateNumber,
                        seat_capacity: vehicle.seats,
                    }
                    : null,
            },
        };
    }
};
BookingsService = BookingsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        RedisService,
        PickupService,
        RouteService,
        NotificationsService,
        HomeService,
        RealtimeGateway,
        TripExpiryService])
], BookingsService);
export { BookingsService };
//# sourceMappingURL=bookings.service.js.map