"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, Booking, Penalty, Notification, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { TRIP_STATUS, BOOKING_STATUS, SUBSCRIPTION_STATUS, PENALTY_CATEGORY, PENALTY_SEVERITY } = require('../../config/constants');
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c01';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440c02';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440c10';
let driverToken;
let passengerToken;
async function seedTripWithNoBookings(status = 'published') {
    return Trip.create({
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Aqaba',
        departureTime: new Date(Date.now() + 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 4,
        farePerSeat: 10,
        isRecurring: false,
        genderPreference: 'all',
        status,
    });
}
beforeEach(async () => {
    await Penalty.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Cancel Test Driver',
        phone: '+962710000c01',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Cancel Test Passenger',
        phone: '+962710000c02',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'CANCEL-1',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
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
        driverId: DRIVER_ID,
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});
describe('US2 - Trip cancellation with penalty', () => {
    it('cancels a trip with no bookings and creates a penalty', async () => {
        const trip = await seedTripWithNoBookings();
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/cancel`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ reason: 'Personal emergency', note: 'Will resume tomorrow' });
        expect(res.status).toBe(200);
        expect(res.body.trip_id).toBe(trip.id);
        expect(res.body.penalty_id).toBeDefined();
        const tripAfter = await Trip.findByPk(trip.id);
        expect(tripAfter.status).toBe(TRIP_STATUS.CANCELLED);
        const penalty = await Penalty.findByPk(res.body.penalty_id);
        expect(penalty).toBeDefined();
        expect(penalty.penaltyType).toBe(PENALTY_CATEGORY.TRIP_CANCELLATION);
    });
    it('rejects cancellation when confirmed bookings exist', async () => {
        const trip = await seedTripWithNoBookings();
        await Booking.create({
            tripId: trip.id,
            passengerId: PASSENGER_ID,
            seatNumber: 1,
            seatsBooked: 1,
            agreedFare: 10,
            referenceCode: 'CN-001',
            status: BOOKING_STATUS.CONFIRMED,
        });
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/cancel`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ reason: 'Changed my mind' });
        expect(res.status).toBe(409);
    });
    it('rejects cancellation of an already in-progress trip', async () => {
        const trip = await seedTripWithNoBookings(TRIP_STATUS.IN_PROGRESS);
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/cancel`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ reason: 'Engine trouble' });
        expect(res.status).toBe(409);
    });
    it('rejects non-owner cancellation', async () => {
        const trip = await seedTripWithNoBookings();
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/cancel`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ reason: 'Haha no' });
        expect(res.status).toBe(403);
    });
    it('rejects missing reason', async () => {
        const trip = await seedTripWithNoBookings();
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/cancel`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({});
        expect(res.status).toBe(422);
    });
    it('escalates severity after multiple cancellations', async () => {
        // Create 3 previous penalties
        for (let i = 0; i < 3; i++) {
            await Penalty.create({
                userId: DRIVER_ID,
                tripId: null,
                type: 'warning',
                penaltyType: PENALTY_CATEGORY.TRIP_CANCELLATION,
                severity: PENALTY_SEVERITY.MINOR,
                reason: `Previous cancel ${i}`,
                issuedBy: DRIVER_ID,
            });
        }
        const trip = await seedTripWithNoBookings();
        const res = await getAgent()
            .post(`/api/trips/${trip.id}/cancel`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ reason: 'Fourth cancellation' });
        expect(res.status).toBe(200);
        const penalty = await Penalty.findByPk(res.body.penalty_id);
        expect(penalty.severity).toBe(PENALTY_SEVERITY.MODERATE);
    });
});
//# sourceMappingURL=tripCancellation.test.js.map