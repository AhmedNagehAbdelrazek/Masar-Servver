"use strict";
const { getAgent, getRedisStore } = require('../setup/setup');
const { User, DriverProfile, Vehicle, Trip, TripSeat, Booking, Notification, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { TRIP_STATUS, SUBSCRIPTION_STATUS, BOOKING_STATUS, } = require('../../config/constants');
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e61';
const DRIVER2_ID = '550e8400-e29b-41d4-a716-446655440e62';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440e63';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440e70';
const VEHICLE2_ID = '550e8400-e29b-41d4-a716-446655440e71';
let driverToken;
let driver2Token;
function future(minutesFromNow) {
    return new Date(Date.now() + minutesFromNow * 60 * 1000);
}
async function seedDriver(userId, vehicleId, phone) {
    await User.create({
        id: userId,
        fullName: `Driver ${userId.slice(-2)}`,
        phone,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await DriverProfile.create({ driverId: userId });
    await Vehicle.create({
        id: vehicleId,
        driverId: userId,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: `STRT-${vehicleId.slice(-4)}`,
        color: 'White',
        seats: 4,
        isVerified: true,
    });
}
async function seedActiveSubscription(userId) {
    const plan = await SubscriptionPlan.create({
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 100,
        features: [],
        isFree: false,
        isActive: true,
    });
    await DriverSubscription.create({
        driverId: userId,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE,
        approvedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: userId } });
}
async function seedTrip(departureTime, { status = TRIP_STATUS.PUBLISHED, confirmPassenger = true } = {}) {
    const trip = await Trip.create({
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime,
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status,
    });
    await TripSeat.bulkCreate([
        { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
        { tripId: trip.id, seatNumber: 2, seatType: 'available' },
    ]);
    if (confirmPassenger) {
        await Booking.create({
            tripId: trip.id,
            passengerId: PASSENGER_ID,
            seatNumber: 2,
            seatsBooked: 1,
            agreedFare: 5,
            referenceCode: 'STRT-INT-01',
            status: BOOKING_STATUS.CONFIRMED,
        });
    }
    return trip;
}
beforeEach(async () => {
    await Notification.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: { id: [VEHICLE_ID, VEHICLE2_ID] }, force: true });
    await DriverProfile.destroy({ where: { driverId: [DRIVER_ID, DRIVER2_ID] }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, DRIVER2_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Passenger One',
        phone: '+962710000363',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await seedDriver(DRIVER_ID, VEHICLE_ID, '+962710000361');
    await seedDriver(DRIVER2_ID, VEHICLE2_ID, '+962710000362');
    await seedActiveSubscription(DRIVER_ID);
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    driver2Token = generateAccessToken({ id: DRIVER2_ID, role: 'driver' });
});
describe('US2 - Start trip window and notifications', () => {
    it('starts within the window, emits a TRIP_STARTED notification, and returns a tracking link', async () => {
        const trip = await seedTrip(future(30));
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe(TRIP_STATUS.IN_PROGRESS);
        expect(res.body.tracking_link).toContain(`trip=${trip.id}`);
        const dbTrip = await Trip.findByPk(trip.id);
        expect(dbTrip.status).toBe(TRIP_STATUS.IN_PROGRESS);
        const notifications = await Notification.findAll({
            where: { userId: PASSENGER_ID, type: 'TRIP_STARTED' },
        });
        expect(notifications.length).toBe(1);
    });
    it('rejects starting more than one hour before departure with 400 TOO_EARLY_TO_START', async () => {
        const trip = await seedTrip(future(120));
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('TOO_EARLY_TO_START');
        const dbTrip = await Trip.findByPk(trip.id);
        expect(dbTrip.status).toBe(TRIP_STATUS.PUBLISHED);
    });
    it('allows starting an overdue but not-started trip', async () => {
        const trip = await seedTrip(future(-30));
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe(TRIP_STATUS.IN_PROGRESS);
    });
    it('rejects a second start with 422 INVALID_TRIP_STATUS', async () => {
        const trip = await seedTrip(future(30));
        const first = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(first.status).toBe(200);
        const second = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(second.status).toBe(422);
        expect(second.body.code).toBe('INVALID_TRIP_STATUS');
    });
    it('invalidates the driver home cache on a successful start', async () => {
        const trip = await seedTrip(future(30));
        await getAgent()
            .get('/api/driver/home')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(getRedisStore().get(`driver_home:${DRIVER_ID}`)).toBeDefined();
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(getRedisStore().get(`driver_home:${DRIVER_ID}`)).toBeUndefined();
    });
    it('returns 403 when a different driver tries to start the trip', async () => {
        const trip = await seedTrip(future(30));
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/start`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(res.status).toBe(403);
    });
});
//# sourceMappingURL=tripStartWindow.test.js.map