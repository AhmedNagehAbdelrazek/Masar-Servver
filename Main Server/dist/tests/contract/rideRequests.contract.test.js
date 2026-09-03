"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, DriverSubscription, SubscriptionPlan } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const PASSENGER_ID = 'e3000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'e3000000-0000-4000-8000-000000000002';
const PASSENGER_PHONE = '+962797311111';
const DRIVER_PHONE = '+962797322222';
const VEHICLE_ID = 'e3000000-0000-4000-8000-000000000010';
let passengerToken;
let driverToken;
beforeEach(async () => {
    await User.destroy({ where: { phone: [PASSENGER_PHONE, DRIVER_PHONE] }, force: true });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Contract Rider',
        phone: PASSENGER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Contract Offer Driver',
        phone: DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await SubscriptionPlan.findOrCreate({
        where: { name: 'Free' },
        defaults: {
            name: 'Free',
            periodDays: 30,
            percentageCut: 10,
            cost: 0,
            features: [],
            isFree: true,
            isActive: true,
        },
    }).catch(() => { });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
async function createRequest(overrides = {}) {
    const res = await getAgent()
        .post('/api/ride-requests')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Zarqa',
        max_budget: 15,
        ...overrides,
    });
    expect(res.status).toBe(201);
    return res.body.ride_request.id;
}
describe('US4 Contract - Ride Request Board', () => {
    it('POST /api/ride-requests returns ride_request envelope with snake_case fields', async () => {
        const res = await getAgent()
            .post('/api/ride-requests')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ origin_city: 'Amman', destination_city: 'Irbid', seats_needed: 1 });
        expect(res.status).toBe(201);
        const r = res.body.ride_request;
        expect(r.id).toBeDefined();
        expect(r.origin_city).toBe('Amman');
        expect(r.destination_city).toBe('Irbid');
        expect(r.seats_needed).toBe(1);
        expect(r.status).toBe('open');
        expect(r.expires_at).toBeDefined();
        expect(r.currency).toBe('JOD');
    });
    it('GET /api/ride-requests returns data + pagination envelope for drivers', async () => {
        await createRequest();
        const res = await getAgent()
            .get('/api/ride-requests')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.data[0]).toMatchObject({
            origin_city: 'Amman',
            destination_city: 'Zarqa',
            status: 'open',
        });
    });
    it('GET /api/ride-requests/:request_id returns ride_request envelope', async () => {
        const requestId = await createRequest();
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.ride_request.id).toBe(requestId);
        expect(Array.isArray(res.body.ride_request.offers)).toBe(true);
    });
    it('PUT /api/ride-requests/:request_id supports field edits and cancel action', async () => {
        const requestId = await createRequest();
        const edit = await getAgent()
            .put(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ max_budget: 25 });
        expect(edit.status).toBe(200);
        expect(Number(edit.body.ride_request.max_budget)).toBe(25);
        const cancel = await getAgent()
            .put(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ action: 'cancel' });
        expect(cancel.status).toBe(200);
        expect(cancel.body.ride_request.status).toBe('cancelled');
    });
});
describe('US5 Contract - Offer Lifecycle', () => {
    it('POST offers, accept via PUT /api/offers/:id, agree price', async () => {
        const requestId = await createRequest();
        const offerRes = await getAgent()
            .post(`/api/ride-requests/${requestId}/offers`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ offered_fare: 12.5, message: 'Going that way' });
        expect(offerRes.status).toBe(201);
        const offer = offerRes.body.offer;
        expect(offer.status).toBe('sent');
        expect(Number(offer.offered_fare)).toBe(12.5);
        const listRes = await getAgent()
            .get(`/api/ride-requests/${requestId}/offers`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.body.data)).toBe(true);
        const mine = await getAgent()
            .get('/api/driver/offers')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(mine.status).toBe(200);
        expect(mine.body.data.length).toBe(1);
        expect(mine.body.data[0].request.destination_city).toBe('Zarqa');
        const accept = await getAgent()
            .put(`/api/offers/${offer.id}`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ action: 'accept' });
        expect(accept.status).toBe(200);
        expect(accept.body.offer.status).toBe('accepted');
        const price = await getAgent()
            .put(`/api/offers/${offer.id}/price`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ agreed_fare: 13 });
        expect(price.status).toBe(200);
        expect(Number(price.body.offer.agreed_fare)).toBe(13);
    });
    it('rejects unauthenticated access to the board', async () => {
        const res = await getAgent().get('/api/ride-requests');
        expect(res.status).toBe(401);
    });
});
describe('US6 Contract - Ride Request Matches', () => {
    let tripId;
    let tripDeparture;
    beforeEach(async () => {
        await TripSeat.destroy({ where: {}, force: true });
        await Trip.destroy({ where: {}, force: true });
        await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
        await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
        await Vehicle.create({
            id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
            vehicleType: 'sedan', modelYear: 2022, plateNumber: 'MTC-101', color: 'Black', seats: 4, isVerified: true,
        });
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
        const departureDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
        const created = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
            origin_city: 'Amman',
            destination_city: 'Irbid',
            departure_date: departureDate,
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
        expect(created.status).toBe(201);
        tripId = created.body.trip_id;
        const t = await Trip.findByPk(tripId);
        tripDeparture = t.departureTime;
    });
    it('GET /api/ride-requests/:request_id/matches returns ranked matches shape', async () => {
        const req = await getAgent()
            .post('/api/ride-requests')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({
            origin_city: 'Amman',
            destination_city: 'Irbid',
            origin_time: tripDeparture.toISOString(),
            seats_needed: 1,
        });
        const requestId = req.body.ride_request.id;
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}/matches`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.ride_request_id).toBe(requestId);
        expect(Array.isArray(res.body.matches)).toBe(true);
        const match = res.body.matches[0];
        expect(match).toMatchObject({
            trip_id: tripId,
            score_rank: 1,
            origin: { city: 'Amman' },
            destination: { city: 'Irbid' },
            available_seats: 2,
            fare_per_seat: 15,
            currency: 'JOD',
        });
        expect(match.driver).toMatchObject({ id: DRIVER_ID, full_name: 'Contract Offer Driver' });
    });
    it('GET matches by a non-owner passenger returns 403 code', async () => {
        const OTHER_PASSENGER_ID = 'e3000000-0000-4000-8000-000000000003';
        await User.create({
            id: OTHER_PASSENGER_ID, fullName: 'Other Rider', phone: '+962797333333',
            countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
        });
        const otherToken = generateAccessToken({ id: OTHER_PASSENGER_ID, role: 'passenger' });
        const req = await getAgent()
            .post('/api/ride-requests')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ origin_city: 'Amman', destination_city: 'Zarqa' });
        const requestId = req.body.ride_request.id;
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}/matches`)
            .set('Authorization', `Bearer ${otherToken}`);
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS');
    });
});
//# sourceMappingURL=rideRequests.contract.test.js.map