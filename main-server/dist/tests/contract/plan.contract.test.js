"use strict";
const { getAgent } = require('../setup/setup');
const { User, SubscriptionPlan, PaymentMethod } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440a01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440a02';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440a03';
let adminToken;
let driverToken;
let passengerToken;
beforeEach(async () => {
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await PaymentMethod.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962710000001', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
    await User.create({ id: DRIVER_ID, fullName: 'Driver', phone: '+962710000002', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
    await User.create({ id: PASSENGER_ID, fullName: 'Passenger', phone: '+962710000003', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});
const PLAN_BODY = {
    name: 'Basic',
    period_days: 30,
    percentage_cut: 8,
    cost: 15,
    status: 'popular',
    features: ['no booking fees'],
    is_free: false,
};
const METHOD_BODY = {
    name: 'Bank of Jordan',
    account_number: 'JO94BOJX0000000000',
    type: 'bank_account',
    email: 'payments@boj.com',
};
describe('Contract: GET /api/plans', () => {
    beforeEach(async () => {
        await SubscriptionPlan.create({
            name: 'Basic',
            periodDays: 30,
            percentageCut: 8,
            cost: 15,
            status: 'popular',
            features: ['no booking fees'],
            isFree: false,
            isActive: true,
        });
        await SubscriptionPlan.create({
            name: 'Free Trial',
            periodDays: 30,
            percentageCut: 0,
            cost: 0,
            features: [],
            isFree: true,
            freeOffer: { type: 'trips', value: 5 },
            isActive: true,
        });
    });
    it('should return 200 with plans array shape', async () => {
        const res = await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.plans).toBeDefined();
        expect(Array.isArray(res.body.plans)).toBe(true);
        expect(res.body.plans.length).toBe(2);
        for (const plan of res.body.plans) {
            expect(typeof plan.id).toBe('string');
            expect(typeof plan.name).toBe('string');
            expect(typeof plan.period_days).toBe('number');
            expect(typeof plan.percentage_cut).toBe('number');
            expect(typeof plan.cost).toBe('number');
            expect(Array.isArray(plan.features)).toBe(true);
            expect(typeof plan.is_free).toBe('boolean');
            expect('status' in plan).toBe(true);
        }
        const free = res.body.plans.find((p) => p.is_free);
        expect(free.free_offer).toEqual({ type: 'trips', value: 5 });
    });
    it('should return 401 without auth', async () => {
        const res = await getAgent().get('/api/plans');
        expect(res.status).toBe(401);
    });
    it('should return 403 for passenger role', async () => {
        const res = await getAgent().get('/api/plans').set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
    });
});
describe('Contract: GET /api/payment-methods', () => {
    beforeEach(async () => {
        await PaymentMethod.create({
            name: 'Bank of Jordan',
            accountNumber: 'JO94BOJX0000000000',
            type: 'bank_account',
            email: 'payments@boj.com',
            isActive: true,
        });
    });
    it('should return 401 without auth (US4: no public exposure)', async () => {
        const res = await getAgent().get('/api/payment-methods');
        expect(res.status).toBe(401);
    });
    it('should return 200 with methods array shape for authenticated users', async () => {
        const res = await getAgent()
            .get('/api/payment-methods')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.methods).toBeDefined();
        expect(Array.isArray(res.body.methods)).toBe(true);
        expect(res.body.methods.length).toBe(1);
        const method = res.body.methods[0];
        expect(typeof method.id).toBe('string');
        expect(typeof method.name).toBe('string');
        expect(typeof method.account_number).toBe('string');
        expect(typeof method.type).toBe('string');
        expect('email' in method).toBe(true);
    });
});
describe('Contract: Admin plan management', () => {
    it('POST /api/admin/plans returns 201 with created plan', async () => {
        const res = await getAgent()
            .post('/api/admin/plans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(PLAN_BODY);
        expect(res.status).toBe(201);
        expect(res.body.plan).toBeDefined();
        expect(typeof res.body.plan.id).toBe('string');
        expect(res.body.plan.name).toBe('Basic');
        expect(res.body.plan.is_active).toBe(true);
    });
    it('POST /api/admin/plans returns 422 with error shape on validation failure', async () => {
        const res = await getAgent()
            .post('/api/admin/plans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: '' });
        expect(res.status).toBe(422);
        expect(res.body.status).toBe('error');
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
    it('GET /api/admin/plans returns all plans including inactive', async () => {
        await SubscriptionPlan.create({ name: 'Inactive Plan', periodDays: 30, percentageCut: 5, cost: 10, features: [], isFree: false, isActive: false });
        const res = await getAgent().get('/api/admin/plans').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.plans.length).toBe(1);
        expect(res.body.plans[0].is_active).toBe(false);
    });
    it('PUT /api/admin/plans/:id returns 200 with updated plan', async () => {
        const created = await getAgent()
            .post('/api/admin/plans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(PLAN_BODY);
        const res = await getAgent()
            .put(`/api/admin/plans/${created.body.plan.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ cost: 20 });
        expect(res.status).toBe(200);
        expect(res.body.plan.cost).toBe(20);
    });
    it('DELETE /api/admin/plans/:id returns 200 with deactivation message', async () => {
        const created = await getAgent()
            .post('/api/admin/plans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(PLAN_BODY);
        const res = await getAgent()
            .delete(`/api/admin/plans/${created.body.plan.id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deactivat/i);
    });
});
describe('Contract: Admin payment method management', () => {
    it('POST /api/admin/payment-methods returns 201', async () => {
        const res = await getAgent()
            .post('/api/admin/payment-methods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(METHOD_BODY);
        expect(res.status).toBe(201);
        expect(res.body.method).toBeDefined();
        expect(typeof res.body.method.id).toBe('string');
        expect(res.body.method.account_number).toBe('JO94BOJX0000000000');
    });
    it('GET /api/admin/payment-methods lists methods', async () => {
        const res = await getAgent().get('/api/admin/payment-methods').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.methods).toBeDefined();
    });
});
//# sourceMappingURL=plan.contract.test.js.map