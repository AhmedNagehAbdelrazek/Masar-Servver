"use strict";
const { getAgent } = require('../setup/setup');
const { User, PaymentMethod, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const ADMIN_ID = 'f6000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'f6000000-0000-4000-8000-000000000002';
const ADMIN_PHONE = '+962795081101';
const DRIVER_PHONE = '+962795081102';
let adminToken;
let driverToken;
beforeEach(async () => {
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true }).catch(() => { });
    await PaymentMethod.destroy({ where: {}, force: true });
    await User.destroy({ where: { phone: [ADMIN_PHONE, DRIVER_PHONE] }, force: true });
    await User.create({
        id: ADMIN_ID,
        fullName: 'Methods Admin',
        phone: ADMIN_PHONE,
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Methods Driver',
        phone: DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
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
        driverId: DRIVER_ID,
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
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
});
describe('US4 - payment method endpoints require authentication', () => {
    it('should reject unauthenticated listing', async () => {
        const res = await getAgent().get('/api/payment-methods');
        expect(res.status).toBe(401);
    });
    it('should allow authenticated users to list active methods', async () => {
        await PaymentMethod.create({
            name: 'Zain Cash',
            accountNumber: '962790000000',
            type: 'mobile_money',
            isActive: true,
        });
        const res = await getAgent()
            .get('/api/payment-methods')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.methods.length).toBe(1);
        expect(res.body.methods[0].name).toBe('Zain Cash');
    });
    it('should not list deactivated methods for regular users', async () => {
        await PaymentMethod.create({
            name: 'Old Wallet',
            accountNumber: '962791111111',
            type: 'e-wallet',
            isActive: false,
        });
        const res = await getAgent()
            .get('/api/payment-methods')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.methods.length).toBe(0);
    });
});
describe('US4 - admin CRUD for payment methods', () => {
    it('should reject non-admin mutations', async () => {
        const res = await getAgent()
            .post('/api/payment-methods')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ name: 'Hack', account_number: '123', type: 'bank_account' });
        expect(res.status).toBe(403);
    });
    it('should let an admin create a method', async () => {
        const res = await getAgent()
            .post('/api/payment-methods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Bank of Jordan',
            account_number: 'JO94BOJX0000000123',
            type: 'bank_account',
        });
        expect(res.status).toBe(201);
        expect(res.body.payment_method.name).toBe('Bank of Jordan');
        expect(res.body.payment_method.is_active).toBe(true);
    });
    it('should validate the payload', async () => {
        const res = await getAgent()
            .post('/api/payment-methods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'X', account_number: '123', type: 'crypto' });
        expect(res.status).toBe(422);
    });
    it('should list all methods including inactive for admins', async () => {
        await PaymentMethod.create({
            name: 'Active One',
            accountNumber: 'A-1',
            type: 'bank_account',
            isActive: true,
        });
        await PaymentMethod.create({
            name: 'Retired One',
            accountNumber: 'A-2',
            type: 'e-wallet',
            isActive: false,
        });
        const res = await getAgent()
            .get('/api/payment-methods/all')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.methods.length).toBe(2);
    });
    it('should update a method', async () => {
        const method = await PaymentMethod.create({
            name: 'Rename Me',
            accountNumber: 'R-1',
            type: 'bank_account',
            isActive: true,
        });
        const res = await getAgent()
            .put(`/api/payment-methods/${method.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Renamed Bank' });
        expect(res.status).toBe(200);
        expect(res.body.payment_method.name).toBe('Renamed Bank');
    });
    it('should soft-delete a method and hide it from the active list', async () => {
        const method = await PaymentMethod.create({
            name: 'Doomed Wallet',
            accountNumber: 'D-1',
            type: 'e-wallet',
            isActive: true,
        });
        const del = await getAgent()
            .delete(`/api/payment-methods/${method.id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(del.status).toBe(200);
        const row = await PaymentMethod.findByPk(method.id);
        expect(row.isActive).toBe(false);
        const active = await getAgent()
            .get('/api/payment-methods')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(active.body.methods.length).toBe(0);
    });
});
//# sourceMappingURL=paymentMethods.test.js.map