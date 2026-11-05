const { getAgent, getRedisStore } = require('../setup/setup');
const { User, SubscriptionPlan, PaymentMethod } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440b01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440b02';

let adminToken;
let driverToken;

beforeEach(async () => {
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await PaymentMethod.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962720000001', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: DRIVER_ID, fullName: 'Driver', phone: '+962720000002', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

const PLAN_BODY = {
  name: 'Basic',
  period_days: 30,
  percentage_cut: 8,
  cost: 15,
  features: ['no booking fees'],
  is_free: false,
};

const FREE_PLAN_BODY = {
  name: 'Free Trial',
  period_days: 30,
  percentage_cut: 0,
  cost: 0,
  features: [],
  is_free: true,
  free_offer: { type: 'trips', value: 5 },
};

describe('Plan catalog - US1', () => {
  it('admin creates a plan and driver sees it in GET /plans', async () => {
    const created = await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_BODY);

    expect(created.status).toBe(201);

    const res = await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(1);
    expect(res.body.plans[0].name).toBe('Basic');
    expect(res.body.plans[0].cost).toBe(15);
    expect(res.body.plans[0].percentage_cut).toBe(8);
  });

  it('deactivating a plan hides it from drivers', async () => {
    const created = await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_BODY);

    await getAgent()
      .delete(`/api/admin/plans/${created.body.plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(0);
  });

  it('driver GET /plans uses the Redis plan cache', async () => {
    await SubscriptionPlan.create({
      name: 'Basic',
      periodDays: 30,
      percentageCut: 8,
      cost: 15,
      features: [],
      isFree: false,
      isActive: true,
    });

    const first = await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(first.body.plans).toHaveLength(1);

    const store = getRedisStore();
    expect(store.has('plans:active')).toBe(true);

    const second = await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(second.body.plans).toHaveLength(1);
  });

  it('admin can list all plans including inactive ones', async () => {
    const created = await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_BODY);

    await getAgent()
      .delete(`/api/admin/plans/${created.body.plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await getAgent()
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(1);
    expect(res.body.plans[0].is_active).toBe(false);
  });

  it('admin updating a missing plan returns 404', async () => {
    const res = await getAgent()
      .put('/api/admin/plans/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost: 20 });

    expect(res.status).toBe(404);
  });

  it('admin plan change invalidates the plans:active cache', async () => {
    await SubscriptionPlan.create({
      name: 'Basic',
      periodDays: 30,
      percentageCut: 8,
      cost: 15,
      features: [],
      isFree: false,
      isActive: true,
    });

    await getAgent().get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(getRedisStore().has('plans:active')).toBe(true);

    const plan = await SubscriptionPlan.findOne({ where: { name: 'Basic' } });
    await getAgent()
      .put(`/api/admin/plans/${plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost: 20 });

    expect(getRedisStore().has('plans:active')).toBe(false);
  });
});

describe('Free plan single-instance rule - US1', () => {
  it('allows creating one free plan', async () => {
    const res = await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(FREE_PLAN_BODY);

    expect(res.status).toBe(201);
    expect(res.body.plan.is_free).toBe(true);
  });

  it('rejects a second active free plan', async () => {
    await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(FREE_PLAN_BODY);

    const res = await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...FREE_PLAN_BODY, name: 'Free Trial 2' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('FREE_PLAN_EXISTS');
  });

  it('rejects free plan without free_offer', async () => {
    const res = await getAgent()
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...FREE_PLAN_BODY, free_offer: undefined });

    expect(res.status).toBe(422);
  });
});

describe('Payment method catalog - US1', () => {
  it('admin creates a payment method and authenticated users see it', async () => {
    await getAgent()
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bank of Jordan',
        account_number: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
      });

    const res = await getAgent()
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toHaveLength(1);
    expect(res.body.methods[0].type).toBe('bank_account');
  });

  it('deactivating a method hides it from the list', async () => {
    const created = await getAgent()
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover', account_number: 'CL-0001', type: 'e-wallet' });

    await getAgent()
      .delete(`/api/admin/payment-methods/${created.body.method.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await getAgent()
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.body.methods).toHaveLength(0);
  });

  it('admin updates a payment method', async () => {
    const created = await getAgent()
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover', account_number: 'CL-0001', type: 'e-wallet' });

    const res = await getAgent()
      .put(`/api/admin/payment-methods/${created.body.method.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover Pay', type: 'mobile_money' });

    expect(res.status).toBe(200);
    expect(res.body.method.name).toBe('Clover Pay');
    expect(res.body.method.type).toBe('mobile_money');

    const list = await getAgent()
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(list.body.methods[0].name).toBe('Clover Pay');
  });

  it('admin updating a missing payment method returns 404', async () => {
    const res = await getAgent()
      .put('/api/admin/payment-methods/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('admin can list all payment methods including inactive', async () => {
    const created = await getAgent()
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover', account_number: 'CL-0001', type: 'e-wallet' });

    await getAgent()
      .delete(`/api/admin/payment-methods/${created.body.method.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await getAgent()
      .get('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toHaveLength(1);
    expect(res.body.methods[0].is_active).toBe(false);
  });

  it('rejects invalid payment method type', async () => {
    const res = await getAgent()
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', account_number: 'X', type: 'crypto' });

    expect(res.status).toBe(422);
  });
});
