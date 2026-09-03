"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, Trip, RideRequest, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const DRIVER_ID = 'f7000000-0000-4000-8000-000000000001';
const OWNER_ID = 'f7000000-0000-4000-8000-000000000002';
const OTHER_PASSENGER_ID = 'f7000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'f7000000-0000-4000-8000-000000000010';
let driverToken;
let ownerToken;
let otherPassengerToken;
let tripId;
function futureAt(hour) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
}
beforeEach(async () => {
    await RideRequest.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, OWNER_ID, OTHER_PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Match Driver', phone: '+962795559050',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
        avgRating: 4.8,
    });
    await User.create({
        id: OWNER_ID, fullName: 'Match Owner', phone: '+962795559051',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await User.create({
        id: OTHER_PASSENGER_ID, fullName: 'Match Other', phone: '+962795559052',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'MCH-101', color: 'White', seats: 4, isVerified: true,
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
    ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
    otherPassengerToken = generateAccessToken({ id: OTHER_PASSENGER_ID, role: 'passenger' });
    const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: futureAt(14).split('T')[0],
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
            { seat_number: 1, type: 'driver' },
            { seat_number: 2, type: 'available' },
            { seat_number: 3, type: 'available' },
            { seat_number: 4, type: 'unavailable' },
        ],
    });
    expect(res.status).toBe(201);
    tripId = res.body.trip_id;
});
describe('US6 - ride request match suggestions', () => {
    let requestId;
    beforeEach(async () => {
        const res = await getAgent()
            .post('/api/ride-requests')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
            origin_city: 'Amman',
            destination_city: 'Irbid',
            origin_time: futureAt(14),
            seats_needed: 1,
        });
        expect(res.status).toBe(201);
        requestId = res.body.ride_request.id;
    });
    it('returns ranked matches for the request owner', async () => {
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}/matches`)
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.ride_request_id).toBe(requestId);
        expect(Array.isArray(res.body.matches)).toBe(true);
        expect(res.body.matches.length).toBeGreaterThan(0);
        const match = res.body.matches[0];
        expect(match.score_rank).toBe(1);
        expect(match.trip_id).toBe(tripId);
        expect(match.origin.city).toBe('Amman');
        expect(match.destination.city).toBe('Irbid');
        expect(match.fare_per_seat).toBe(15);
        expect(match.available_seats).toBe(2);
        expect(match.driver.full_name).toBe('Match Driver');
    });
    it('forbids a non-owner from viewing matches', async () => {
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}/matches`)
            .set('Authorization', `Bearer ${otherPassengerToken}`);
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS');
    });
    it('does not create or modify any ride request', async () => {
        const before = await RideRequest.count();
        await getAgent()
            .get(`/api/ride-requests/${requestId}/matches`)
            .set('Authorization', `Bearer ${ownerToken}`);
        const after = await RideRequest.count();
        expect(after).toBe(before);
    });
});
//# sourceMappingURL=rideRequestMatches.test.js.map