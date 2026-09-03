"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
let driverToken;
let passengerToken;
async function seed() {
    const plan = await SubscriptionPlan.create({
        name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
        features: [], isFree: false, isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID, planId: plan.id, planName: plan.name,
        planPeriodDays: plan.periodDays, planPercentageCut: plan.percentageCut,
        planCost: plan.cost, balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
}
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Contract Driver', phone: '+962798888888',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true, avgRating: 0,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'Contract Passenger', phone: '+962798888889',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true, avgRating: 0,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'CTR-1001', color: 'White', seats: 4, isVerified: true,
    });
    await seed();
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});
const VALID_TRIP_BODY = {
    origin_city: 'Amman', origin_area: 'Abdoun', origin_lat: '31.9500', origin_lng: '35.9100',
    destination_city: 'Irbid', destination_area: 'Downtown', destination_lat: '32.5500', destination_lng: '35.8500',
    departure_date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
    departure_time: '14:00', type_of_trip: 'once', fare_per_seat: '15.50',
    seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
    ],
    instructions: ['No smoking please'],
    additional_instructions: 'Bring water',
    waypoints: [{ stop_name: 'Khalda', stop_lat: '31.9600', stop_lng: '35.9000' }],
};
function makeRef() {
    return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}
async function createBooking() {
    const tripRes = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(VALID_TRIP_BODY);
    return Booking.create({
        tripId: tripRes.body.trip_id, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 15.5, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
    });
}
describe('US3 Contract - Ratings', () => {
    it('POST /api/ratings returns rating envelope', async () => {
        const booking = await createBooking();
        const res = await getAgent()
            .post('/api/ratings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ booking_id: booking.id, stars: 5, was_late: false, late_minutes: 0 });
        expect(res.status).toBe(200);
        expect(res.body.rating.id).toBeDefined();
        expect(res.body.rating.booking_id).toBe(booking.id);
        expect(res.body.rating.stars).toBe(5);
        expect(res.body.rating.was_late).toBe(false);
        expect(res.body.rating.late_minutes).toBe(0);
        expect(res.body.rating.created_at).toBeDefined();
        expect(res.body.already_rated).toBe(false);
    });
    it('idempotent repeat returns already_rated true', async () => {
        const booking = await createBooking();
        await getAgent()
            .post('/api/ratings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ booking_id: booking.id, stars: 4 });
        const res = await getAgent()
            .post('/api/ratings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ booking_id: booking.id, stars: 2 });
        expect(res.status).toBe(200);
        expect(res.body.already_rated).toBe(true);
        expect(res.body.rating.stars).toBe(4);
    });
    it('GET /api/driver/ratings returns paginated received list', async () => {
        const booking = await createBooking();
        await getAgent()
            .post('/api/ratings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ booking_id: booking.id, stars: 5 });
        const res = await getAgent()
            .get('/api/driver/ratings')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].rater_name).toBe('Contract Passenger');
        expect(res.body.data[0].booking_id).toBe(booking.id);
        expect(res.body.pagination.total_pages).toBe(1);
    });
});
//# sourceMappingURL=ratings.contract.test.js.map