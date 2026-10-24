"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTrip = exports.startTrip = exports.getAvailableTrips = exports.getDriverTrips = exports.getTripSeats = exports.getTripOptions = exports.getTripById = exports.createTrip = void 0;
exports.updateTrip = updateTrip;
exports.replaceTripStops = replaceTripStops;
exports.getTripRoute = getTripRoute;
exports.setPickupStatus = setPickupStatus;
exports.getBookingRoute = getBookingRoute;
exports.getTripActual = getTripActual;
exports.cancelTrip = cancelTrip;
exports.cancelTripWithPenalty = cancelTripWithPenalty;
exports.getTripAttributes = getTripAttributes;
exports.getTripPassengers = getTripPassengers;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const ApiError_1 = require("../utils/ApiError");
const constants_1 = require("../config/constants");
const commissionService_1 = __importDefault(require("./commissionService"));
const notificationService_1 = __importDefault(require("./notificationService"));
const realtimeService_1 = __importDefault(require("./realtimeService"));
const routeService_1 = __importDefault(require("./routeService"));
const maps_1 = __importDefault(require("../config/maps"));
const seatLock_1 = require("../utils/seatLock");
const homeService_1 = __importDefault(require("./homeService"));
const seatSerializer_1 = require("../utils/seatSerializer");
const auditService_1 = __importDefault(require("./auditService"));
const time_1 = require("../utils/time");
const freeTrips_1 = require("../utils/freeTrips");
const Models_1 = require("../Models");
/**
 * US3 minimum-balance gate. Rejects with NO_ACTIVE_PLAN when the driver has
 * no active plan, or INSUFFICIENT_BALANCE when the total balance cannot
 * cover the commission for one seat.
 */
async function hasRemainingFreeTrips(driverId) {
    const now = new Date();
    const subscription = await Models_1.DriverSubscription.findOne({
        where: {
            driverId,
            status: 'active',
            expiresAt: { [sequelize_1.Op.gt]: now },
        },
        include: [{
                model: Models_1.SubscriptionPlan,
                as: 'plan',
                attributes: ['id', 'isFree'],
            }],
    });
    if (!subscription || !(0, freeTrips_1.hasFreeTripsOffer)(subscription))
        return false;
    if (!subscription.plan || !subscription.plan.isFree)
        return false;
    const used = Number(subscription.freeTripsUsed) || 0;
    return used < (0, freeTrips_1.freeTripsLimit)(subscription);
}
async function assertCanPublish(driverId, farePerSeat) {
    const { current, minimum, totalBalance } = await commissionService_1.default.getGatingSnapshot(driverId, farePerSeat);
    if (!current) {
        throw ApiError_1.ApiErrors.custom('YOU_NEED_AN_ACTIVE_PLAN_TO_PUBLISH_TRIPS', 422, 'NO_ACTIVE_PLAN');
    }
    // Free-trip allowance covers publishing without needing a pre-funded balance.
    if (await hasRemainingFreeTrips(driverId)) {
        return { minimum, totalBalance, freeTrips: true };
    }
    if (totalBalance < minimum) {
        throw ApiError_1.ApiErrors.custom('INSUFFICIENT_BALANCE_TO_PUBLISH_TRIP', 422, 'INSUFFICIENT_BALANCE', null, { minimum: minimum.toFixed(2), balance: totalBalance.toFixed(2) });
    }
    return { minimum, totalBalance };
}
/**
 * Free-trips gate. If the driver's current active subscription has a free
 * trips offer (snapshots from signup), check that the driver has not
 * exhausted the allowed count. When free trips are exhausted, the driver
 * is still allowed to publish if they have an active paid subscription.
 */
async function assertFreeTripsAvailable(driverId) {
    const now = new Date();
    // Find the driver's current active subscription (free plan has queue priority).
    const subscription = await Models_1.DriverSubscription.findOne({
        where: {
            driverId,
            status: 'active',
            expiresAt: { [sequelize_1.Op.gt]: now },
        },
        include: [{
                model: Models_1.SubscriptionPlan,
                as: 'plan',
                attributes: ['id', 'isFree'],
            }],
    });
    // No active subscription — nothing to block here.
    if (!subscription)
        return;
    // Use the snapshot from the subscription, not the current plan.
    const freeOffer = subscription.freeOffer;
    if (!freeOffer)
        return;
    if (freeOffer.type !== constants_1.FREE_OFFER_TYPE.TRIPS)
        return;
    // Only block if this is a free plan subscription.
    if (!subscription.plan || !subscription.plan.isFree)
        return;
    const limit = (0, freeTrips_1.freeTripsLimit)(subscription);
    const used = Number(subscription.freeTripsUsed) || 0;
    if (used < limit)
        return;
    // Free trips exhausted. Check if the driver has an active paid subscription.
    const paidSub = await Models_1.DriverSubscription.findOne({
        where: {
            driverId,
            status: 'active',
            expiresAt: { [sequelize_1.Op.gt]: now },
        },
        include: [{
                model: Models_1.SubscriptionPlan,
                as: 'plan',
                where: { isFree: false },
                attributes: ['id'],
            }],
    });
    if (paidSub)
        return;
    throw ApiError_1.ApiErrors.custom('FREE_TRIPS_EXHAUSTED_PUBLISHING', 422, 'FREE_TRIPS_EXHAUSTED', null, { limit });
}
/**
 * Driver overlap guard. A driver cannot have two active trips whose time
 * windows overlap. Each trip occupies [departure, departure + TRIP_DURATION_HOURS).
 * Windows are half-open, so a trip starting exactly when another ends is allowed
 * (e.g. 05:00 + 2h blocks until 07:00, and a 07:00 trip is fine).
 *
 * Covers one-off and recurring trips in both directions:
 * - one-off vs one-off: direct window overlap.
 * - one-off vs recurring series: the one-off date falls inside the series range,
 *   on a series weekday, with an overlapping time-of-day.
 * - recurring vs recurring: the series ranges intersect on a shared weekday
 *   with an overlapping time-of-day.
 */
const BLOCKING_TRIP_STATUSES = [
    constants_1.TRIP_STATUS.PUBLISHED,
    constants_1.TRIP_STATUS.FULL,
    constants_1.TRIP_STATUS.IN_PROGRESS,
    constants_1.TRIP_STATUS.ONGOING,
];
function tripWindowEnd(start) {
    return new Date(new Date(start).getTime() + constants_1.TRIP_DURATION_HOURS * 60 * 60 * 1000);
}
function windowsOverlap(aStart, aEnd, bStart, bEnd) {
    return new Date(aStart).getTime() < new Date(bEnd).getTime()
        && new Date(bStart).getTime() < new Date(aEnd).getTime();
}
function dateOnly(d) {
    // Jordan calendar day (midnight Asia/Amman) — never server-local.
    return (0, time_1.jordanDateOnly)(d);
}
function minutesOfDay(d) {
    // Wall-clock minutes in Jordan for time-of-day comparisons.
    return (0, time_1.jordanMinutesOfDay)(d);
}
function timeWindowsOverlap(aStartMin, bStartMin) {
    const durationMin = constants_1.TRIP_DURATION_HOURS * 60;
    return aStartMin < bStartMin + durationMin && bStartMin < aStartMin + durationMin;
}
// True when a shared weekday actually occurs inside [rangeStart, rangeEnd]
// (rangeEnd null = open-ended, always true). Exact for weekly recurrence.
function sharedWeekdayOccurs(rangeStart, rangeEnd, weekdays) {
    if (!weekdays || weekdays.length === 0)
        return false;
    if (!rangeEnd)
        return true;
    const start = dateOnly(rangeStart);
    const end = dateOnly(rangeEnd);
    if (start > end)
        return false;
    const spanDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (spanDays >= 6)
        return true;
    const cursor = new Date(start);
    for (let i = 0; i <= spanDays; i++) {
        if (weekdays.includes((0, time_1.jordanWeekday)(cursor)))
            return true;
        cursor.setDate(cursor.getDate() + 1);
    }
    return false;
}
function oneOffOverlapsSeries(oneOffStart, oneOffEnd, series) {
    const first = dateOnly(series.departureTime);
    const day = dateOnly(oneOffStart);
    if (day < first)
        return false;
    if (series.recurrenceEndDate && day > dateOnly(series.recurrenceEndDate))
        return false;
    if (!sharedWeekdayOccurs(day, day, series.recurrenceDays || []))
        return false;
    return timeWindowsOverlap(minutesOfDay(oneOffStart), minutesOfDay(series.departureTime));
}
function seriesOverlapSeries(a, b) {
    const aFirst = dateOnly(a.departureTime);
    const bFirst = dateOnly(b.departureTime);
    const rangeStart = aFirst > bFirst ? aFirst : bFirst;
    const aEnd = a.recurrenceEndDate ? dateOnly(a.recurrenceEndDate) : null;
    const bEnd = b.recurrenceEndDate ? dateOnly(b.recurrenceEndDate) : null;
    const rangeEnd = aEnd && bEnd ? (aEnd < bEnd ? aEnd : bEnd) : (aEnd || bEnd);
    const shared = (a.recurrenceDays || []).filter((d) => (b.recurrenceDays || []).includes(d));
    if (!sharedWeekdayOccurs(rangeStart, rangeEnd, shared))
        return false;
    return timeWindowsOverlap(minutesOfDay(a.departureTime), minutesOfDay(b.departureTime));
}
async function assertNoOverlappingTrip(driverId, { departureTime, isRecurring, recurrenceDays, recurrenceEndDate, excludeTripId = null }) {
    const where = { driverId, status: BLOCKING_TRIP_STATUSES };
    if (excludeTripId)
        where.id = { [sequelize_1.Op.ne]: excludeTripId };
    const existing = await Models_1.Trip.findAll({
        where,
        attributes: ['id', 'departureTime', 'isRecurring', 'recurrenceDays', 'recurrenceEndDate', 'status'],
    });
    if (existing.length === 0)
        return;
    const newStart = new Date(departureTime);
    const newEnd = tripWindowEnd(newStart);
    const candidate = {
        departureTime: newStart,
        recurrenceDays: isRecurring ? (recurrenceDays || []) : null,
        recurrenceEndDate: isRecurring ? (0, time_1.parseJordanDateOrInstant)(recurrenceEndDate) : null,
    };
    for (const t of existing) {
        const curStart = new Date(t.departureTime);
        const curEnd = tripWindowEnd(curStart);
        let overlap = false;
        if (!t.isRecurring && !isRecurring) {
            overlap = windowsOverlap(newStart, newEnd, curStart, curEnd);
        }
        else if (t.isRecurring && !isRecurring) {
            overlap = oneOffOverlapsSeries(newStart, newEnd, t);
        }
        else if (!t.isRecurring && isRecurring) {
            overlap = oneOffOverlapsSeries(curStart, curEnd, candidate);
        }
        else {
            overlap = seriesOverlapSeries(candidate, t);
        }
        if (overlap) {
            throw ApiError_1.ApiErrors.custom('DRIVER_ALREADY_HAS_A_TRIP_IN_THIS_TIME_SLOT', 409, 'TRIP_TIME_OVERLAP', null, { conflicting_trip_id: t.id, conflicting_departure_time: t.departureTime });
        }
    }
}
/**
 * Create a new trip with seats, waypoints, and recurrence
 */
const createTrip = async (driverId, data) => {
    // Verify driver exists and is verified
    const driver = await Models_1.User.findByPk(driverId);
    if (!driver)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    if (driver.role !== 'driver')
        throw ApiError_1.ApiErrors.forbidden('ONLY_DRIVERS_CAN_CREATE_TRIPS');
    if (!driver.isVerified)
        throw ApiError_1.ApiErrors.forbidden('DRIVER_NOT_VERIFIED');
    // Fetch driver's vehicle (each driver has exactly one vehicle)
    const vehicle = await Models_1.Vehicle.findOne({ where: { driverId } });
    if (!vehicle)
        throw ApiError_1.ApiErrors.forbidden('DRIVER_HAS_NO_REGISTERED_VEHICLE');
    if (!vehicle.isVerified)
        throw ApiError_1.ApiErrors.forbidden('DRIVER_VEHICLE_IS_NOT_VERIFIED');
    // Validate seat configuration matches vehicle
    if (data.seats.length !== vehicle.seats) {
        throw ApiError_1.ApiErrors.validation('SEAT_COUNT_DOES_NOT_MATCH_VEHICLE_TOTAL_SEATS');
    }
    // Validate seat numbers are sequential 1 to N
    const seatNumbers = data.seats.map((s) => s.seat_number).sort((a, b) => a - b);
    const expectedNumbers = Array.from({ length: vehicle.seats }, (_, i) => i + 1);
    if (JSON.stringify(seatNumbers) !== JSON.stringify(expectedNumbers)) {
        throw ApiError_1.ApiErrors.validation('SEAT_NUMBERS_MUST_BE_SEQUENTIAL_FROM_1_TO_TOTAL_SEATS');
    }
    // Validate at least one available seat
    const availableSeats = data.seats.filter((s) => s.type === 'available');
    if (availableSeats.length === 0) {
        throw ApiError_1.ApiErrors.validation('AT_LEAST_ONE_SEAT_MUST_BE_AVAILABLE');
    }
    // Validate exactly one driver seat
    const driverSeats = data.seats.filter((s) => s.type === 'driver');
    if (driverSeats.length !== 1) {
        throw ApiError_1.ApiErrors.validation('EXACTLY_ONE_SEAT_MUST_BE_MARKED_AS_DRIVER');
    }
    // Departure is a single timezone-aware ISO-8601 instant
    // (e.g. 2026-09-15T06:00:00+03:00). Naive datetimes are rejected.
    const departureDateTime = (0, time_1.parseTimezoneAware)(data.departure_time);
    if (departureDateTime <= new Date()) {
        throw ApiError_1.ApiErrors.validation('DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE');
    }
    // Validate recurrence
    const isRecurring = data.type_of_trip === 'repeated';
    if (isRecurring && (!data.repeated_days || data.repeated_days.length === 0)) {
        throw ApiError_1.ApiErrors.validation('REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS');
    }
    if (isRecurring && !data.repeated_end_date) {
        throw ApiError_1.ApiErrors.validation('END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS');
    }
    if (isRecurring) {
        const endDate = (0, time_1.parseJordanDateOnly)(data.repeated_end_date);
        if (endDate <= departureDateTime) {
            throw ApiError_1.ApiErrors.validation('END_DATE_MUST_BE_AFTER_DEPARTURE_DATE');
        }
    }
    // Overlap guard: the driver cannot have another active trip in this window.
    await assertNoOverlappingTrip(driverId, {
        departureTime: departureDateTime,
        isRecurring,
        recurrenceDays: isRecurring ? data.repeated_days : null,
        recurrenceEndDate: isRecurring ? data.repeated_end_date : null,
    });
    // Free-trips gate: block if the driver exhausted their free trip allowance.
    await assertFreeTripsAvailable(driverId);
    // US3: minimum-balance gate before publishing.
    await assertCanPublish(driverId, data.fare_per_seat);
    // Create trip
    const trip = await Models_1.Trip.create({
        driverId,
        vehicleId: vehicle.id,
        originCity: data.origin_city,
        originArea: data.origin_area || null,
        originLat: data.origin_lat || null,
        originLng: data.origin_lng || null,
        destinationCity: data.destination_city,
        destinationArea: data.destination_area || null,
        destinationLat: data.destination_lat || null,
        destinationLng: data.destination_lng || null,
        departureTime: departureDateTime,
        totalSeats: vehicle.seats,
        availableSeats: availableSeats.length,
        farePerSeat: data.fare_per_seat,
        totalProfit: Number(data.fare_per_seat) * availableSeats.length,
        isRecurring,
        recurrenceDays: isRecurring ? data.repeated_days : null,
        recurrenceEndDate: isRecurring ? (0, time_1.parseJordanDateOnly)(data.repeated_end_date) : null,
        genderPreference: data.allowed_type || constants_1.GENDER_PREFERENCE.ALL,
        driverInstructions: data.instructions || null,
        additionalInstructions: data.additional_instructions || null,
        status: constants_1.TRIP_STATUS.PUBLISHED,
    });
    // Create seat configurations. wasAvailable freezes the driver's
    // designation so a booked seat still reads back as originally available.
    const seatRecords = data.seats.map((s) => ({
        tripId: trip.id,
        seatNumber: s.seat_number,
        seatType: s.type,
        wasAvailable: s.type === constants_1.SEAT_TYPE.AVAILABLE,
    }));
    await Models_1.TripSeat.bulkCreate(seatRecords);
    // Create stops / waypoints including dedicated pickup and dropoff points (each with name + lat/lng)
    const buildStopRecord = (src, fallbackOrder, fallbackType) => {
        const name = src.stop_name || src.name || src.city || null;
        const city = src.city || src.stop_name || src.name || null;
        const address = src.address || null;
        const latRaw = src.lat ?? src.stop_lat ?? src.latitude ?? null;
        const lngRaw = src.lng ?? src.stop_lng ?? src.longitude ?? null;
        const stopOrder = src.stop_order != null ? Number(src.stop_order) : fallbackOrder;
        const stopType = src.stop_type || fallbackType || 'both';
        return {
            tripId: trip.id,
            stopOrder,
            stopName: name ? String(name).trim() : null,
            city: city ? String(city).trim() : null,
            address: address ? String(address).trim() : null,
            // legacy lat/lng columns (used by bookingService fallback)
            lat: latRaw != null ? String(latRaw) : null,
            lng: lngRaw != null ? String(lngRaw) : null,
            stopLat: latRaw != null ? String(latRaw) : null,
            stopLng: lngRaw != null ? String(lngRaw) : null,
            stopType,
        };
    };
    let stopRecords = [];
    // Prefer explicit stops array if provided (full control)
    if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
        stopRecords = data.stops.map((s, idx) => buildStopRecord(s, idx + 1, s.stop_type || 'both'));
    }
    else {
        let order = 1;
        const pickupSrc = data.pickup_point || data.pickup || data.pickup_location || null;
        if (pickupSrc && typeof pickupSrc === 'object') {
            stopRecords.push(buildStopRecord(pickupSrc, order++, 'pickup'));
        }
        if (data.waypoints && Array.isArray(data.waypoints) && data.waypoints.length > 0) {
            for (const w of data.waypoints) {
                const hasAny = w.stop_name || w.name || w.stop_lat || w.lat || w.stop_lng || w.lng || w.city;
                if (!hasAny)
                    continue;
                stopRecords.push(buildStopRecord(w, order++, w.stop_type || 'both'));
            }
        }
        const dropoffSrc = data.dropoff_point || data.dropoff || data.dropoff_location || data.drop_off_point || null;
        if (dropoffSrc && typeof dropoffSrc === 'object') {
            stopRecords.push(buildStopRecord(dropoffSrc, order++, 'dropoff'));
        }
    }
    if (stopRecords.length > 0) {
        // Ensure stopOrder is sequential and unique
        stopRecords.forEach((r, idx) => { if (!r.stopOrder)
            r.stopOrder = idx + 1; });
        stopRecords.sort((a, b) => a.stopOrder - b.stopOrder);
        stopRecords.forEach((r, idx) => { r.stopOrder = idx + 1; });
        await Models_1.TripStop.bulkCreate(stopRecords);
    }
    // spec 013: best-effort route compute — failure marks route_status=failed and
    // never blocks publish (O8). computeTripRoute never throws for provider errors.
    try {
        await routeService_1.default.computeTripRoute(trip.id);
    }
    catch (err) {
        console.warn('[tripService] route compute failed:', err.message);
    }
    trackTripMutation({
        action: 'trip.created',
        driverId,
        tripId: trip.id,
        payload: {
            status: trip.status,
            origin_city: trip.originCity,
            destination_city: trip.destinationCity,
            departure_time: trip.departureTime,
            fare_per_seat: trip.farePerSeat,
            total_seats: trip.totalSeats,
            available_seats: trip.availableSeats,
        },
    });
    return {
        trip_id: trip.id,
        status: trip.status,
        total_seats: trip.totalSeats,
        available_seats: trip.availableSeats,
        estimated_earnings: trip.availableSeats * trip.farePerSeat,
        total_profit: Number(trip.totalProfit),
        message: 'TRIP_PUBLISHED_SUCCESSFULLY',
    };
};
exports.createTrip = createTrip;
/**
 * Audit a driver trip mutation with the trip as the resource.
 */
function trackTripMutation({ action, driverId, tripId, payload = {} }) {
    auditService_1.default.track({
        action,
        resourceType: 'trip',
        resourceId: tripId,
        actorId: driverId,
        actorType: 'driver',
        payload,
    });
}
/**
 * Get trip by ID with full details: driver profile, vehicle, waypoints,
 * attributes, and confirmed passengers with their profiles and booking info.
 * `_participantIds` lets the controller gate access to driver + confirmed
 * passengers + admins.
 */
const getTripById = async (tripId) => {
    // Reads return the current state: close out the trip first when it already
    // aged past the lifecycle cutoff. Lazy-required to avoid a module cycle
    // (tripExpiryService -> tripService).
    try {
        const { refreshStaleTrips } = require('./tripExpiryService');
        await refreshStaleTrips([tripId]);
    }
    catch (err) {
        console.warn('[tripService] expiry sweep failed:', err.message);
    }
    const trip = await Models_1.Trip.findByPk(tripId, {
        include: [
            {
                model: Models_1.User,
                as: 'driver',
                attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'],
            },
            {
                model: Models_1.Vehicle,
                as: 'vehicle',
                attributes: ['id', 'manufacturer', 'model', 'modelYear', 'plateNumber', 'color', 'seats'],
            },
            { model: Models_1.TripSeat, as: 'seats' },
            { model: Models_1.TripStop, as: 'stops' },
            { model: Models_1.TripAttribute, as: 'attributes' },
            {
                model: Models_1.Booking,
                as: 'bookings',
                where: { status: constants_1.BOOKING_STATUS.CONFIRMED },
                required: false,
                include: [
                    {
                        model: Models_1.User,
                        as: 'passenger',
                        attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'],
                    },
                ],
            },
        ],
    });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    const data = trip.toJSON();
    const confirmedBookings = data.bookings || [];
    data.trip = {
        trip_id: data.id,
        driver: data.driver
            ? {
                id: data.driver.id,
                full_name: data.driver.fullName,
                phone: data.driver.phone,
                rating: Number(data.driver.avgRating) || 0,
                profile_picture_url: data.driver.avatarUrl,
            }
            : null,
        vehicle: data.vehicle
            ? {
                vehicle_id: data.vehicle.id,
                make_model: `${data.vehicle.manufacturer} ${data.vehicle.model}`,
                year: data.vehicle.modelYear,
                plate_number: data.vehicle.plateNumber,
                color: data.vehicle.color,
                total_seats: data.vehicle.seats,
            }
            : null,
        origin: {
            city: data.originCity,
            area: data.originArea,
            lat: data.originLat ? Number(data.originLat) : null,
            lng: data.originLng ? Number(data.originLng) : null,
        },
        destination: {
            city: data.destinationCity,
            area: data.destinationArea,
            lat: data.destinationLat ? Number(data.destinationLat) : null,
            lng: data.destinationLng ? Number(data.destinationLng) : null,
        },
        departure_time: data.departureTime,
        fare_per_seat: Number(data.farePerSeat),
        total_profit: Number(data.totalProfit) || 0,
        currency: data.currency || 'JOD',
        total_seats: data.totalSeats,
        available_seats: data.availableSeats,
        status: data.status,
        is_recurring: data.isRecurring,
        recurrence_days: data.recurrenceDays,
        recurrence_end_date: data.recurrenceEndDate,
        gender_preference: data.genderPreference,
        attributes: (data.attributes || []).map((a) => ({
            key: a.attrKey,
            value: a.attrValue === 'true',
        })),
        waypoints: (data.stops || []).map((s) => ({
            stop_name: s.stopName,
            stop_lat: s.stopLat ? Number(s.stopLat) : null,
            stop_lng: s.stopLng ? Number(s.stopLng) : null,
        })),
        instructions: data.driverInstructions,
        additional_instructions: data.additionalInstructions,
        created_at: data.createdAt,
    };
    data.passengers = confirmedBookings.map((b) => ({
        booking_id: b.id,
        passenger: b.passenger
            ? {
                id: b.passenger.id,
                full_name: b.passenger.fullName,
                phone: b.passenger.phone,
                rating: Number(b.passenger.avgRating) || 0,
                profile_picture_url: b.passenger.avatarUrl,
            }
            : null,
        seats_booked: b.seatsBooked,
        seat_numbers: (0, seatSerializer_1.seatNumbersFor)(b),
        agreed_fare: Number(b.agreedFare),
        booking_status: b.status,
        dropoff_place: b.dropoffPlace,
        dropoff_deadline: b.dropoffDeadline,
        created_at: b.createdAt,
    }));
    data._participantIds = [data.driverId, ...confirmedBookings.map((b) => b.passengerId)];
    delete data.driver;
    delete data.vehicle;
    delete data.bookings;
    delete data.originCity;
    delete data.originArea;
    delete data.originAddress;
    delete data.originLat;
    delete data.originLng;
    delete data.destinationCity;
    delete data.destinationArea;
    delete data.destinationAddress;
    delete data.destinationLat;
    delete data.destinationLng;
    delete data.farePerSeat;
    delete data.totalProfit;
    delete data.totalSeats;
    delete data.availableSeats;
    delete data.genderPreference;
    delete data.driverInstructions;
    delete data.additionalInstructions;
    delete data.isRecurring;
    delete data.recurrenceDays;
    delete data.recurrenceEndDate;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.isFeatured;
    delete data.featuredUntil;
    delete data.isBlockedByBalance;
    delete data.isModerated;
    delete data.moderationReason;
    delete data.moderatedBy;
    delete data.arrivalTime;
    return data;
};
exports.getTripById = getTripById;
/**
 * Get trip booking options (spec 012 US2): the current open-seat count and the
 * ordered drop-off points (the trip's stops). Refused for trips that have
 * already started or ended (not bookable).
 */
const getTripOptions = async (tripId) => {
    const trip = await Models_1.Trip.findByPk(tripId, {
        attributes: ['id', 'status', 'availableSeats'],
        include: [{ model: Models_1.TripStop, as: 'stops' }],
    });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (![constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL].includes(trip.status)) {
        throw ApiError_1.ApiErrors.conflict('TRIP_NOT_BOOKABLE');
    }
    const allPoints = (trip.stops || [])
        .slice()
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .map((s) => ({
        stop_id: s.id,
        stop_order: s.stopOrder,
        stop_name: s.stopName,
        city: s.city,
        address: s.address || null,
        lat: s.lat != null ? Number(s.lat) : s.stopLat != null ? Number(s.stopLat) : null,
        lng: s.lng != null ? Number(s.lng) : s.stopLng != null ? Number(s.stopLng) : null,
        stop_type: s.stopType || 'both',
    }));
    const pickupPoints = allPoints.filter((p) => p.stop_type === 'pickup' || p.stop_type === 'both');
    const dropOffPoints = allPoints.filter((p) => p.stop_type === 'dropoff' || p.stop_type === 'both');
    return {
        trip_id: trip.id,
        available_seats: trip.availableSeats,
        // backward compat: drop_off_points historically contained all stops; now filtered to dropoff/both but keep alias `points` for all
        drop_off_points: dropOffPoints,
        pickup_points: pickupPoints,
        points: allPoints,
        stops: allPoints,
    };
};
exports.getTripOptions = getTripOptions;
/**
 * Get seats for a trip - returns all seats and empty (available) seats.
 * Any authenticated user may call it. Trip must exist; no status restriction
 * beyond existence so passengers can inspect layout even before booking.
 */
const getTripSeats = async (tripId) => {
    const trip = await Models_1.Trip.findByPk(tripId, {
        attributes: ['id', 'status', 'totalSeats', 'availableSeats', 'driverId'],
    });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    const seatRows = await Models_1.TripSeat.findAll({
        where: { tripId: trip.id },
        order: [['seat_number', 'ASC']],
    });
    // Enrich with lock info (best-effort, never throws)
    const seats = await Promise.all(seatRows.map(async (s) => {
        let locked = false;
        let lockedBy = null;
        let expiresAt = null;
        try {
            const lock = await (0, seatLock_1.checkSeatLock)(tripId, s.seatNumber);
            locked = lock.locked;
            lockedBy = lock.passengerId;
            expiresAt = lock.expiresAt;
        }
        catch (_err) {
            // redis offline - treat as unlocked
        }
        return {
            seat_number: s.seatNumber,
            seat_type: s.seatType,
            was_available: Boolean(s.wasAvailable),
            is_available: s.seatType === 'available' && !locked,
            is_locked: locked,
            locked_by: lockedBy,
            locked_expires_at: expiresAt,
        };
    }));
    const emptySeats = seats.filter((s) => s.seat_type === 'available' && !s.is_locked);
    const availableSeats = seats.filter((s) => s.seat_type === 'available');
    return {
        trip_id: trip.id,
        status: trip.status,
        total_seats: trip.totalSeats,
        available_seats: trip.availableSeats,
        seats_count: seats.length,
        seats,
        empty_seats: emptySeats,
        empty_seats_count: emptySeats.length,
        available_seats_detail: availableSeats,
    };
};
exports.getTripSeats = getTripSeats;
/**
 * Get trips for a driver (contract D-list). Each trip is serialized with its
 * current lifecycle `status` included.
 */
const getDriverTrips = async (driverId, status) => {
    const where = { driverId };
    if (status)
        where.status = status;
    // Reads return the current state: close out anything already expired first.
    try {
        const liveIds = (await Models_1.Trip.findAll({
            where: {
                driverId,
                isRecurring: false,
                status: { [sequelize_1.Op.in]: [constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL, constants_1.TRIP_STATUS.IN_PROGRESS, constants_1.TRIP_STATUS.ONGOING] },
            },
            attributes: ['id'],
        })).map((t) => t.id);
        const { refreshStaleTrips } = require('./tripExpiryService');
        await refreshStaleTrips(liveIds);
    }
    catch (err) {
        console.warn('[tripService] expiry sweep failed:', err.message);
    }
    const trips = await Models_1.Trip.findAll({
        where,
        include: [
            { model: Models_1.TripSeat, as: 'seats' },
            { model: Models_1.TripStop, as: 'stops' },
        ],
        order: [['departure_time', 'ASC']],
    });
    return trips.map((trip) => ({
        trip_id: trip.id,
        origin_city: trip.originCity,
        origin_area: trip.originArea,
        destination_city: trip.destinationCity,
        destination_area: trip.destinationArea,
        departure_time: trip.departureTime,
        arrival_time: trip.arrivalTime,
        fare_per_seat: Number(trip.farePerSeat),
        total_profit: Number(trip.totalProfit) || 0,
        currency: trip.currency || 'JOD',
        total_seats: trip.totalSeats,
        available_seats: trip.availableSeats,
        gender_preference: trip.genderPreference,
        is_recurring: trip.isRecurring,
        recurrence_days: trip.recurrenceDays,
        recurrence_end_date: trip.recurrenceEndDate,
        instructions: trip.driverInstructions,
        additional_instructions: trip.additionalInstructions,
        status: trip.status,
        seats: (trip.seats || []).map((s) => ({
            seat_number: s.seatNumber,
            seat_type: s.seatType,
            was_available: Boolean(s.wasAvailable),
        })),
        waypoints: (trip.stops || []).map((s) => ({
            stop_name: s.stopName,
            stop_lat: s.stopLat ? Number(s.stopLat) : null,
            stop_lng: s.stopLng ? Number(s.stopLng) : null,
        })),
        created_at: trip.createdat || trip.createdAt,
    }));
};
exports.getDriverTrips = getDriverTrips;
/**
 * Get available trips for passengers (with recurrence expansion).
 * Additive filters (spec 012): time window, vehicle type, minimum seat count.
 * The output keeps the existing raw-trip shape for backward compatibility.
 */
/**
 * Helper to build a Trip query for a specific date/direction.
 * Includes driver details (name, rating, avatar) + vehicle.
 * NOTE: `targetDate` is the START of the range (inclusive) — the search
 * returns trips on that date AND all future ones, not just that single day.
 */
async function fetchTripsForDate({ targetDate, originCity, destinationCity, genderPreference, timeFrom, timeTo, vehicleType, seats }) {
    const hasDate = !!targetDate;
    const now = new Date();
    let qd = null;
    let dayStart = null;
    if (hasDate) {
        // Jordan calendar day: date-only input means Jordan midnight; a full
        // timezone-aware datetime is floored to its Jordan day.
        qd = (0, time_1.parseJordanDayStart)(targetDate);
        dayStart = (0, time_1.jordanDateOnly)(qd);
    }
    const where = {
        status: constants_1.TRIP_STATUS.PUBLISHED,
        isModerated: false,
    };
    // Seat filter: if seats requested, require at least that many; otherwise require at least 1
    if (seats && Number(seats) > 0) {
        where.availableSeats = { [sequelize_1.Op.gte]: Number(seats) };
    }
    else {
        where.availableSeats = { [sequelize_1.Op.gt]: 0 };
    }
    if (originCity)
        where.originCity = originCity;
    if (destinationCity)
        where.destinationCity = destinationCity;
    if (genderPreference && genderPreference !== constants_1.GENDER_PREFERENCE.ALL) {
        where.genderPreference = { [sequelize_1.Op.in]: [genderPreference] };
    }
    const andConditions = [];
    if (hasDate) {
        // Date is the start of the range (inclusive): one-off trips departing on
        // the date or any later day, plus recurring trips that are still active
        // AND either start on/after the date or actually run on the searched
        // weekday. The weekday check keeps stale series (first departure long
        // past, not running on the searched day) out of the results.
        const dateBranch = {
            [sequelize_1.Op.or]: [
                {
                    isRecurring: false,
                    departureTime: { [sequelize_1.Op.gte]: dayStart },
                },
                {
                    isRecurring: true,
                    [sequelize_1.Op.and]: [
                        {
                            [sequelize_1.Op.or]: [
                                { recurrenceEndDate: { [sequelize_1.Op.gte]: dayStart } },
                                { recurrenceEndDate: { [sequelize_1.Op.is]: null } },
                            ],
                        },
                        {
                            [sequelize_1.Op.or]: [
                                { departureTime: { [sequelize_1.Op.gte]: dayStart } },
                                { recurrenceDays: { [sequelize_1.Op.contains]: [(0, time_1.jordanWeekday)(dayStart)] } },
                            ],
                        },
                    ],
                },
            ],
        };
        andConditions.push(dateBranch);
        // Time window is a time-of-day filter applied post-query below (it must
        // not be an absolute single-day datetime range, otherwise every future
        // trip outside the target day would be excluded).
        // Exclude trips whose departure time is already in the past (only for non-recurring)
        andConditions.push({
            [sequelize_1.Op.or]: [
                { isRecurring: true },
                { departureTime: { [sequelize_1.Op.gt]: now } },
            ],
        });
    }
    else {
        // No date filter: return all future trips (published + available), excluding past one-off trips
        andConditions.push({
            [sequelize_1.Op.or]: [
                { isRecurring: false, departureTime: { [sequelize_1.Op.gt]: now } },
                {
                    isRecurring: true,
                    [sequelize_1.Op.or]: [
                        { recurrenceEndDate: { [sequelize_1.Op.gte]: now } },
                        { recurrenceEndDate: { [sequelize_1.Op.is]: null } },
                    ],
                },
            ],
        });
        // Time window for no-date case is applied post-query (time-of-day filtering)
    }
    if (andConditions.length > 0) {
        where[sequelize_1.Op.and] = andConditions;
    }
    const include = [
        { model: Models_1.TripSeat, as: 'seats', where: { seatType: 'available' } },
        { model: Models_1.TripStop, as: 'stops' },
        { model: Models_1.Vehicle, as: 'vehicle' },
        { model: Models_1.User, as: 'driver', attributes: ['id', 'fullName', 'avgRating', 'avatarUrl', 'gender'] },
    ];
    if (vehicleType) {
        include[2] = { model: Models_1.Vehicle, as: 'vehicle', where: { vehicleType } };
    }
    let trips = await Models_1.Trip.findAll({
        where,
        include,
        order: [['departure_time', 'ASC']],
    });
    // Time-window semantics (Jordan wall-clock; `date` — or today when omitted
    // — anchors the day):
    // - from only: departures at/after <anchor day @ from> — the searched date
    //   and everything after it — nearest future first.
    // - to only: departures between NOW and <anchor day @ to>.
    // - both: departures whose time-of-day falls in [from, to] across the whole
    //   range, closest to `from` at the top.
    // Recurring series repeat on later days, so they are matched on time-of-day.
    if (timeFrom || timeTo) {
        const parseMinutes = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const fromMin = timeFrom ? parseMinutes(timeFrom) : null;
        const toMin = timeTo ? parseMinutes(timeTo) : null;
        const anchorStartMs = (hasDate ? dayStart : (0, time_1.jordanStartOfToday)()).getTime();
        const byDepartureAsc = (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        if (fromMin !== null && toMin === null) {
            const cutoff = Math.max(anchorStartMs + fromMin * 60000, now.getTime());
            trips = trips
                .filter((trip) => {
                if (trip.isRecurring)
                    return (0, time_1.jordanMinutesOfDay)(trip.departureTime) >= fromMin;
                return new Date(trip.departureTime).getTime() >= cutoff;
            })
                .sort(byDepartureAsc);
        }
        else if (fromMin === null && toMin !== null) {
            const upper = anchorStartMs + toMin * 60000;
            trips = trips
                .filter((trip) => {
                if (trip.isRecurring)
                    return (0, time_1.jordanMinutesOfDay)(trip.departureTime) <= toMin;
                const ms = new Date(trip.departureTime).getTime();
                return ms > now.getTime() && ms <= upper;
            })
                .sort(byDepartureAsc);
        }
        else {
            // Both bounds: time-of-day window across the whole range. Every
            // in-window trip departs at/after <anchor day @ from>, so sorting by
            // absolute distance to the window start is departure order — the trip
            // closest to `from` (nearest future first) lands on top.
            const anchorFromMs = anchorStartMs + fromMin * 60000;
            trips = trips
                .filter((trip) => {
                const minutes = (0, time_1.jordanMinutesOfDay)(trip.departureTime);
                return minutes >= fromMin && minutes <= toMin;
            })
                .sort((a, b) => Math.abs(new Date(a.departureTime).getTime() - anchorFromMs) -
                Math.abs(new Date(b.departureTime).getTime() - anchorFromMs) || byDepartureAsc(a, b));
        }
    }
    // Defensive: also filter out any trips that are effectively in the past
    // (in case of DB clock drift). Recurring trips are kept only if they start
    // on/after the searched date or run on its weekday — same rule as the query.
    trips = trips.filter((trip) => {
        if (!trip.isRecurring) {
            return new Date(trip.departureTime).getTime() > now.getTime();
        }
        if (!hasDate)
            return true;
        if (new Date(trip.departureTime).getTime() >= dayStart.getTime())
            return true;
        const days = trip.recurrenceDays || [];
        return days.includes((0, time_1.jordanWeekday)(dayStart));
    });
    return trips;
}
const getAvailableTrips = async (filters = {}) => {
    const { originCity, destinationCity, date, returnDate, genderPreference = null, timeFrom, timeTo, vehicleType, seats, } = filters;
    // Validate dates when provided; allow omitting date to return all trips.
    // Calendar days are Jordan days (Asia/Amman), never server-local.
    let queryDate = null;
    if (date) {
        queryDate = (0, time_1.parseJordanDayStart)(date);
        if ((0, time_1.jordanDateOnly)(queryDate) < (0, time_1.jordanStartOfToday)()) {
            throw ApiError_1.ApiErrors.validation('DATE_CANNOT_BE_IN_THE_PAST');
        }
    }
    if (returnDate) {
        const rd = (0, time_1.parseJordanDayStart)(returnDate);
        if ((0, time_1.jordanDateOnly)(rd) < (0, time_1.jordanStartOfToday)())
            throw ApiError_1.ApiErrors.validation('DATE_CANNOT_BE_IN_THE_PAST');
        if (queryDate && (0, time_1.jordanDateOnly)(rd) < (0, time_1.jordanDateOnly)(queryDate)) {
            throw ApiError_1.ApiErrors.validation('DATE_CANNOT_BE_IN_THE_PAST');
        }
    }
    const trips = await fetchTripsForDate({
        targetDate: date || null,
        originCity,
        destinationCity,
        genderPreference,
        timeFrom,
        timeTo,
        vehicleType,
        seats,
    });
    let returningTrips = [];
    if (returnDate && originCity && destinationCity) {
        returningTrips = await fetchTripsForDate({
            targetDate: returnDate,
            originCity: destinationCity,
            destinationCity: originCity,
            genderPreference,
            timeFrom,
            timeTo,
            vehicleType,
            seats,
        });
    }
    // Backward compat: callers that expect an array still get trips,
    // but we also attach returningTrips as a property for new controller.
    // Returning an object shape is the new contract for the controller.
    const result = trips;
    result.returningTrips = returningTrips;
    // Also return object form for explicit destructuring
    return { trips, returningTrips };
};
exports.getAvailableTrips = getAvailableTrips;
/**
 * Start a trip (US3). Re-verifies the minimum balance and marks the trip
 * in-progress. Sends an INSUFFICIENT_BALANCE_START notification when the
 * balance check fails.
 */
const startTrip = async (driverId, tripId) => {
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_START_YOUR_OWN_TRIPS');
    if (![constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL].includes(trip.status)) {
        throw ApiError_1.ApiErrors.custom('TRIP_CANNOT_BE_STARTED_FROM_ITS_CURRENT_STATUS', 422, 'INVALID_TRIP_STATUS');
    }
    // US2: departure window — reject starting more than 1 hour before departure.
    const now = Date.now();
    const START_WINDOW_MS = 60 * 60 * 1000;
    if (trip.departureTime.getTime() - now > START_WINDOW_MS) {
        throw ApiError_1.ApiErrors.custom('TRIP_CANNOT_BE_STARTED_YET_IT_CAN_ONLY_BE_STARTED', 400, 'TOO_EARLY_TO_START');
    }
    const { current, minimum, totalBalance } = await commissionService_1.default.getGatingSnapshot(driverId, trip.farePerSeat);
    if (!current) {
        throw ApiError_1.ApiErrors.custom('YOU_NEED_AN_ACTIVE_PLAN_TO_START_TRIPS', 422, 'NO_ACTIVE_PLAN');
    }
    if (!(await hasRemainingFreeTrips(driverId)) && totalBalance < minimum) {
        const user = await Models_1.User.findByPk(driverId);
        if (user) {
            try {
                await notificationService_1.default.sendToUser(user, 'INSUFFICIENT_BALANCE_START', {
                    channels: ['sms', 'in_app', 'push'],
                    data: { trip_id: tripId, required: minimum, balance: totalBalance },
                });
            }
            catch (err) {
                console.warn('[tripService] insufficient balance notification failed:', err.message);
            }
        }
        throw ApiError_1.ApiErrors.custom('YOUR_TRIP_CANNOT_BE_STARTED_BECAUSE_YOUR_BALANCE_IS_INSUFFICIENT', 422, 'INSUFFICIENT_BALANCE');
    }
    await trip.update({ status: constants_1.TRIP_STATUS.IN_PROGRESS, startedAt: new Date() });
    // US2: best-effort notify confirmed passengers that the trip has started.
    try {
        await notificationService_1.default.notifyConfirmedPassengers([trip.id], 'TRIP_STARTED', { data: { trip_id: trip.id } });
    }
    catch (err) {
        console.warn('[tripService] TRIP_STARTED notification failed:', err.message);
    }
    // US2: drop the cached home payload so it reflects the new trip status.
    try {
        await homeService_1.default.invalidateHomeCache(driverId);
    }
    catch (err) {
        console.warn('[tripService] home cache invalidation failed:', err.message);
    }
    const trackingLink = `${process.env.SOCKET_TRACKING_BASE_URL || 'wss://api.masar.app/socket.io'}?trip=${trip.id}`;
    trackTripMutation({
        action: 'trip.started',
        driverId,
        tripId: trip.id,
        payload: { status: trip.status },
    });
    return {
        trip_id: trip.id,
        status: trip.status,
        message: 'TRIP_STARTED_SUCCESSFULLY',
        tracking_link: trackingLink,
    };
};
exports.startTrip = startTrip;
/**
 * Complete a trip (US3). Deducts the commission (total paid fare × current
 * plan rate) FIFO from the active plans and marks the trip completed. If the
 * deduction pushes the driver into debt their trips are blocked.
 */
const completeTrip = async (driverId, tripId) => {
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_COMPLETE_YOUR_OWN_TRIPS');
    if (![constants_1.TRIP_STATUS.IN_PROGRESS, constants_1.TRIP_STATUS.ONGOING].includes(trip.status)) {
        throw ApiError_1.ApiErrors.custom('TRIP_CANNOT_BE_COMPLETED_FROM_ITS_CURRENT_STATUS', 422, 'INVALID_TRIP_STATUS');
    }
    const result = await commissionService_1.default.deductCommission(trip, driverId);
    await trip.update({ status: constants_1.TRIP_STATUS.COMPLETED, completedAt: new Date() });
    // spec 013: compact the driven path best-effort; the job retries if empty.
    try {
        await routeService_1.default.compactActualPath(trip.id);
    }
    catch (err) {
        console.warn('[tripService] actual path compaction failed:', err.message);
    }
    try {
        realtimeService_1.default.emitToRoom(`trip:${trip.id}`, 'tracking:ended', { trip_id: trip.id, reason: 'completed' });
    }
    catch (_err) {
        // socket layer offline (e.g. tests) — ignore
    }
    // Finalize confirmed bookings (spec 009 US3): completed + paid_cash + timestamp.
    const confirmedBookings = await Models_1.Booking.findAll({
        where: { tripId: trip.id, status: constants_1.BOOKING_STATUS.CONFIRMED },
        include: [{ model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName'] }],
    });
    for (const booking of confirmedBookings) {
        await booking.update({
            status: constants_1.BOOKING_STATUS.COMPLETED,
            paymentStatus: 'paid_cash',
            completedAt: new Date(),
        });
        if (booking.passenger) {
            try {
                await notificationService_1.default.sendToUser(booking.passenger, 'TRIP_COMPLETED_PROMPT', {
                    channels: ['in_app'],
                    vars: { route: `${trip.originCity} - ${trip.destinationCity}` },
                });
            }
            catch (err) {
                console.warn('[tripService] trip completed notification failed:', err.message);
            }
        }
    }
    // Increment free trips counter if the driver's subscription has a free trips offer.
    try {
        const now = new Date();
        const subscription = await Models_1.DriverSubscription.findOne({
            where: {
                driverId,
                status: 'active',
                expiresAt: { [sequelize_1.Op.gt]: now },
            },
            include: [{
                    model: Models_1.SubscriptionPlan,
                    as: 'plan',
                    where: { isFree: true },
                    attributes: ['id'],
                }],
        });
        // Use the snapshot from the subscription, not the current plan.
        if (subscription && subscription.freeOffer &&
            subscription.freeOffer.type === constants_1.FREE_OFFER_TYPE.TRIPS) {
            await subscription.increment('freeTripsUsed');
        }
    }
    catch (err) {
        console.warn('[tripService] failed to increment free trips counter:', err.message);
    }
    if (result.isInDebt) {
        const user = await Models_1.User.findByPk(driverId);
        if (user) {
            try {
                await notificationService_1.default.sendToUser(user, 'DEBT', {
                    channels: ['in_app', 'push'],
                    vars: { balance: Number(result.balanceAfter).toFixed(2) },
                    data: { trip_id: tripId, commission: result.commission },
                });
            }
            catch (err) {
                console.warn('[tripService] debt notification failed:', err.message);
            }
        }
    }
    // US3: reflect completion in the cached driver + passenger homes.
    await homeService_1.default.invalidateHomeForTrip(trip.id, driverId);
    trackTripMutation({
        action: 'trip.completed',
        driverId,
        tripId: trip.id,
        payload: {
            commission: result.commission,
            plan_name: result.planName,
            balance_after: result.balanceAfter,
            is_in_debt: result.isInDebt,
        },
    });
    return {
        trip_id: trip.id,
        commission: result.commission,
        plan_name: result.planName,
        balance_after: result.balanceAfter,
        is_in_debt: result.isInDebt,
    };
};
exports.completeTrip = completeTrip;
module.exports = {
    createTrip,
    getTripById,
    getTripOptions,
    getTripSeats,
    getDriverTrips,
    getAvailableTrips,
    startTrip,
    completeTrip,
    updateTrip,
    replaceTripStops,
    getTripRoute,
    setPickupStatus,
    getBookingRoute,
    getTripActual,
    cancelTrip,
    cancelTripWithPenalty,
    getTripAttributes,
    getTripPassengers,
};
/**
 * Replace a trip's stops wholesale (PATCH /trips/:id/stops). Open trips only;
 * recompute is best-effort and booked passengers are notified (O8 pattern).
 */
async function replaceTripStops(driverId, tripId, stops) {
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_EDIT_YOUR_OWN_TRIPS');
    if (![constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL].includes(trip.status)) {
        throw ApiError_1.ApiErrors.custom('TRIP_STOPS_LOCKED_AFTER_START', 422, 'TRIP_STOPS_LOCKED_AFTER_START');
    }
    const list = Array.isArray(stops) ? stops : [];
    if (list.length > maps_1.default.maxTripStops)
        throw ApiError_1.ApiErrors.custom('TOO_MANY_WAYPOINTS', 422, 'TOO_MANY_WAYPOINTS');
    const records = [];
    for (let i = 0; i < list.length; i++) {
        const s = list[i] || {};
        const lat = Number(s.lat ?? s.stop_lat ?? s.latitude);
        const lng = Number(s.lng ?? s.stop_lng ?? s.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw ApiError_1.ApiErrors.validation('STOP_LATITUDE_MUST_BE_A_DECIMAL');
        }
        records.push({
            tripId: trip.id,
            stopOrder: i + 1,
            stopName: s.stop_name || s.name || s.city || null,
            city: s.city || s.stop_name || s.name || null,
            address: s.address || null,
            lat: String(lat),
            lng: String(lng),
            stopLat: String(lat),
            stopLng: String(lng),
            stopType: s.stop_type || 'both',
        });
    }
    await Models_1.TripStop.destroy({ where: { tripId: trip.id } });
    if (records.length)
        await Models_1.TripStop.bulkCreate(records);
    let routeStatus = trip.routeStatus;
    try {
        const out = await routeService_1.default.computeTripRoute(trip.id);
        if (out.ok)
            routeStatus = 'ready';
        else
            routeStatus = 'failed';
    }
    catch (err) {
        routeStatus = 'failed';
        console.warn('[tripService] stops recompute failed:', err.message);
    }
    try {
        await notificationService_1.default.notifyConfirmedPassengers([trip.id], 'ROUTE_UPDATED', { data: { trip_id: trip.id } });
    }
    catch (err) {
        console.warn('[tripService] route_updated notification failed:', err.message);
    }
    try {
        const fresh = await Models_1.Trip.findByPk(trip.id, { attributes: ['routeVersion'] });
        realtimeService_1.default.emitToRoom(`trip:${trip.id}`, 'tracking:route_updated', { route_version: fresh.routeVersion });
    }
    catch (_err) {
        // socket layer offline (e.g. tests) — ignore
    }
    trackTripMutation({ action: 'trip.stops_replaced', driverId, tripId: trip.id, payload: { stops: records.length, route_status: routeStatus } });
    return { trip_id: trip.id, stops: records.length, route_status: routeStatus };
}
/**
 * Planned route view (API5 driver/admin, API11 support read-only).
 * Passengers never see other pickups here — use the booking-scoped view (API9).
 * Phone numbers are never included; names are first-name only (O7/masking).
 */
async function getTripRoute(requesterId, requesterRole, tripId, { audited = false } = {}) {
    const trip = await Models_1.Trip.findByPk(tripId, { include: [{ model: Models_1.TripStop, as: 'stops' }] });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    const isOwner = trip.driverId === requesterId;
    const isStaff = ['admin', 'support', 'moderator'].includes(requesterRole);
    if (!isOwner && !isStaff)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_ROUTES_ON_YOUR_OWN_TRIPS');
    const bookings = await Models_1.Booking.findAll({
        where: { tripId: trip.id, status: constants_1.BOOKING_STATUS.CONFIRMED },
        include: [{ model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName'] }],
        order: [['pickupOrder', 'ASC']],
    });
    const waypoints = await routeService_1.default.buildWaypoints(trip);
    const nav = routeService_1.default.buildNavigationLinks(waypoints);
    const out = {
        trip_id: trip.id,
        route_status: trip.routeStatus,
        route_version: trip.routeVersion,
        polyline: trip.routePolyline,
        distance_m: trip.routeDistanceM != null ? Number(trip.routeDistanceM) : null,
        duration_s: trip.routeDurationS != null ? Number(trip.routeDurationS) : null,
        stops: (trip.stops || []).slice().sort((a, b) => a.stopOrder - b.stopOrder).map((s) => ({
            id: s.id,
            stop_order: s.stopOrder,
            stop_name: s.stopName,
            city: s.city,
            lat: s.lat != null ? Number(s.lat) : (s.stopLat != null ? Number(s.stopLat) : null),
            lng: s.lng != null ? Number(s.lng) : (s.stopLng != null ? Number(s.stopLng) : null),
            stop_type: s.stopType,
        })),
        pickups: bookings.map((b) => ({
            booking_id: b.id,
            first_name: b.passenger && b.passenger.fullName ? String(b.passenger.fullName).split(' ')[0] : null,
            seats: b.seatsBooked,
            lat: b.pickupLat != null ? Number(b.pickupLat) : null,
            lng: b.pickupLng != null ? Number(b.pickupLng) : null,
            pickup_order: b.pickupOrder,
            pickup_status: b.pickupStatus,
        })),
        navigation_url: nav.navigation_url,
        navigation_legs: nav.legs,
    };
    if (audited || !isOwner) {
        auditService_1.default.track({ action: 'trip.route_viewed', resourceType: 'trip', resourceId: trip.id, actorId: requesterId, actorType: requesterRole, payload: {} });
    }
    return out;
}
/**
 * Driver marks one booked pickup arrived/picked_up/missed (API8).
 * : picked_up notifies via socket only — the passenger is in the car.
 */
async function setPickupStatus(driverId, tripId, bookingId, status) {
    const trip = await Models_1.Trip.findByPk(tripId, { attributes: ['id', 'driverId'] });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_MANAGE_PICKUPS_ON_YOUR_OWN_TRIPS');
    const booking = await Models_1.Booking.findOne({
        where: { id: bookingId, tripId },
        include: [{ model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName'] }],
    });
    if (!booking)
        throw ApiError_1.ApiErrors.notFound('BOOKING_NOT_FOUND');
    if (booking.status !== constants_1.BOOKING_STATUS.CONFIRMED)
        throw ApiError_1.ApiErrors.conflict('BOOKING_IS_NOT_CONFIRMED');
    const now = new Date();
    const patch = { pickupStatus: status };
    if (status === 'arrived')
        patch.arrivedAt = now;
    if (status === 'picked_up')
        patch.pickedUpAt = now;
    // : missed touches pickup_status ONLY — booking.status stays CONFIRMED
    // so the driver no-show rate (expiry-driven NO_SHOW rows) is never polluted
    // by passenger misses. Passenger-side no-show tracking is out of scope.
    await booking.update(patch);
    try {
        realtimeService_1.default.emitToRoom(`trip:${tripId}`, 'tracking:pickup_status', { trip_id: tripId, booking_id: booking.id, state: status });
    }
    catch (_err) {
        // socket layer offline (e.g. tests) — ignore
    }
    if (booking.passenger && (status === 'arrived' || status === 'missed')) {
        try {
            await notificationService_1.default.sendToUser(booking.passenger, status === 'arrived' ? 'DRIVER_ARRIVED' : 'PICKUP_MISSED', {
                channels: ['in_app', 'push'],
                data: { trip_id: tripId, booking_id: booking.id },
            });
        }
        catch (err) {
            console.warn('[tripService] pickup-status notification failed:', err.message);
        }
    }
    auditService_1.default.track({ action: 'booking.pickup_status', resourceType: 'booking', resourceId: booking.id, actorId: driverId, actorType: 'driver', payload: { trip_id: tripId, pickup_status: status } });
    return { booking_id: booking.id, pickup_status: status };
}
/**
 * Booking-scoped route view (API9): planned route plus MY pickup only, plus
 * the recorded path when available. Participant or staff; staff see the
 * recorded path only on completed trips (same rule as the admin endpoint).
 */
async function getBookingRoute(requesterId, requesterRole, bookingId) {
    const booking = await Models_1.Booking.findByPk(bookingId, { include: [{ model: Models_1.Trip, as: 'trip', include: [{ model: Models_1.TripStop, as: 'stops' }] }] });
    if (!booking || !booking.trip)
        throw ApiError_1.ApiErrors.notFound('BOOKING_NOT_FOUND');
    const trip = booking.trip;
    const isMine = booking.passengerId === requesterId;
    const isOwner = trip.driverId === requesterId;
    const isStaff = ['admin', 'support', 'moderator'].includes(requesterRole);
    if (!isMine && !isOwner && !isStaff)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_YOUR_OWN_BOOKINGS');
    const done = trip.status === constants_1.TRIP_STATUS.COMPLETED;
    return {
        trip_id: trip.id,
        booking_id: booking.id,
        route_status: trip.routeStatus,
        route_version: trip.routeVersion,
        polyline: trip.routePolyline,
        distance_m: trip.routeDistanceM != null ? Number(trip.routeDistanceM) : null,
        duration_s: trip.routeDurationS != null ? Number(trip.routeDurationS) : null,
        my_pickup: {
            lat: booking.pickupLat != null ? Number(booking.pickupLat) : null,
            lng: booking.pickupLng != null ? Number(booking.pickupLng) : null,
            label: booking.pickupLabel || booking.pickupPlace,
            pickup_status: booking.pickupStatus,
        },
        actual_path_polyline: done || isMine || isOwner ? trip.actualPathPolyline : null,
        actual_distance_m: trip.actualDistanceM != null ? Number(trip.actualDistanceM) : null,
        actual_duration_s: trip.actualDurationS != null ? Number(trip.actualDurationS) : null,
    };
}
/**
 * Recorded path view (GET /trips/:id/route/actual + admin actual endpoint).
 * Participants get planned + recorded (null until compacted); staff are
 * refused until completion — no live snooping through the history door.
 */
async function getTripActual(requesterId, requesterRole, tripId) {
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    const isOwner = trip.driverId === requesterId;
    const isStaff = ['admin', 'support', 'moderator'].includes(requesterRole);
    let isPassenger = false;
    if (!isOwner && !isStaff) {
        const mine = await Models_1.Booking.findOne({ where: { tripId, passengerId: requesterId }, attributes: ['id'] });
        isPassenger = !!mine;
        if (!isPassenger)
            throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_ROUTES_ON_YOUR_OWN_TRIPS');
    }
    const done = trip.status === constants_1.TRIP_STATUS.COMPLETED;
    if (isStaff && !done)
        throw ApiError_1.ApiErrors.forbidden('ACTUAL_PATH_AVAILABLE_AFTER_COMPLETION');
    if (isStaff) {
        auditService_1.default.track({ action: 'trip.actual_viewed', resourceType: 'trip', resourceId: trip.id, actorId: requesterId, actorType: requesterRole, payload: {} });
    }
    return {
        trip_id: trip.id,
        route_status: trip.routeStatus,
        polyline: trip.routePolyline,
        actual_path_polyline: trip.actualPathPolyline,
        actual_distance_m: trip.actualDistanceM != null ? Number(trip.actualDistanceM) : null,
        actual_duration_s: trip.actualDurationS != null ? Number(trip.actualDurationS) : null,
        started_at: trip.startedAt,
        completed_at: trip.completedAt,
    };
}
/**
 * Lean passenger list for one of the driver's own trips — shaped for
 * client-side pickers/dropdowns (e.g. rate-a-passenger after completion).
 * Defaults to CONFIRMED + COMPLETED bookings; `status` narrows to one.
 */
async function getTripPassengers(driverId, tripId, filters = {}) {
    const trip = await Models_1.Trip.findByPk(tripId, {
        attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'departureTime', 'status'],
    });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId) {
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_PASSENGERS_ON_YOUR_OWN_TRIPS');
    }
    const status = filters.status || [constants_1.BOOKING_STATUS.CONFIRMED, constants_1.BOOKING_STATUS.COMPLETED];
    const bookings = await Models_1.Booking.findAll({
        where: { tripId: trip.id, status },
        include: [{ model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName', 'avatarUrl', 'avgRating'] }],
        order: [['createdat', 'ASC']],
    });
    return {
        trip_id: trip.id,
        trip_status: trip.status,
        route: `${trip.originCity} - ${trip.destinationCity}`,
        departure_time: trip.departureTime,
        passengers: bookings.map((b) => ({
            booking_id: b.id,
            passenger: b.passenger
                ? {
                    id: b.passenger.id,
                    full_name: b.passenger.fullName,
                    profile_picture_url: b.passenger.avatarUrl,
                    rating: Number(b.passenger.avgRating) || 0,
                }
                : null,
            seats_booked: b.seatsBooked,
            seat_numbers: (0, seatSerializer_1.seatNumbersFor)(b),
            booking_status: b.status,
        })),
    };
}
/**
 * Partial update of a driver's own trip (contract D1). Accepts fare,
 * departure/arrival time, gender preference and instructions. When provided,
 * `attributes` and `stops` replace the existing values. A departure-time
 * change notifies all confirmed passengers (best-effort, never throws).
 */
async function updateTrip(driverId, tripId, data) {
    const trip = await Models_1.Trip.findByPk(tripId, {
        include: [{ model: Models_1.TripAttribute, as: 'attributes' }],
    });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_EDIT_YOUR_OWN_TRIPS');
    if ([constants_1.TRIP_STATUS.COMPLETED, constants_1.TRIP_STATUS.CANCELLED].includes(trip.status)) {
        throw ApiError_1.ApiErrors.custom('TRIP_CANNOT_BE_EDITED_FROM_ITS_CURRENT_STATUS', 422, 'INVALID_TRIP_STATUS');
    }
    const fields = {};
    if (data.fare_per_seat !== undefined) {
        fields.farePerSeat = data.fare_per_seat;
        // Keep the full-occupancy profit in line with the new fare.
        const sellableSeats = await Models_1.TripSeat.count({ where: { tripId: trip.id, wasAvailable: true } });
        fields.totalProfit = Number(data.fare_per_seat) * sellableSeats;
    }
    if (data.arrival_time !== undefined) {
        fields.arrivalTime = data.arrival_time ? (0, time_1.parseTimezoneAware)(data.arrival_time) : null;
    }
    if (data.gender_preference !== undefined)
        fields.genderPreference = data.gender_preference;
    if (data.driver_instructions !== undefined)
        fields.driverInstructions = data.driver_instructions;
    if (data.additional_instructions !== undefined)
        fields.additionalInstructions = data.additional_instructions || null;
    const departureChanged = data.departure_time !== undefined &&
        (0, time_1.parseTimezoneAware)(data.departure_time).getTime() !== new Date(trip.departureTime).getTime();
    if (data.departure_time !== undefined)
        fields.departureTime = (0, time_1.parseTimezoneAware)(data.departure_time);
    // Overlap guard: moving the departure into another active trip's window is refused.
    if (departureChanged) {
        await assertNoOverlappingTrip(driverId, {
            departureTime: (0, time_1.parseTimezoneAware)(data.departure_time),
            isRecurring: trip.isRecurring,
            recurrenceDays: trip.recurrenceDays,
            recurrenceEndDate: trip.recurrenceEndDate,
            excludeTripId: trip.id,
        });
    }
    await trip.update(fields);
    if (data.attributes !== undefined) {
        await Models_1.TripAttribute.destroy({ where: { tripId: trip.id } });
        const records = (data.attributes || []).map((a) => ({
            tripId: trip.id,
            attrKey: a.attr_key,
            attrValue: a.attr_value,
        }));
        if (records.length > 0)
            await Models_1.TripAttribute.bulkCreate(records);
    }
    if (data.stops !== undefined) {
        await Models_1.TripStop.destroy({ where: { tripId: trip.id } });
        const records = (data.stops || []).map((s, i) => ({
            tripId: trip.id,
            stopOrder: s.stop_order !== undefined ? s.stop_order : i + 1,
            stopName: s.city || null,
            city: s.city || null,
            address: s.address || null,
            lat: s.lat || null,
            lng: s.lng || null,
            stopType: s.stop_type || 'both',
            estimatedArrival: s.estimated_arrival ? (0, time_1.parseTimezoneAware)(s.estimated_arrival) : null,
        }));
        if (records.length > 0)
            await Models_1.TripStop.bulkCreate(records);
    }
    let notifiedPassengers = 0;
    if (departureChanged) {
        const departure = new Date(trip.departureTime);
        notifiedPassengers = await notificationService_1.default.notifyConfirmedPassengers([trip.id], 'TRIP_TIME_CHANGED', {
            vars: { time: departure.toISOString() },
            data: { trip_id: trip.id },
        });
        // A departure change updates the time shown on driver/passenger homes.
        await homeService_1.default.invalidateHomeForTrip(trip.id, driverId);
    }
    const attributes = await Models_1.TripAttribute.findAll({ where: { tripId: trip.id } });
    trackTripMutation({
        action: 'trip.updated',
        driverId,
        tripId: trip.id,
        payload: { fields: Object.keys(fields), notified_passengers: notifiedPassengers },
    });
    return {
        trip: {
            id: trip.id,
            origin_city: trip.originCity,
            destination_city: trip.destinationCity,
            departure_time: trip.departureTime,
            fare_per_seat: Number(trip.farePerSeat),
            total_profit: Number(trip.totalProfit) || 0,
            status: trip.status,
            attributes: attributes.map((a) => ({ attr_key: a.attrKey, attr_value: a.attrValue })),
            notified_passengers: notifiedPassengers,
        },
    };
}
/**
 * Cancel a driver's own trip (contract D2). Refused once started. Marks the
 * trip and its bookings cancelled, releases every Redis seat lock for the
 * trip's seats, and notifies confirmed passengers (best-effort).
 */
async function cancelTrip(driverId, tripId) {
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS');
    if ([constants_1.TRIP_STATUS.IN_PROGRESS, constants_1.TRIP_STATUS.ONGOING, constants_1.TRIP_STATUS.COMPLETED].includes(trip.status)) {
        throw ApiError_1.ApiErrors.forbidden('A_TRIP_THAT_HAS_ALREADY_STARTED_CANNOT_BE_CANCELLED');
    }
    if (trip.status === constants_1.TRIP_STATUS.CANCELLED) {
        throw ApiError_1.ApiErrors.custom('TRIP_IS_ALREADY_CANCELLED', 409, 'ALREADY_CANCELLED');
    }
    await trip.update({ status: constants_1.TRIP_STATUS.CANCELLED });
    let notifiedPassengers = 0;
    try {
        notifiedPassengers = await notificationService_1.default.notifyConfirmedPassengers([trip.id], 'TRIP_CANCELLED', { data: { trip_id: trip.id } });
    }
    catch (err) {
        console.warn('[tripService] cancel notification failed:', err.message);
    }
    await Models_1.Booking.update({
        status: constants_1.BOOKING_STATUS.CANCELLED,
        cancellationReason: 'Trip cancelled by driver',
        cancelledBy: driverId,
        cancelledAt: new Date(),
    }, { where: { tripId: trip.id, status: [constants_1.BOOKING_STATUS.CONFIRMED, constants_1.BOOKING_STATUS.PENDING] } });
    const seats = await Models_1.TripSeat.findAll({ where: { tripId: trip.id }, attributes: ['seatNumber'] });
    for (const seat of seats) {
        try {
            await (0, seatLock_1.releaseSeatLock)(trip.id, seat.seatNumber);
        }
        catch (err) {
            console.warn(`[tripService] failed to release seat lock for trip ${trip.id} seat ${seat.seatNumber}:`, err.message);
        }
    }
    // Reflect the cancellation in the cached driver + passenger homes.
    await homeService_1.default.invalidateHomeForTrip(trip.id, driverId);
    trackTripMutation({
        action: 'trip.cancelled',
        driverId,
        tripId: trip.id,
        payload: { status: trip.status, notified_passengers: notifiedPassengers },
    });
    return {
        trip: {
            id: trip.id,
            status: trip.status,
            notified_passengers: notifiedPassengers,
        },
    };
}
/**
 * Get the attribute key/value pairs for a trip (contract D11).
 */
async function getTripAttributes(tripId) {
    const trip = await Models_1.Trip.findByPk(tripId, { attributes: ['id'] });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    const attributes = await Models_1.TripAttribute.findAll({ where: { tripId: trip.id } });
    return {
        trip_id: trip.id,
        attributes: attributes.map((a) => ({ attr_key: a.attrKey, attr_value: a.attrValue })),
    };
}
/**
 * Count the number of trip_cancellation penalties for a driver in the last 30 days.
 */
async function countRecentCancellations(driverId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const count = await Models_1.Penalty.count({
        where: {
            userId: driverId,
            penaltyType: constants_1.PENALTY_CATEGORY.TRIP_CANCELLATION,
            createdat: { [sequelize_1.Op.gte]: thirtyDaysAgo },
        },
    });
    return count;
}
/**
 * Determine the escalation level based on cancellation count.
 * Returns { severity, suspensionDays }.
 */
function getEscalationLevel(cancellationCount) {
    if (cancellationCount >= constants_1.CANCELLATION_ESCALATION.SUSPENSION_30D_MIN) {
        return { severity: constants_1.PENALTY_SEVERITY.MAJOR, suspensionDays: 30 };
    }
    if (cancellationCount >= constants_1.CANCELLATION_ESCALATION.SUSPENSION_7D_MIN) {
        return { severity: constants_1.PENALTY_SEVERITY.MAJOR, suspensionDays: 7 };
    }
    if (cancellationCount >= constants_1.CANCELLATION_ESCALATION.WARNING_MIN) {
        return { severity: constants_1.PENALTY_SEVERITY.MODERATE, suspensionDays: null };
    }
    return { severity: constants_1.PENALTY_SEVERITY.MINOR, suspensionDays: null };
}
/**
 * Apply escalation after a cancellation penalty: check 30-day window count,
 * upgrade penalty severity, and apply suspension if needed.
 */
async function applyEscalation(penalty, driverId) {
    const count = await countRecentCancellations(driverId);
    const { severity, suspensionDays } = getEscalationLevel(count);
    if (severity !== penalty.severity) {
        const update = { severity };
        if (suspensionDays) {
            const endsAt = new Date();
            endsAt.setDate(endsAt.getDate() + suspensionDays);
            update.endsAt = endsAt;
        }
        await penalty.update(update);
    }
    if (suspensionDays) {
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + suspensionDays);
        await Models_1.User.update({ status: 'suspended' }, { where: { id: driverId } });
        const driver = await Models_1.User.findByPk(driverId);
        if (driver) {
            try {
                await notificationService_1.default.sendToUser(driver, 'PENALTY_ISSUED', {
                    channels: ['in_app', 'push'],
                    vars: {
                        severity: `suspension (${suspensionDays} days)`,
                        reason: 'Repeated trip cancellations',
                    },
                    data: { penalty_id: penalty.id },
                });
            }
            catch (err) {
                console.warn('[tripService] penalty notification failed:', err.message);
            }
        }
    }
    else if (severity === constants_1.PENALTY_SEVERITY.MODERATE) {
        const driver = await Models_1.User.findByPk(driverId);
        if (driver) {
            try {
                await notificationService_1.default.sendToUser(driver, 'PENALTY_ISSUED', {
                    channels: ['in_app', 'push'],
                    vars: {
                        severity: 'warning',
                        reason: 'Repeated trip cancellations',
                    },
                    data: { penalty_id: penalty.id },
                });
            }
            catch (err) {
                console.warn('[tripService] penalty notification failed:', err.message);
            }
        }
    }
    return { count, severity, suspensionDays };
}
/**
 * Cancel a trip with penalty (new flow per spec 008).
 * Only allowed when: driver owns trip, status is published/full, zero confirmed bookings.
 * Creates a penalty record and applies escalation logic.
 */
async function cancelTripWithPenalty(driverId, tripId, { reason, note }) {
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS');
    if (![constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL].includes(trip.status)) {
        throw ApiError_1.ApiErrors.conflict('TRIP_IS_ALREADY_ONGOING_OR_COMPLETED_CANNOT_CANCEL');
    }
    if (trip.status === constants_1.TRIP_STATUS.CANCELLED) {
        throw ApiError_1.ApiErrors.custom('TRIP_IS_ALREADY_CANCELLED', 409, 'ALREADY_CANCELLED');
    }
    const confirmedCount = await Models_1.Booking.count({
        where: { tripId: trip.id, status: constants_1.BOOKING_STATUS.CONFIRMED },
    });
    if (confirmedCount > 0) {
        throw ApiError_1.ApiErrors.conflict('CANNOT_CANCEL_TRIP_THERE_ARE_CONFIRMED_BOOKINGS_PLEASE_CONTACT_SUPPORT');
    }
    await trip.update({ status: constants_1.TRIP_STATUS.CANCELLED });
    const penalty = await Models_1.Penalty.create({
        userId: driverId,
        tripId: trip.id,
        type: constants_1.PENALTY_TYPES.WARNING,
        penaltyType: constants_1.PENALTY_CATEGORY.TRIP_CANCELLATION,
        severity: constants_1.PENALTY_SEVERITY.MINOR,
        reason: reason,
        details: note || null,
        startsAt: new Date(),
        issuedBy: driverId,
    });
    const escalation = await applyEscalation(penalty, driverId);
    let notifiedPassengers = 0;
    try {
        notifiedPassengers = await notificationService_1.default.notifyBookedPassengers([trip.id], 'TRIP_CANCELLED', { data: { trip_id: trip.id } });
    }
    catch (err) {
        console.warn('[tripService] cancel notification failed:', err.message);
    }
    await homeService_1.default.invalidateHomeForTrip(trip.id, driverId);
    trackTripMutation({
        action: 'trip.cancelled_by_driver',
        driverId,
        tripId: trip.id,
        payload: {
            status: trip.status,
            reason,
            note,
            penalty_id: penalty.id,
            escalation_count: escalation.count,
            escalation_severity: escalation.severity,
            notified_passengers: notifiedPassengers,
        },
    });
    return {
        message: 'TRIP_CANCELLED_SUCCESSFULLY',
        trip_id: trip.id,
        status: trip.status,
        penalty_id: penalty.id,
        penalty_type: escalation.severity,
    };
}
exports.default = module.exports;
//# sourceMappingURL=tripService.js.map