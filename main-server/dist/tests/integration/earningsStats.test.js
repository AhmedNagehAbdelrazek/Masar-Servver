"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { BOOKING_STATUS, TRIP_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_PHONE = '+962791111111';
const OTHER_DRIVER_PHONE = '+962793333333';
const PASSENGER_PHONE = '+962792222222';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440003';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const OTHER_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440011';
let driverToken;
async function seedActiveSubscription(driverId) {
    const plan = await SubscriptionPlan.create({
        name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
        features: [], isFree: false, isActive: true,
    });
    await DriverSubscription.create({
        driverId, planId: plan.id, planName: plan.name,
        planPeriodDays: plan.periodDays, planPercentageCut: plan.percentageCut,
        planCost: plan.cost, balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: driverId } });
}
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: [DRIVER_ID, OTHER_DRIVER_ID] }, force: true });
    await Vehicle.destroy({ where: { driverId: [DRIVER_ID, OTHER_DRIVER_ID] }, force: true });
    await User.destroy({ where: { phone: [DRIVER_PHONE, OTHER_DRIVER_PHONE, PASSENGER_PHONE] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Test Driver', phone: DRIVER_PHONE,
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true, avgRating: 4.8,
    });
    await User.create({
        id: OTHER_DRIVER_ID, fullName: 'Other Driver', phone: OTHER_DRIVER_PHONE,
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true, avgRating: 3,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'Lina Haddad', phone: PASSENGER_PHONE,
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'TEST-123', color: 'White', seats: 4, isVerified: true,
    });
    await Vehicle.create({
        id: OTHER_VEHICLE_ID, driverId: OTHER_DRIVER_ID, manufacturer: 'Hyundai', model: 'Elantra',
        vehicleType: 'sedan', modelYear: 2022, plateNumber: 'TEST-456', color: 'Black', seats: 4, isVerified: true,
    });
    await seedActiveSubscription(DRIVER_ID);
    await seedActiveSubscription(OTHER_DRIVER_ID);
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
function makeRef() {
    return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}
async function seedTrip(driverId, status = TRIP_STATUS.COMPLETED) {
    return Trip.create({
        driverId,
        vehicleId: driverId === DRIVER_ID ? VEHICLE_ID : OTHER_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 10,
        status,
    });
}
async function seedBooking(tripId, status, fare, createdAt = new Date()) {
    return Booking.create({
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: fare,
        status,
        referenceCode: makeRef(),
        createdAt,
    });
}
describe('US7 - Earnings & Stats', () => {
    describe('GET /api/driver/earnings', () => {
        it('should return zeros for a new driver with no activity', async () => {
            await User.update({ avgRating: 0 }, { where: { id: DRIVER_ID } });
            const res = await getAgent()
                .get('/api/driver/earnings')
                .query({ period: 'week' })
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(200);
            expect(res.body.period).toBe('week');
            expect(res.body.currency).toBe('JOD');
            expect(res.body.total).toBe(0);
            expect(res.body.breakdown).toEqual([]);
        });
        it('should aggregate earnings from completed bookings on own trips only', async () => {
            const trip = await seedTrip(DRIVER_ID);
            await seedBooking(trip.id, BOOKING_STATUS.COMPLETED, 85);
            await seedBooking(trip.id, BOOKING_STATUS.COMPLETED, 85);
            const otherTrip = await seedTrip(OTHER_DRIVER_ID);
            await seedBooking(otherTrip.id, BOOKING_STATUS.COMPLETED, 999);
            const res = await getAgent()
                .get('/api/driver/earnings')
                .query({ period: 'month' })
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(200);
            expect(res.body.total).toBe(170);
            expect(res.body.breakdown.length).toBe(1);
            expect(res.body.breakdown[0].earnings).toBe(170);
            expect(res.body.breakdown[0].trips).toBe(1);
        });
        it('should exclude non-completed bookings', async () => {
            const trip = await seedTrip(DRIVER_ID);
            await seedBooking(trip.id, BOOKING_STATUS.COMPLETED, 50);
            await seedBooking(trip.id, BOOKING_STATUS.CANCELLED, 200);
            const res = await getAgent()
                .get('/api/driver/earnings')
                .query({ period: 'month' })
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(200);
            expect(res.body.total).toBe(50);
        });
    });
    describe('GET /api/driver/stats', () => {
        it('should return zeros for a new driver', async () => {
            await User.update({ avgRating: 0 }, { where: { id: DRIVER_ID } });
            const res = await getAgent()
                .get('/api/driver/stats')
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(200);
            expect(res.body.stats.total_trips).toBe(0);
            expect(res.body.stats.total_bookings).toBe(0);
            expect(res.body.stats.no_show_rate).toBe(0);
            expect(res.body.stats.avg_rating).toBe(0);
            expect(res.body.stats.total_earnings).toBe(0);
        });
        it('should reflect completed/cancelled trips and no-show rate', async () => {
            await DriverProfile.create({
                driverId: DRIVER_ID,
                responseRate: 98,
                idVerified: true,
            });
            const completed = await seedTrip(DRIVER_ID, TRIP_STATUS.COMPLETED);
            await seedBooking(completed.id, BOOKING_STATUS.COMPLETED, 85);
            await seedBooking(completed.id, BOOKING_STATUS.NO_SHOW, 85);
            await seedTrip(DRIVER_ID, TRIP_STATUS.CANCELLED);
            await seedTrip(DRIVER_ID, TRIP_STATUS.PUBLISHED);
            const res = await getAgent()
                .get('/api/driver/stats')
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(200);
            expect(res.body.stats.total_trips).toBe(3);
            expect(res.body.stats.completed_trips).toBe(1);
            expect(res.body.stats.cancelled_trips).toBe(1);
            expect(res.body.stats.total_bookings).toBe(2);
            expect(res.body.stats.no_show_rate).toBe(50);
            expect(res.body.stats.response_rate).toBe(98);
            expect(res.body.stats.avg_rating).toBe(4.8);
            expect(res.body.stats.total_earnings).toBe(85);
        });
    });
});
//# sourceMappingURL=earningsStats.test.js.map