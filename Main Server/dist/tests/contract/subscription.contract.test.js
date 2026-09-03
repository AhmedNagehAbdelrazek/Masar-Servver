"use strict";
const { getAgent } = require('../setup/setup');
const { User, DriverProfile, SubscriptionPlan, PaymentMethod, DriverSubscription, UploadedImage } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440c01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c02';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440c03';
let adminToken;
let driverToken;
let passengerToken;
let plan;
let pendingPlan;
let method;
let pendingSub;
let screenshot;
beforeEach(async () => {
    await DriverSubscription.destroy({ where: {}, force: true });
    await UploadedImage.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await PaymentMethod.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962710000101', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
    await User.create({ id: DRIVER_ID, fullName: 'Driver One', phone: '+962710000102', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
    await User.create({ id: PASSENGER_ID, fullName: 'Passenger', phone: '+962710000103', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
    await DriverProfile.create({ driverId: DRIVER_ID, nationalID: 'N1234567' });
    plan = await SubscriptionPlan.create({
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 15,
        features: [],
        isFree: false,
        isActive: true,
    });
    pendingPlan = await SubscriptionPlan.create({
        name: 'Premium',
        periodDays: 30,
        percentageCut: 10,
        cost: 25,
        features: [],
        isFree: false,
        isActive: true,
    });
    method = await PaymentMethod.create({
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
    });
    screenshot = await UploadedImage.create({
        hash: 'contract-screenshot-hash',
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'contract-screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
    });
    pendingSub = await DriverSubscription.create({
        driverId: DRIVER_ID,
        planId: pendingPlan.id,
        planName: pendingPlan.name,
        planPeriodDays: pendingPlan.periodDays,
        planPercentageCut: pendingPlan.percentageCut,
        planCost: pendingPlan.cost,
        paymentMethod: { name: method.name, account_number: method.accountNumber, type: method.type },
        screenshotId: screenshot.id,
        status: SUBSCRIPTION_STATUS.PENDING_APPROVAL,
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});
describe('Contract: POST /api/subscriptions', () => {
    it('returns 201 with subscription_id/status/message shape', async () => {
        const res = await getAgent()
            .post('/api/subscriptions')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
            plan_id: plan.id,
            payment_method_id: method.id,
            screenshot_id: screenshot.id,
        });
        expect(res.status).toBe(201);
        expect(typeof res.body.subscription_id).toBe('string');
        expect(res.body.status).toBe('pending_approval');
        expect(typeof res.body.message).toBe('string');
    });
    it('returns 401 without auth', async () => {
        const res = await getAgent().post('/api/subscriptions').send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
        expect(res.status).toBe(401);
    });
    it('returns 403 for passenger role', async () => {
        const res = await getAgent().post('/api/subscriptions').set('Authorization', `Bearer ${passengerToken}`).send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
        expect(res.status).toBe(403);
    });
});
describe('Contract: GET /api/subscriptions', () => {
    it('returns 200 with subscriptions array shape', async () => {
        const res = await getAgent().get('/api/subscriptions').set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.subscriptions)).toBe(true);
        const sub = res.body.subscriptions[0];
        expect(typeof sub.id).toBe('string');
        expect(sub.plan).toBeDefined();
        expect(typeof sub.plan.name).toBe('string');
        expect(typeof sub.plan.period_days).toBe('number');
        expect(typeof sub.balance).toBe('number');
        expect(typeof sub.status).toBe('string');
        expect('rejection_reason' in sub).toBe(true);
        expect(typeof sub.created_at).toBe('string');
    });
});
describe('Contract: GET /api/subscriptions/current', () => {
    it('returns 200 with subscription/total_balance/is_in_debt shape', async () => {
        const res = await getAgent().get('/api/subscriptions/current').set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect('subscription' in res.body).toBe(true);
        expect(typeof res.body.total_balance).toBe('number');
        expect(typeof res.body.is_in_debt).toBe('boolean');
    });
});
describe('Contract: GET /api/admin/subscriptions/pending', () => {
    it('returns 200 with pending array including masked national id', async () => {
        const res = await getAgent().get('/api/admin/subscriptions/pending').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.pending)).toBe(true);
        expect(res.body.pending.length).toBe(1);
        const item = res.body.pending[0];
        expect(typeof item.subscription_id).toBe('string');
        expect(typeof item.driver.id).toBe('string');
        expect(typeof item.driver.full_name).toBe('string');
        expect(typeof item.driver.phone).toBe('string');
        expect(item.driver.national_id_masked).toMatch(/^\*{4}\d{4}$/);
        expect(typeof item.plan.name).toBe('string');
        expect(typeof item.plan.cost).toBe('number');
        expect(typeof item.plan.is_active).toBe('boolean');
        expect(typeof item.payment_method.name).toBe('string');
        expect(typeof item.screenshot_id).toBe('number');
        expect(typeof item.screenshot_url).toBe('string');
        expect(typeof item.submitted_at).toBe('string');
    });
    it('returns 403 for driver role', async () => {
        const res = await getAgent().get('/api/admin/subscriptions/pending').set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(403);
    });
});
describe('Contract: admin approve/reject', () => {
    it('POST /api/admin/subscriptions/:id/approve returns 200 shape', async () => {
        const res = await getAgent()
            .post(`/api/admin/subscriptions/${pendingSub.id}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(typeof res.body.subscription_id).toBe('string');
        expect(typeof res.body.balance_added).toBe('number');
        expect(typeof res.body.message).toBe('string');
    });
    it('POST /api/admin/subscriptions/:id/reject returns 200 shape', async () => {
        const res = await getAgent()
            .post(`/api/admin/subscriptions/${pendingSub.id}/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ reason: 'Screenshot unclear' });
        expect(res.status).toBe(200);
        expect(res.body.subscription_id).toBe(pendingSub.id);
        expect(typeof res.body.message).toBe('string');
    });
    it('reject without reason returns 422', async () => {
        const res = await getAgent()
            .post(`/api/admin/subscriptions/${pendingSub.id}/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});
        expect(res.status).toBe(422);
    });
});
//# sourceMappingURL=subscription.contract.test.js.map