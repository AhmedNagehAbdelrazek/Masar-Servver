"use strict";
const { getAgent } = require('../setup/setup');
const { User, DriverProfile, Vehicle, Trip, TripSeat, Booking, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { TRIP_STATUS, SUBSCRIPTION_STATUS, BOOKING_STATUS, } = require('../../config/constants');
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440f01';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440f02';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440f03';
let driverToken;
let passengerToken;
function future(minutesFromNow) {
    return new Date(Date.now() + minutesFromNow * 60 * 1000);
}
async function seedHome() {
    const plan = await SubscriptionPlan.create({
        name: 'Pro',
        periodDays: 30,
        percentageCut: 8,
        cost: 16,
        features: [],
        isFree: false,
        isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance: 12.4,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE,
        approvedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 12.4, isInDebt: false }, { where: { id: DRIVER_ID } });
    const trip = await Trip.create({
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        originArea: 'Abdoun',
        destinationCity: 'Irbid',
        destinationArea: 'Downtown',
        departureTime: future(30),
        totalSeats: 4,
        availableSeats: 1,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status: TRIP_STATUS.PUBLISHED,
    });
    await TripSeat.bulkCreate([
        { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
        { tripId: trip.id, seatNumber: 2, seatType: 'available' },
    ]);
    await Booking.create({
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        referenceCode: 'HOME-CON-01',
        status: BOOKING_STATUS.CONFIRMED,
    });
    return trip;
}
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Driver One',
        phone: '+962710000201',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 4.5,
    });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Passenger One',
        phone: '+962710000202',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await DriverProfile.create({ driverId: DRIVER_ID, totalTrips: 10 });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Hyundai',
        model: 'Elantra',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: 'ABC-1234',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});
describe('Contract: GET /api/driver/home', () => {
    it('returns 200 with driver/subscription/next_trip/summary/recent_bookings shape', async () => {
        await seedHome();
        const res = await getAgent()
            .get('/api/driver/home')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        // driver
        expect(typeof res.body.driver.id).toBe('string');
        expect(typeof res.body.driver.full_name).toBe('string');
        expect('profile_picture_url' in res.body.driver).toBe(true);
        expect(typeof res.body.driver.rating).toBe('number');
        expect(typeof res.body.driver.total_trips_completed).toBe('number');
        // subscription
        expect(typeof res.body.subscription.tier).toBe('string');
        expect(typeof res.body.subscription.price).toBe('number');
        expect(res.body.subscription.currency).toBe('JOD');
        expect(typeof res.body.subscription.days_remaining).toBe('number');
        expect('free_trips' in res.body.subscription).toBe(true);
        expect(res.body.subscription.free_trips).toBeNull();
        // next_trip
        expect(res.body.next_trip).not.toBeNull();
        expect(typeof res.body.next_trip.trip_id).toBe('string');
        expect(typeof res.body.next_trip.origin_city).toBe('string');
        expect(typeof res.body.next_trip.destination_city).toBe('string');
        expect(typeof res.body.next_trip.departure_time).toBe('string');
        expect(typeof res.body.next_trip.fare_per_seat).toBe('number');
        expect(typeof res.body.next_trip.total_seats).toBe('number');
        expect(typeof res.body.next_trip.available_seats).toBe('number');
        expect(typeof res.body.next_trip.booked_seats_count).toBe('number');
        expect(res.body.next_trip.vehicle).toBeDefined();
        expect(typeof res.body.next_trip.vehicle.make_model).toBe('string');
        expect(res.body.next_trip.can_start).toBe(true);
        expect(Array.isArray(res.body.next_trip.passengers)).toBe(true);
        expect(res.body.next_trip.passengers.length).toBe(1);
        expect(typeof res.body.next_trip.passengers[0].booking_id).toBe('string');
        expect(typeof res.body.next_trip.passengers[0].passenger_name).toBe('string');
        expect(res.body.next_trip.passengers[0].seat_numbers).toEqual([2]);
        // summary
        expect(typeof res.body.summary.completed_trips_today).toBe('number');
        expect(typeof res.body.summary.reserved_seats_for_next_trip).toBe('number');
        expect(res.body.summary.reserved_seats_for_next_trip).toBe(1);
        expect(typeof res.body.summary.trips_today).toBe('number');
        // recent_bookings
        expect(Array.isArray(res.body.recent_bookings)).toBe(true);
        expect(res.body.recent_bookings.length).toBe(1);
        const booking = res.body.recent_bookings[0];
        expect(typeof booking.booking_id).toBe('string');
        expect(booking.trip).toBeDefined();
        expect(typeof booking.trip.trip_id).toBe('string');
        expect(typeof booking.passenger_name).toBe('string');
        expect(typeof booking.seats_booked).toBe('number');
        expect(Array.isArray(booking.seat_numbers)).toBe(true);
        expect(booking.seat_numbers).toEqual([2]);
        expect(typeof booking.agreed_fare).toBe('number');
        expect(typeof booking.status).toBe('string');
        expect(typeof booking.created_at).toBe('string');
    });
    it('returns empty states: next_trip null, recent_bookings [], free subscription', async () => {
        const res = await getAgent()
            .get('/api/driver/home')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.next_trip).toBeNull();
        expect(res.body.recent_bookings).toEqual([]);
        expect(res.body.subscription.tier).toBe('free');
        expect(res.body.subscription.price).toBe(0);
        expect(res.body.subscription.currency).toBe('JOD');
        expect(res.body.subscription.expires_at).toBeNull();
        expect(res.body.subscription.days_remaining).toBe(0);
        expect(res.body.subscription.free_trips).toBeNull();
        expect(res.body.summary.reserved_seats_for_next_trip).toBe(0);
    });
    it('returns 401 without auth token', async () => {
        const res = await getAgent().get('/api/driver/home');
        expect(res.status).toBe(401);
    });
    it('returns 403 for passenger role', async () => {
        const res = await getAgent()
            .get('/api/driver/home')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
    });
});
//# sourceMappingURL=homeScreen.contract.test.js.map