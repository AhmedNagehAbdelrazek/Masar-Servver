"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, Rating, Booking, Trip, TripSeat, TripStop, DeletionRequest, Penalty, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_ID = 'aa100000-0000-4000-8000-000000000001';
const RATER_ID = 'aa100000-0000-4000-8000-000000000002';
const DRIVER_PHONE = '+962795551001';
const RATER_PHONE = '+962795551002';
let driverToken;
function makeRef() {
    return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}
async function seedDriver(overrides = {}) {
    await User.create({
        id: DRIVER_ID,
        fullName: 'Salem Driver',
        displayName: null,
        phone: DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        ...overrides,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
}
async function seedVehicle() {
    await Vehicle.create({
        driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
        vehicleType: 'sedan', modelYear: 2022,
        plateNumber: `PROF-${Math.floor(Math.random() * 9000 + 1000)}`,
        color: 'Grey', seats: 5, isVerified: true,
    });
}
async function seedActiveSubscription() {
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
const TRIP_BODY = {
    origin_city: 'Amman', origin_area: 'Abdoun', origin_lat: '31.9500', origin_lng: '35.9100',
    destination_city: 'Irbid', destination_area: 'Downtown', destination_lat: '32.5500', destination_lng: '35.8500',
    departure_date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
    departure_time: '14:00',
    type_of_trip: 'once',
    fare_per_seat: '15.50',
    seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'available' },
        { seat_number: 5, type: 'available' },
    ],
    instructions: ['No smoking please'],
};
async function createTrip() {
    const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(TRIP_BODY);
    expect(res.status).toBe(201);
    return res.body.trip_id;
}
/** Real bookings (FK chain) so Rating rows can reference them. */
async function seedRatings(count = 4) {
    const tripId = await createTrip();
    for (let i = 0; i < count; i++) {
        const booking = await Booking.create({
            tripId,
            passengerId: RATER_ID,
            seatNumber: i + 2,
            seatsBooked: 1,
            agreedFare: 15.5,
            status: BOOKING_STATUS.CONFIRMED,
            referenceCode: makeRef(),
        });
        await Rating.create({
            bookingId: booking.id,
            raterId: RATER_ID,
            rateeId: DRIVER_ID,
            stars: i < count - 1 ? 5 : 3,
            wasLate: i === count - 1,
        });
    }
}
beforeEach(async () => {
    await DeletionRequest.destroy({ where: {}, force: true });
    await Penalty.destroy({ where: { userId: DRIVER_ID }, force: true });
    await Rating.destroy({ where: { rateeId: DRIVER_ID }, force: true });
    await Booking.destroy({ where: { passengerId: RATER_ID }, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await Trip.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await SubscriptionPlan.destroy({ where: { name: 'Basic' }, force: true });
    await Vehicle.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { phone: [DRIVER_PHONE, RATER_PHONE] }, force: true });
    await User.create({
        id: RATER_ID,
        fullName: 'Rita Rater',
        phone: RATER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
});
afterEach(async () => {
    await DeletionRequest.destroy({ where: {}, force: true });
    await Penalty.destroy({ where: { userId: DRIVER_ID }, force: true });
    await Rating.destroy({ where: { rateeId: DRIVER_ID }, force: true });
    await Booking.destroy({ where: { passengerId: RATER_ID }, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await Trip.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await SubscriptionPlan.destroy({ where: { name: 'Basic' }, force: true });
    await Vehicle.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { phone: [DRIVER_PHONE, RATER_PHONE] }, force: true });
});
describe('US1 - GET /api/driver/profile/full', () => {
    it('returns aggregated profile with stats and menu for a fresh driver', async () => {
        await seedDriver();
        const res = await getAgent()
            .get('/api/driver/profile/full')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.driver.id).toBe(DRIVER_ID);
        expect(res.body.driver.full_name).toBe('Salem Driver');
        expect(res.body.driver.verification_status).toBe('unverified');
        expect(typeof res.body.driver.member_since).toBe('string');
        expect(res.body.vehicle).toBeNull();
        expect(res.body.subscription).toBeNull();
        expect(res.body.stats.total_ratings).toBe(0);
        expect(res.body.stats.punctuality_rate).toBe(0);
        // Safe-driving badge applies with zero no-shows
        expect(res.body.stats.badges.length).toBeGreaterThan(0);
        const keys = res.body.menu_items.map((m) => m.key);
        expect(keys).toEqual([
            'personal_data', 'subscriptions', 'ratings', 'settings', 'support',
            'account_status', 'terms', 'about', 'delete_account',
        ]);
    });
    it('computes punctuality from ratings and serializes vehicle + subscription', async () => {
        await seedDriver();
        await seedVehicle();
        await seedActiveSubscription();
        await seedRatings();
        const res = await getAgent()
            .get('/api/driver/profile/full')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.stats.total_ratings).toBe(4);
        // 3 of 4 on time
        expect(res.body.stats.punctuality_rate).toBe(75);
        expect(res.body.vehicle.verified).toBe(true);
        expect(res.body.stats.badges).toContain('مركبة نظيفة');
        expect(res.body.subscription.is_active).toBe(true);
        expect(res.body.subscription.currency).toBe('JOD');
        expect(res.body.subscription.days_remaining).toBeGreaterThan(0);
    });
    it('blocks banned drivers even for reads', async () => {
        await seedDriver({ status: 'banned' });
        const res = await getAgent()
            .get('/api/driver/profile/full')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(403);
    });
});
describe('US5 - account status & deletion request lifecycle', () => {
    it('reports an active standing with no pending deletion', async () => {
        await seedDriver();
        const res = await getAgent()
            .get('/api/driver/account-status')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('active');
        expect(res.body.is_suspended).toBe(false);
        expect(res.body.suspension_details).toBeNull();
        expect(res.body.active_penalties).toEqual([]);
        expect(res.body.is_deletion_requested).toBe(false);
        expect(res.body.can_delete).toBe(true);
    });
    it('surfaces an open-ended suspension', async () => {
        await seedDriver({ status: 'suspended' });
        await Penalty.create({
            userId: DRIVER_ID,
            type: 'suspension',
            reason: 'Repeated no-shows',
        });
        const res = await getAgent()
            .get('/api/driver/account-status')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('suspended');
        expect(res.body.is_suspended).toBe(true);
        expect(res.body.suspension_details.reason).toBe('Repeated no-shows');
        expect(res.body.suspension_details.ends_at).toBeNull();
    });
    it('lets suspended drivers read but not request deletion (Q5)', async () => {
        await seedDriver({ status: 'suspended' });
        const read = await getAgent()
            .get('/api/driver/account-status')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(read.status).toBe(200);
        const write = await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true });
        expect(write.status).toBe(403);
    });
    it('rejects a deletion request without explicit confirmation (D8)', async () => {
        await seedDriver();
        const res = await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ reason: 'Leaving' });
        expect(res.status).toBe(422);
    });
    it('records a reviewed deletion request and clears the FCM token', async () => {
        await seedDriver({ fcmToken: 'expo-push-token-xyz' });
        const res = await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true, reason: 'No longer driving' });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('pending');
        expect(new Date(res.body.estimated_completion).getTime()).toBeGreaterThan(Date.now());
        const row = await DeletionRequest.findOne({ where: { userId: DRIVER_ID } });
        expect(row).not.toBeNull();
        expect(row.status).toBe('pending');
        expect(row.reason).toBe('No longer driving');
        const user = await User.findByPk(DRIVER_ID);
        expect(user.fcmToken).toBeNull();
    });
    it('rejects duplicate pending deletion requests with 409', async () => {
        await seedDriver();
        const first = await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true });
        expect(first.status).toBe(200);
        const second = await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true });
        expect(second.status).toBe(409);
        expect(second.body.code).toBe('DELETION_ALREADY_REQUESTED');
    });
    it('lets the driver cancel a pending request and re-request later (Q3)', async () => {
        await seedDriver();
        await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true });
        const res = await getAgent()
            .post('/api/driver/delete-account/cancel')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('cancelled');
        const row = await DeletionRequest.findOne({ where: { userId: DRIVER_ID } });
        expect(row.status).toBe('cancelled');
        const again = await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true });
        expect(again.status).toBe(200);
    });
    it('returns typed 404 when cancelling without a pending request', async () => {
        await seedDriver();
        const res = await getAgent()
            .post('/api/driver/delete-account/cancel')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('NO_PENDING_DELETION_REQUEST');
    });
    it('flags is_deletion_requested while a request is pending', async () => {
        await seedDriver();
        await getAgent()
            .post('/api/driver/delete-account')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ confirmation: true });
        const res = await getAgent()
            .get('/api/driver/account-status')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.body.is_deletion_requested).toBe(true);
        expect(res.body.can_delete).toBe(false);
    });
});
//# sourceMappingURL=driverProfileSettings.test.js.map