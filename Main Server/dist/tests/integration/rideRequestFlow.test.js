"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, Booking, RideRequest, RequestOffer, SubscriptionPlan, DriverSubscription, Notification, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const DRIVER1_PHONE = '+962795571001';
const DRIVER2_PHONE = '+962795571002';
const PASSENGER1_PHONE = '+962795571003';
const PASSENGER2_PHONE = '+962795571004';
const DRIVER1_ID = 'd1000000-0000-4000-8000-000000000001';
const DRIVER2_ID = 'd1000000-0000-4000-8000-000000000002';
const PASSENGER1_ID = 'd1000000-0000-4000-8000-000000000003';
const PASSENGER2_ID = 'd1000000-0000-4000-8000-000000000004';
const VEHICLE_ID = 'd1000000-0000-4000-8000-000000000010';
let driver1Token;
let driver2Token;
let passenger1Token;
let passenger2Token;
let tripId;
function getFutureDate(daysAhead = 1) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}
async function createRideRequest(token, overrides = {}) {
    const res = await getAgent()
        .post('/api/ride-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        origin_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        max_budget: 20,
        ...overrides,
    });
    if (res.status !== 201)
        console.log('REQ CREATE DEBUG:', JSON.stringify(res.body));
    return res;
}
async function submitOffer(token, requestId, overrides = {}) {
    return getAgent()
        .post(`/api/ride-requests/${requestId}/offers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ offered_fare: 15, message: 'I can take you', ...overrides });
}
beforeEach(async () => {
    await RequestOffer.destroy({ where: {}, force: true });
    await RideRequest.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await Notification.destroy({ where: { userId: [DRIVER1_ID, DRIVER2_ID, PASSENGER1_ID, PASSENGER2_ID] }, force: true }).catch(() => { });
    await User.destroy({ where: { phone: [DRIVER1_PHONE, DRIVER2_PHONE, PASSENGER1_PHONE, PASSENGER2_PHONE] }, force: true });
    const users = [
        { id: DRIVER1_ID, fullName: 'Board Driver One', phone: DRIVER1_PHONE, role: 'driver' },
        { id: DRIVER2_ID, fullName: 'Board Driver Two', phone: DRIVER2_PHONE, role: 'driver' },
        { id: PASSENGER1_ID, fullName: 'Board Passenger One', phone: PASSENGER1_PHONE, role: 'passenger' },
        { id: PASSENGER2_ID, fullName: 'Board Passenger Two', phone: PASSENGER2_PHONE, role: 'passenger' },
    ];
    for (const u of users) {
        await User.create({
            id: u.id,
            fullName: u.fullName,
            phone: u.phone,
            countryCode: 'JO',
            role: u.role,
            passwordHash: 'hashed',
            isVerified: true,
        });
    }
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER1_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'BRD-100',
        color: 'Grey',
        seats: 4,
        isVerified: true,
    });
    driver1Token = generateAccessToken({ id: DRIVER1_ID, role: 'driver' });
    driver2Token = generateAccessToken({ id: DRIVER2_ID, role: 'driver' });
    passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });
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
        driverId: DRIVER1_ID,
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
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER1_ID } });
    const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driver1Token}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '16:00',
        type_of_trip: 'once',
        fare_per_seat: '18.00',
        seats: [
            { seat_number: 1, type: 'driver' },
            { seat_number: 2, type: 'available' },
            { seat_number: 3, type: 'available' },
            { seat_number: 4, type: 'unavailable' },
        ],
    });
    if (res.status !== 201)
        console.log('TRIP CREATE DEBUG:', JSON.stringify(res.body));
    expect(res.status).toBe(201);
    tripId = res.body.trip_id;
});
describe('POST /api/ride-requests - passenger posts a request', () => {
    it('should create an open ride request with computed expiry', async () => {
        const res = await createRideRequest(passenger1Token, {
            seats_needed: 2,
            attributes_preferred: { ac: true },
        });
        expect(res.status).toBe(201);
        expect(res.body.ride_request.id).toBeDefined();
        expect(res.body.ride_request.status).toBe('open');
        expect(res.body.ride_request.seats_needed).toBe(2);
        expect(res.body.ride_request.origin_city).toBe('Amman');
        expect(res.body.ride_request.destination_city).toBe('Irbid');
        expect(res.body.ride_request.expires_at).toBeDefined();
        expect(new Date(res.body.ride_request.expires_at).getTime()).toBeGreaterThan(Date.now());
    });
    it('should derive expires_at from arrival_deadline when provided', async () => {
        const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const res = await createRideRequest(passenger1Token, { arrival_deadline: deadline });
        expect(res.status).toBe(201);
        expect(new Date(res.body.ride_request.expires_at).toISOString()).toBe(new Date(deadline).toISOString());
    });
    it('should reject invalid payloads', async () => {
        const res = await getAgent()
            .post('/api/ride-requests')
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ origin_city: 'Amman' });
        expect(res.status).toBe(422);
    });
    it('should reject drivers creating ride requests', async () => {
        const res = await createRideRequest(driver1Token);
        expect(res.status).toBe(403);
    });
    it('should reject unauthenticated requests', async () => {
        const res = await getAgent()
            .post('/api/ride-requests')
            .send({ origin_city: 'Amman', destination_city: 'Irbid' });
        expect(res.status).toBe(401);
    });
});
describe('GET /api/ride-requests - request board', () => {
    let requestId;
    beforeEach(async () => {
        const res = await createRideRequest(passenger1Token);
        requestId = res.body.ride_request.id;
    });
    it('should show open requests of others to drivers', async () => {
        const res = await getAgent()
            .get('/api/ride-requests')
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].id).toBe(requestId);
        expect(res.body.data[0].status).toBe('open');
        expect(res.body.data[0].passenger_name).toBe('Board Passenger One');
        expect(res.body.pagination).toBeDefined();
    });
    it('should show passengers only their own requests', async () => {
        const res = await getAgent()
            .get('/api/ride-requests')
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        const other = await getAgent()
            .get('/api/ride-requests')
            .set('Authorization', `Bearer ${passenger2Token}`);
        expect(other.status).toBe(200);
        expect(other.body.data.length).toBe(0);
    });
    it('should filter by status', async () => {
        const res = await getAgent()
            .get('/api/ride-requests?status=expired')
            .set('Authorization', `Bearer ${driver1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(0);
    });
});
describe('GET /api/ride-requests/:request_id - detail', () => {
    let requestId;
    beforeEach(async () => {
        const res = await createRideRequest(passenger1Token);
        requestId = res.body.ride_request.id;
    });
    it('should return detail with offers for the owner', async () => {
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.ride_request.id).toBe(requestId);
        expect(Array.isArray(res.body.ride_request.offers)).toBe(true);
    });
    it('should allow any driver to view the request', async () => {
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(res.status).toBe(200);
    });
    it('should forbid another passenger', async () => {
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger2Token}`);
        expect(res.status).toBe(403);
    });
    it('should return 404 for unknown request', async () => {
        const fakeId = 'd1000000-0000-4000-8000-000000000099';
        const res = await getAgent()
            .get(`/api/ride-requests/${fakeId}`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(res.status).toBe(404);
    });
});
describe('PUT /api/ride-requests/:request_id - update / cancel', () => {
    let requestId;
    beforeEach(async () => {
        const res = await createRideRequest(passenger1Token);
        requestId = res.body.ride_request.id;
    });
    it('should allow the owner to edit while open', async () => {
        const res = await getAgent()
            .put(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ seats_needed: 3, max_budget: 35 });
        expect(res.status).toBe(200);
        expect(res.body.ride_request.seats_needed).toBe(3);
        expect(Number(res.body.ride_request.max_budget)).toBe(35);
    });
    it('should cancel the request via action', async () => {
        const res = await getAgent()
            .put(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'cancel' });
        expect(res.status).toBe(200);
        expect(res.body.ride_request.status).toBe('cancelled');
    });
    it('should forbid another passenger from updating', async () => {
        const res = await getAgent()
            .put(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger2Token}`)
            .send({ seats_needed: 5 });
        expect(res.status).toBe(403);
    });
});
describe('POST /api/ride-requests/:request_id/offers - driver offers', () => {
    let requestId;
    beforeEach(async () => {
        const res = await createRideRequest(passenger1Token);
        requestId = res.body.ride_request.id;
    });
    it('should submit an offer and flip request to offered', async () => {
        const res = await submitOffer(driver1Token, requestId);
        expect(res.status).toBe(201);
        expect(res.body.offer.id).toBeDefined();
        expect(res.body.offer.status).toBe('sent');
        expect(Number(res.body.offer.offered_fare)).toBe(15);
        const detail = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(detail.body.ride_request.status).toBe('offered');
    });
    it('should reject a duplicate pending offer from the same driver', async () => {
        await submitOffer(driver1Token, requestId);
        const res = await submitOffer(driver1Token, requestId, { offered_fare: 12 });
        expect(res.status).toBe(409);
    });
    it('should allow multiple different drivers to offer', async () => {
        const r1 = await submitOffer(driver1Token, requestId);
        const r2 = await submitOffer(driver2Token, requestId);
        expect(r1.status).toBe(201);
        expect(r2.status).toBe(201);
    });
    it('should reject offers from passengers', async () => {
        const res = await submitOffer(passenger1Token, requestId);
        expect(res.status).toBe(403);
    });
});
describe('offer decision flow', () => {
    let requestId;
    let offer1Id;
    let offer2Id;
    beforeEach(async () => {
        const reqRes = await createRideRequest(passenger1Token);
        requestId = reqRes.body.ride_request.id;
        const o1 = await submitOffer(driver1Token, requestId, { offered_fare: 14 });
        const o2 = await submitOffer(driver2Token, requestId, { offered_fare: 17 });
        offer1Id = o1.body.offer.id;
        offer2Id = o2.body.offer.id;
    });
    it('should list offers to the owner with driver names', async () => {
        const res = await getAgent()
            .get(`/api/ride-requests/${requestId}/offers`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data.map((o) => o.driver_name).sort()).toEqual([
            'Board Driver One',
            'Board Driver Two',
        ]);
    });
    it('should forbid a driver who never offered from listing offers', async () => {
        const reqRes = await createRideRequest(passenger2Token);
        const freshId = reqRes.body.ride_request.id;
        const res = await getAgent()
            .get(`/api/ride-requests/${freshId}/offers`)
            .set('Authorization', `Bearer ${driver2Token}`);
        expect(res.status).toBe(403);
    });
    it('should accept an offer, decline competing ones, and lock the request', async () => {
        const res = await getAgent()
            .put(`/api/offers/${offer1Id}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'accept' });
        expect(res.status).toBe(200);
        expect(res.body.offer.status).toBe('accepted');
        const detail = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(detail.body.ride_request.status).toBe('accepted');
        const offers = await getAgent()
            .get(`/api/ride-requests/${requestId}/offers`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        const other = offers.body.data.find((o) => o.id === offer2Id);
        expect(other.status).toBe('declined');
    });
    it('should forbid another passenger from deciding', async () => {
        const res = await getAgent()
            .put(`/api/offers/${offer1Id}`)
            .set('Authorization', `Bearer ${passenger2Token}`)
            .send({ action: 'accept' });
        expect(res.status).toBe(403);
    });
    it('should return the request to open when every offer is declined', async () => {
        await getAgent()
            .put(`/api/offers/${offer2Id}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'decline' });
        const res = await getAgent()
            .put(`/api/offers/${offer1Id}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'decline' });
        expect(res.status).toBe(200);
        expect(res.body.offer.status).toBe('declined');
        const detail = await getAgent()
            .get(`/api/ride-requests/${requestId}`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(detail.body.ride_request.status).toBe('open');
    });
    it('should reject deciding twice', async () => {
        await getAgent()
            .put(`/api/offers/${offer2Id}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'decline' });
        const res = await getAgent()
            .put(`/api/offers/${offer2Id}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'accept' });
        expect(res.status).toBe(409);
    });
    it('should validate the action field', async () => {
        const res = await getAgent()
            .put(`/api/offers/${offer1Id}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'maybe' });
        expect(res.status).toBe(422);
    });
});
describe('PUT /api/offers/:offer_id/price - agree final fare', () => {
    let requestId;
    let offerId;
    beforeEach(async () => {
        const reqRes = await createRideRequest(passenger1Token);
        requestId = reqRes.body.ride_request.id;
        const o = await submitOffer(driver1Token, requestId);
        offerId = o.body.offer.id;
    });
    it('should reject price agreement before acceptance', async () => {
        const res = await getAgent()
            .put(`/api/offers/${offerId}/price`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ agreed_fare: 16 });
        expect(res.status).toBe(409);
    });
    it('should store the agreed fare after acceptance', async () => {
        await getAgent()
            .put(`/api/offers/${offerId}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'accept' });
        const res = await getAgent()
            .put(`/api/offers/${offerId}/price`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ agreed_fare: 16.5 });
        expect(res.status).toBe(200);
        expect(Number(res.body.offer.agreed_fare)).toBe(16.5);
    });
    it('should require agreed_fare in body', async () => {
        await getAgent()
            .put(`/api/offers/${offerId}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'accept' });
        const res = await getAgent()
            .put(`/api/offers/${offerId}/price`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({});
        expect(res.status).toBe(422);
    });
});
describe('GET /api/driver/offers - own sent offers', () => {
    it('should list the driver offers with request summaries', async () => {
        const reqRes = await createRideRequest(passenger1Token);
        await submitOffer(driver1Token, reqRes.body.ride_request.id);
        const res = await getAgent()
            .get('/api/driver/offers')
            .set('Authorization', `Bearer ${driver1Token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].driver_id).toBe(DRIVER1_ID);
        expect(res.body.data[0].request.origin_city).toBe('Amman');
        expect(res.body.pagination.total).toBe(1);
    });
});
describe('POST /api/trips/:trip_id/offers/:offer_id/attach - deferred materialization', () => {
    let requestId;
    let offerId;
    async function acceptAndAgree(fare = 16) {
        await getAgent()
            .put(`/api/offers/${offerId}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'accept' });
        await getAgent()
            .put(`/api/offers/${offerId}/price`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ agreed_fare: fare });
    }
    beforeEach(async () => {
        const reqRes = await createRideRequest(passenger1Token, { seats_needed: 1 });
        requestId = reqRes.body.ride_request.id;
        const o = await submitOffer(driver1Token, requestId);
        offerId = o.body.offer.id;
    });
    it('should create the confirmed booking only when the driver attaches the offer', async () => {
        await acceptAndAgree(18);
        const before = await Trip.findByPk(tripId);
        const res = await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        expect(res.status).toBe(201);
        expect(res.body.booking.reference_code).toMatch(/^MSR-[A-Z0-9]{6}$/);
        expect(res.body.booking.status).toBe('confirmed');
        expect(res.body.booking.payment_status).toBe('pending');
        expect(Number(res.body.booking.agreed_fare)).toBe(18);
        expect(res.body.offer.booking_id).toBe(res.body.booking.id);
        const after = await Trip.findByPk(tripId);
        expect(after.availableSeats).toBe(before.availableSeats - 1);
        const stored = await Booking.findOne({ where: { tripId } });
        expect(stored.passengerId).toBe(PASSENGER1_ID);
        expect(stored.seatNumber).toBeNull();
    });
    it('should flip the trip to full when capacity reaches zero', async () => {
        const single = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({
            origin_city: 'Amman',
            destination_city: 'Aqaba',
            departure_date: getFutureDate(2),
            departure_time: '09:00',
            type_of_trip: 'once',
            fare_per_seat: '30.00',
            seats: [
                { seat_number: 1, type: 'driver' },
                { seat_number: 2, type: 'available' },
                { seat_number: 3, type: 'unavailable' },
                { seat_number: 4, type: 'unavailable' },
            ],
        });
        if (single.status !== 201)
            console.log('TRIP CREATE DEBUG:', JSON.stringify(single.body));
        expect(single.status).toBe(201);
        const singleTripId = single.body.trip_id;
        await acceptAndAgree(28);
        const res = await getAgent()
            .post(`/api/trips/${singleTripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        expect(res.status).toBe(201);
        const trip = await Trip.findByPk(singleTripId);
        expect(trip.availableSeats).toBe(0);
        expect(trip.status).toBe('full');
    });
    it('should reject attaching before the price is agreed', async () => {
        await getAgent()
            .put(`/api/offers/${offerId}`)
            .set('Authorization', `Bearer ${passenger1Token}`)
            .send({ action: 'accept' });
        const res = await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        expect(res.status).toBe(409);
    });
    it('should reject attaching an offer that was never accepted', async () => {
        const res = await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        expect(res.status).toBe(409);
    });
    it('should reject attaching twice', async () => {
        await acceptAndAgree(18);
        await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        const res = await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        expect(res.status).toBe(409);
    });
    it('should reject another driver attaching to a trip they do not own', async () => {
        await acceptAndAgree(18);
        const res = await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver2Token}`)
            .send({});
        expect(res.status).toBe(403);
    });
    it('should reject attaching to an ongoing/completed trip', async () => {
        await acceptAndAgree(18);
        await Trip.update({ departureTime: new Date(Date.now() - 5 * 60 * 1000) }, { where: { id: tripId } });
        await getAgent().post(`/api/trips/${tripId}/start`).set('Authorization', `Bearer ${driver1Token}`);
        const res = await getAgent()
            .post(`/api/trips/${tripId}/offers/${offerId}/attach`)
            .set('Authorization', `Bearer ${driver1Token}`)
            .send({});
        expect(res.status).toBe(409);
    });
});
//# sourceMappingURL=rideRequestFlow.test.js.map