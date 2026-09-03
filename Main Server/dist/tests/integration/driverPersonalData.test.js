"use strict";
const bcrypt = require('bcrypt');
const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, Rating, Booking, Trip, TripSeat, TripStop, NotificationSetting, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_ID = 'bb100000-0000-4000-8000-000000000001';
const OTHER_ID = 'bb100000-0000-4000-8000-000000000002';
const RATER_ID = 'bb100000-0000-4000-8000-000000000003';
const DRIVER_PHONE = '+962795552001';
const OTHER_PHONE = '+962795552002';
const RATER_PHONE = '+962795552003';
let driverToken;
function makeRef() {
    return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}
async function seedDriver(overrides = {}) {
    await User.create({
        id: DRIVER_ID,
        fullName: 'Nader Driver',
        phone: DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: await bcrypt.hash('OldPass@123', 4),
        isVerified: false,
        ...overrides,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
}
async function seedOtherDriver() {
    await User.create({
        id: OTHER_ID,
        fullName: 'Other Driver',
        phone: OTHER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        email: 'taken@example.com',
    });
}
async function seedVehicleForOtherDriver(plate) {
    await Vehicle.create({
        driverId: OTHER_ID, manufacturer: 'Kia', model: 'Cerato',
        vehicleType: 'sedan', modelYear: 2021, plateNumber: plate, seats: 4,
    });
}
async function seedActiveSubscriptionAndVehicle(seats) {
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
    await Vehicle.create({
        driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023,
        plateNumber: `PD-${Math.floor(Math.random() * 9000 + 1000)}`,
        color: 'White', seats, isVerified: true,
    });
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
        { seat_number: 6, type: 'available' },
    ],
    instructions: ['No smoking please'],
};
/** Real bookings (FK chain) powering the ratings summary test. */
async function seedRatings(starsList = [5, 5, 4, 5, 3]) {
    const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(TRIP_BODY);
    expect(res.status).toBe(201);
    const tripId = res.body.trip_id;
    for (let i = 0; i < starsList.length; i++) {
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
            stars: starsList[i],
            wasLate: starsList[i] < 4,
        });
    }
    const avg = Math.round((starsList.reduce((s, v) => s + v, 0) / starsList.length) * 10) / 10;
    await User.update({ avgRating: avg }, { where: { id: DRIVER_ID } });
    return avg;
}
beforeEach(async () => {
    await Rating.destroy({ where: { rateeId: DRIVER_ID }, force: true });
    await Booking.destroy({ where: { passengerId: RATER_ID }, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await Trip.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await NotificationSetting.destroy({ where: { userId: DRIVER_ID }, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await SubscriptionPlan.destroy({ where: { name: 'Basic' }, force: true });
    await Vehicle.destroy({ where: { driverId: [DRIVER_ID, OTHER_ID] }, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { phone: [DRIVER_PHONE, OTHER_PHONE, RATER_PHONE] }, force: true });
    await User.create({
        id: RATER_ID,
        fullName: 'Sam Rater',
        phone: RATER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
});
afterEach(async () => {
    await Rating.destroy({ where: { rateeId: DRIVER_ID }, force: true });
    await Booking.destroy({ where: { passengerId: RATER_ID }, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await Trip.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await NotificationSetting.destroy({ where: { userId: DRIVER_ID }, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await SubscriptionPlan.destroy({ where: { name: 'Basic' }, force: true });
    await Vehicle.destroy({ where: { driverId: [DRIVER_ID, OTHER_ID] }, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { phone: [DRIVER_PHONE, OTHER_PHONE, RATER_PHONE] }, force: true });
});
describe('US2 - personal data view & update', () => {
    it('returns the editable/locked field map for an unverified driver', async () => {
        await seedDriver();
        const res = await getAgent()
            .get('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.personal_data.phone).toBe(DRIVER_PHONE);
        // gender defaults to male at registration
        expect(res.body.personal_data.gender_label).toBe('ذكر');
        expect(res.body.editable_now).toEqual(['display_name', 'phone', 'age', 'avatar_url']);
        expect(res.body.locked_fields).toEqual([]);
        expect(res.body.rejected_fields).toEqual([]);
    });
    it('locks identity fields once verification is approved (Q1)', async () => {
        await seedDriver({ verificationStatus: 'approved', isVerified: true });
        const res = await getAgent()
            .get('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.body.locked_fields).toContain('full_name');
        expect(res.body.locked_fields).toContain('email');
        expect(res.body.locked_fields).toContain('national_id');
        expect(res.body.locked_fields).toContain('vehicle.plate_number');
    });
    it('always allows display_name edits without touching verification', async () => {
        await seedDriver();
        const res = await getAgent()
            .put('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ display_name: 'أبو نادر' });
        expect(res.status).toBe(200);
        expect(res.body.personal_data.display_name).toBe('أبو نادر');
        expect(res.body.requires_verification).toBe(false);
    });
    it('moves an unverified driver to pending after identity edits (D7)', async () => {
        await seedDriver();
        const res = await getAgent()
            .put('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ full_name: 'Nader Updated', national_id: '9876543210' });
        expect(res.status).toBe(200);
        expect(res.body.requires_verification).toBe(true);
        expect(res.body.message).toContain('للمراجعة');
        const user = await User.findByPk(DRIVER_ID);
        expect(user.fullName).toBe('Nader Updated');
        expect(user.verificationStatus).toBe('pending');
        expect(user.verificationSubmittedAt).not.toBeNull();
        const profile = await DriverProfile.findOne({ where: { driverId: DRIVER_ID } });
        expect(profile.nationalID).toBe('9876543210');
    });
    it('rejects identity edits from an approved driver with FIELD_LOCKED', async () => {
        await seedDriver({ verificationStatus: 'approved', isVerified: true });
        const res = await getAgent()
            .put('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ full_name: 'Should Not Apply' });
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('FIELD_LOCKED');
        const user = await User.findByPk(DRIVER_ID);
        expect(user.fullName).toBe('Nader Driver');
    });
    it('enforces email and phone uniqueness with typed 409 codes (Q4)', async () => {
        await seedDriver();
        await seedOtherDriver();
        const email = await getAgent()
            .put('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ email: 'taken@example.com' });
        expect(email.status).toBe(409);
        expect(email.body.code).toBe('EMAIL_ALREADY_IN_USE');
        const phone = await getAgent()
            .put('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ phone: OTHER_PHONE });
        expect(phone.status).toBe(409);
        expect(phone.body.code).toBe('PHONE_ALREADY_IN_USE');
    });
    it('enforces plate uniqueness across drivers', async () => {
        await seedDriver({ verificationStatus: 'approved', isVerified: true });
        await seedOtherDriver();
        await seedVehicleForOtherDriver('DUP-999');
        const res = await getAgent()
            .put('/api/driver/personal-data')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ vehicle: { plate_number: 'DUP-999' } });
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/plate/i);
    });
});
describe('US1 - ratings screen summary & distribution', () => {
    it('returns distribution with percentages and punctuality rate', async () => {
        await seedDriver({ verificationStatus: 'approved', isVerified: true });
        await seedActiveSubscriptionAndVehicle(6);
        const avg = await seedRatings([5, 5, 4, 5, 3]);
        const res = await getAgent()
            .get('/api/driver/ratings')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.summary.total_ratings).toBe(5);
        expect(res.body.summary.average_rating).toBeCloseTo(avg, 1);
        // 4 of 5 on time
        expect(res.body.summary.punctuality_rate).toBe(80);
        const five = res.body.summary.distribution.find((d) => d.stars === 5);
        expect(five.count).toBe(3);
        expect(five.percentage).toBe(60);
        if (res.body.data.length > 0) {
            expect(typeof res.body.data[0].rater_name).toBe('string');
        }
        // Sorting by lowest puts the 3-star rating first
        const sorted = await getAgent()
            .get('/api/driver/ratings?sort=lowest')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(sorted.status).toBe(200);
        expect(sorted.body.data[0].stars).toBe(3);
    });
});
describe('US3 - grouped notification settings', () => {
    it('returns three categories with defaults all enabled', async () => {
        await seedDriver();
        const res = await getAgent()
            .get('/api/settings/notifications/grouped')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.master_switch).toBe(true);
        expect(res.body.categories.map((c) => c.key)).toEqual(['bookings', 'trips', 'subscriptions']);
        const subs = res.body.categories.find((c) => c.key === 'subscriptions');
        const typeKeys = subs.types.map((t) => t.type);
        expect(typeKeys).toEqual(['subscription_payment', 'payment_confirmed', 'subscription_expiring']);
        expect(subs.types[0].label.ar.length).toBeGreaterThan(0);
    });
    it('hard-overwrites every stored toggle via master switch (Q2)', async () => {
        await seedDriver();
        await NotificationSetting.create({
            userId: DRIVER_ID,
            notificationType: 'booking_confirmed',
            enabledInApp: true,
            enabledPush: true,
        });
        const res = await getAgent()
            .put('/api/settings/notifications/grouped')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ master_switch: false });
        expect(res.status).toBe(200);
        expect(res.body.master_switch).toBe(false);
        for (const category of res.body.categories) {
            for (const t of category.types) {
                expect(t.enabled_in_app).toBe(false);
                expect(t.enabled_push).toBe(false);
            }
        }
        const stored = await NotificationSetting.findAll({ where: { userId: DRIVER_ID } });
        expect(stored.length).toBeGreaterThanOrEqual(15);
        expect(stored.every((s) => s.enabledInApp === false && s.enabledPush === false)).toBe(true);
    });
    it('applies single-channel toggles from updates list', async () => {
        await seedDriver();
        const res = await getAgent()
            .put('/api/settings/notifications/grouped')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
            updates: [
                { type: 'trip_reminder', channel: 'push', enabled: false },
            ],
        });
        expect(res.status).toBe(200);
        const trips = res.body.categories.find((c) => c.key === 'trips');
        const reminder = trips.types.find((t) => t.type === 'trip_reminder');
        expect(reminder.enabled_push).toBe(false);
        expect(reminder.enabled_in_app).toBe(true);
        // master switch no longer "all on"
        expect(res.body.master_switch).toBe(false);
    });
});
describe('US4 - change password', () => {
    it('rejects a wrong current password with INVALID_CURRENT_PASSWORD', async () => {
        await seedDriver();
        const res = await getAgent()
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ current_password: 'Wrong@123', new_password: 'NewPass@456' });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });
    it('changes the password and reports relogin requirement', async () => {
        await seedDriver();
        const res = await getAgent()
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ current_password: 'OldPass@123', new_password: 'NewPass@456' });
        expect(res.status).toBe(200);
        expect(res.body.requires_relogin).toBe(true);
        const user = await User.findByPk(DRIVER_ID);
        expect(await bcrypt.compare('NewPass@456', user.passwordHash)).toBe(true);
    });
    it('rejects reusing the same password', async () => {
        await seedDriver();
        const res = await getAgent()
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ current_password: 'OldPass@123', new_password: 'OldPass@123' });
        expect([400, 422]).toContain(res.status);
    });
});
//# sourceMappingURL=driverPersonalData.test.js.map