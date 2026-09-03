"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, SubscriptionPlan, DriverSubscription, Booking } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { TRIP_STATUS, SUBSCRIPTION_STATUS, BOOKING_STATUS } = require('../../config/constants');
const DRIVER_ID = '3c3b7a4e-1111-4d5e-9f0a-2b3c4d5e6f71';
const PASSENGER_ID = '3c3b7a4e-1111-4d5e-9f0a-2b3c4d5e6f72';
const VEHICLE_ID = '3c3b7a4e-1111-4d5e-9f0a-2b3c4d5e6f70';
let driverToken;
function getStartableDeparture() {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { date, time };
}
async function seedSubscription({ percentageCut = 8, balance = 100 } = {}) {
    const plan = await SubscriptionPlan.create({
        name: 'Basic',
        periodDays: 30,
        percentageCut,
        cost: 100,
        features: [],
        isFree: false,
        isActive: true,
    });
    const sub = await DriverSubscription.create({
        driverId: DRIVER_ID,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE,
        approvedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: balance, isInDebt: balance < 0 }, { where: { id: DRIVER_ID } });
    return sub;
}
const VALID_BODY = {
    origin_city: 'Amman',
    destination_city: 'Irbid',
    departure_date: getStartableDeparture().date,
    departure_time: getStartableDeparture().time,
    type_of_trip: 'once',
    fare_per_seat: '15.00',
    seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
    ],
};
async function createTrip() {
    const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(VALID_BODY);
    return res.body.trip_id;
}
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Commission Driver',
        phone: '+962795555551',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Commission Passenger',
        phone: '+962795555552',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'COM-123',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
describe('Contract: POST /api/trips gating', () => {
    it('returns 422 NO_ACTIVE_PLAN when driver has no active plan', async () => {
        const res = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send(VALID_BODY);
        expect(res.status).toBe(422);
        expect(res.body.code).toBe('NO_ACTIVE_PLAN');
        expect(typeof res.body.message).toBe('string');
    });
    it('returns 422 INSUFFICIENT_BALANCE with required + current amounts', async () => {
        await seedSubscription({ percentageCut: 10, balance: 0.5 });
        const res = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send(VALID_BODY);
        expect(res.status).toBe(422);
        expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
        expect(res.body.message).toMatch(/1\.50/i);
        expect(res.body.message).toMatch(/0\.50/i);
    });
    it('returns 201 when balance is sufficient', async () => {
        await seedSubscription({ percentageCut: 8, balance: 100 });
        const res = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send(VALID_BODY);
        expect(res.status).toBe(201);
        expect(res.body.status).toBe(TRIP_STATUS.PUBLISHED);
    });
});
describe('Contract: POST /api/trips/:trip_id/start', () => {
    it('returns 422 INSUFFICIENT_BALANCE shape on start', async () => {
        const sub = await seedSubscription({ percentageCut: 10, balance: 100 });
        const tripId = await createTrip();
        await DriverSubscription.update({ balance: 0.1 }, { where: { id: sub.id } });
        await User.update({ totalBalance: 0.1 }, { where: { id: DRIVER_ID } });
        const res = await getAgent()
            .post(`/api/trips/${tripId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(422);
        expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
        expect(typeof res.body.message).toBe('string');
    });
    it('returns 200 and marks trip in_progress', async () => {
        await seedSubscription({ percentageCut: 8, balance: 100 });
        const tripId = await createTrip();
        const res = await getAgent()
            .post(`/api/trips/${tripId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.trip_id).toBe(tripId);
        expect(res.body.status).toBe(TRIP_STATUS.IN_PROGRESS);
        expect(typeof res.body.message).toBe('string');
    });
});
describe('Contract: POST /api/trips/:trip_id/complete', () => {
    it('returns 200 with commission/balance shape', async () => {
        await seedSubscription({ percentageCut: 10, balance: 100 });
        const tripId = await createTrip();
        await getAgent()
            .post(`/api/trips/${tripId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        await Booking.create({
            tripId,
            passengerId: PASSENGER_ID,
            seatNumber: 2,
            seatsBooked: 1,
            agreedFare: 20,
            referenceCode: `C${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1e6).toString(36)}`,
            status: BOOKING_STATUS.CONFIRMED,
        });
        const res = await getAgent()
            .post(`/api/trips/${tripId}/complete`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.trip_id).toBe(tripId);
        expect(typeof res.body.commission).toBe('number');
        expect(res.body.commission).toBe(2);
        expect(typeof res.body.plan_name).toBe('string');
        expect(typeof res.body.balance_after).toBe('number');
        expect(typeof res.body.is_in_debt).toBe('boolean');
    });
});
//# sourceMappingURL=commission.contract.test.js.map