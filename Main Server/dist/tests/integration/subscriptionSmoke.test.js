"use strict";
const { getAgent } = require('../setup/setup');
const { User, DriverProfile, Vehicle, Trip, Booking, DriverSubscription, UploadedImage, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440f01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440f02';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440f03';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440f10';
let adminToken;
let driverToken;
function getFutureDate(daysAhead = 1) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}
const VALID_TRIP_BODY = {
    origin_city: 'Amman',
    destination_city: 'Irbid',
    departure_date: getFutureDate(1),
    departure_time: '14:00',
    type_of_trip: 'once',
    fare_per_seat: '20.00',
    seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
    ],
};
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await UploadedImage.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962710000401', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
    await User.create({ id: DRIVER_ID, fullName: 'Smoke Driver', phone: '+962710000402', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
    await User.create({ id: PASSENGER_ID, fullName: 'Smoke Passenger', phone: '+962710000403', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
    await DriverProfile.create({ driverId: DRIVER_ID, nationalID: 'N9998887' });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'SMOKE-1',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
describe('End-to-end smoke (quickstart.md): plan → subscribe → approve → gate → commission', () => {
    it('walks the full driver subscription flow through the API', async () => {
        const screenshot = await UploadedImage.create({
            hash: 'smoke-screenshot-hash',
            url: 'https://res.cloudinary.com/x/screenshot.jpg',
            filename: 'smoke-screenshot.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
        });
        // 1. Admin creates a payment method + plan
        const methodRes = await getAgent()
            .post('/api/admin/payment-methods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Bank of Jordan',
            account_number: 'JO94BOJX0000000000',
            type: 'bank_account',
            email: 'payments@boj.com',
        });
        expect(methodRes.status).toBe(201);
        const planRes = await getAgent()
            .post('/api/admin/plans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Basic',
            period_days: 30,
            percentage_cut: '8.00',
            cost: '100.00',
            status: 'popular',
            features: ['no booking fees'],
            is_free: false,
        });
        expect(planRes.status).toBe(201);
        const plan = planRes.body.plan;
        // 2. Driver browses the catalog (Redis-cached) and payment options
        const plansRes = await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
        expect(plansRes.status).toBe(200);
        expect(plansRes.body.plans.find((p) => p.id === plan.id).name).toBe('Basic');
        const methodsRes = await getAgent().get('/api/payment-methods');
        expect(methodsRes.status).toBe(200);
        const method = methodsRes.body.methods[0];
        // 3. Driver submits a subscription request
        const submitRes = await getAgent()
            .post('/api/subscriptions')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
            plan_id: plan.id,
            payment_method_id: method.id,
            screenshot_id: screenshot.id,
        });
        expect(submitRes.status).toBe(201);
        expect(submitRes.body.status).toBe(SUBSCRIPTION_STATUS.PENDING_APPROVAL);
        const subscriptionId = submitRes.body.subscription_id;
        // 4. Admin reviews the pending queue (masked national ID) and approves
        const pendingRes = await getAgent()
            .get('/api/admin/subscriptions/pending')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(pendingRes.status).toBe(200);
        expect(pendingRes.body.pending).toHaveLength(1);
        expect(pendingRes.body.pending[0].driver.national_id_masked).toBe('****8887');
        const approveRes = await getAgent()
            .post(`/api/admin/subscriptions/${subscriptionId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(approveRes.status).toBe(200);
        expect(approveRes.body.balance_added).toBe(100);
        // 5. Driver sees the active plan + credited balance
        const currentRes = await getAgent()
            .get('/api/subscriptions/current')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(currentRes.body.subscription.plan.name).toBe('Basic');
        expect(currentRes.body.total_balance).toBe(100);
        expect(currentRes.body.is_in_debt).toBe(false);
        // 6. Driver publishes + starts a trip (balance covers one-seat commission)
        const publishRes = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send(VALID_TRIP_BODY);
        expect(publishRes.status).toBe(201);
        const tripId = publishRes.body.trip_id;
        const startRes = await getAgent()
            .post(`/api/trips/${tripId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(startRes.status).toBe(200);
        expect(startRes.body.status).toBe('in_progress');
        // 7. Passenger books; driver completes → commission deducted
        await Booking.create({
            tripId,
            passengerId: PASSENGER_ID,
            seatNumber: 2,
            seatsBooked: 1,
            agreedFare: 20,
            referenceCode: `S${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1e6).toString(36)}`,
            status: BOOKING_STATUS.CONFIRMED,
        });
        const completeRes = await getAgent()
            .post(`/api/trips/${tripId}/complete`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(completeRes.status).toBe(200);
        expect(completeRes.body.commission).toBe(1.6); // 20 × 8%
        expect(completeRes.body.plan_name).toBe('Basic');
        expect(completeRes.body.balance_after).toBe(98.4);
        expect(completeRes.body.is_in_debt).toBe(false);
    });
});
//# sourceMappingURL=subscriptionSmoke.test.js.map