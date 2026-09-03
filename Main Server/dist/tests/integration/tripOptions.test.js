"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, Trip, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const DRIVER_ID = 'd2000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'd2000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'd2000000-0000-4000-8000-000000000010';
let driverToken;
let passengerToken;
let tripId;
function getFutureDate(daysAhead = 1) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}
beforeEach(async () => {
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Options Driver', phone: '+962795559001',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'Options Passenger', phone: '+962795559002',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'OPT-101', color: 'White', seats: 4, isVerified: true,
    });
    const plan = await SubscriptionPlan.create({
        name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
        features: [], isFree: false, isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID, planId: plan.id, planName: plan.name, planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut, planCost: plan.cost, balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
            { seat_number: 1, type: 'driver' },
            { seat_number: 2, type: 'available' },
            { seat_number: 3, type: 'available' },
            { seat_number: 4, type: 'unavailable' },
        ],
        waypoints: [{ stop_name: 'Khalda' }, { stop_name: 'Salt Street' }],
    });
    expect(res.status).toBe(201);
    tripId = res.body.trip_id;
});
describe('GET /api/trips/:trip_id/options', () => {
    it('returns trip_id, available_seats and ordered drop_off_points', async () => {
        const res = await getAgent()
            .get(`/api/trips/${tripId}/options`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.trip_id).toBe(tripId);
        expect(typeof res.body.available_seats).toBe('number');
        expect(res.body.available_seats).toBe(2);
        expect(Array.isArray(res.body.drop_off_points)).toBe(true);
        expect(res.body.drop_off_points.length).toBe(2);
        const orders = res.body.drop_off_points.map((p) => p.stop_order);
        expect([...orders].sort((a, b) => a - b)).toEqual(orders);
        expect(res.body.drop_off_points[0].stop_name).toBeDefined();
    });
    it('returns 404 for an unknown trip', async () => {
        const res = await getAgent()
            .get('/api/trips/d2000000-0000-4000-8000-000000000099/options')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(404);
    });
});
//# sourceMappingURL=tripOptions.test.js.map