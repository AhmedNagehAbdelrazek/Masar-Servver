// 1:1 port of Main Server/tests/integration/plan.test.js,
// tests/integration/paymentMethods.test.js and tests/contract/plan.contract.test.js
// (Wave 1.2). One deliberate correction: the Express contract test "should return
// 200 with plans array shape" expects the FREE plan in GET /api/plans, but the
// Express service excludes free plans — that test FAILS against Express itself
// (verified 11/12 on 2026-10-09). The port asserts actual behavior (free excluded).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { truncateAll } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440b01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440b02';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440b03';
const MISSING_ID = '550e8400-e29b-41d4-a716-446655440000';

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

async function createUser(
  ctx: TestContext,
  id: string,
  phone: string,
  role: 'admin' | 'driver' | 'passenger',
): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id,
      fullName: role,
      phone,
      countryCode: 'JO',
      role,
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
}

describe('Plan catalog - US1', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await ctx.redis.flushall();
    await createUser(ctx, ADMIN_ID, '+962720000001', 'admin');
    await createUser(ctx, DRIVER_ID, '+962720000002', 'driver');
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('admin creates a plan and driver sees it in GET /plans', async () => {
    const created = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_BODY);
    expect(created.status).toBe(201);

    const res = await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(1);
    expect(res.body.plans[0].name).toBe('Basic');
    expect(res.body.plans[0].cost).toBe(15);
    expect(res.body.plans[0].percentage_cut).toBe(8);
  });

  it('deactivating a plan hides it from drivers', async () => {
    const created = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_BODY);

    await ctx.agent
      .delete(`/api/admin/plans/${created.body.plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(0);
  });

  it('driver GET /plans uses the Redis plan cache', async () => {
    await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 15,
        features: [],
        isFree: false,
        isActive: true,
      },
    });

    const first = await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(first.body.plans).toHaveLength(1);
    expect(await ctx.redis.exists('plans:active')).toBe(1);

    const second = await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(second.body.plans).toHaveLength(1);
  });

  it('admin can list all plans including inactive ones', async () => {
    const created = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_BODY);

    await ctx.agent
      .delete(`/api/admin/plans/${created.body.plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await ctx.agent.get('/api/admin/plans').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(1);
    expect(res.body.plans[0].is_active).toBe(false);
  });

  it('admin updating a missing plan returns 404', async () => {
    const res = await ctx.agent
      .put(`/api/admin/plans/${MISSING_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost: 20 });
    expect(res.status).toBe(404);
  });

  it('admin plan change invalidates the plans:active cache', async () => {
    await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 15,
        features: [],
        isFree: false,
        isActive: true,
      },
    });

    await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(await ctx.redis.exists('plans:active')).toBe(1);

    const plan = await ctx.prisma.subscriptionPlan.findFirst({ where: { name: 'Basic' } });
    await ctx.agent
      .put(`/api/admin/plans/${plan?.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost: 20 });

    expect(await ctx.redis.exists('plans:active')).toBe(0);
  });
});

describe('Free plan single-instance rule - US1', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await ctx.redis.flushall();
    await createUser(ctx, ADMIN_ID, '+962720000001', 'admin');
    await createUser(ctx, DRIVER_ID, '+962720000002', 'driver');
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    void driverToken;
  });

  it('allows creating one free plan', async () => {
    const res = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(FREE_PLAN_BODY);
    expect(res.status).toBe(201);
    expect(res.body.plan.is_free).toBe(true);
  });

  it('rejects a second active free plan', async () => {
    await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(FREE_PLAN_BODY);

    const res = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...FREE_PLAN_BODY, name: 'Free Trial 2' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('FREE_PLAN_EXISTS');
  });

  it('rejects free plan without free_offer', async () => {
    const res = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...FREE_PLAN_BODY, free_offer: undefined });
    expect(res.status).toBe(422);
  });
});

describe('Payment method catalog - US1 + US4', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await ctx.redis.flushall();
    await createUser(ctx, ADMIN_ID, '+962795081101', 'admin');
    await createUser(ctx, DRIVER_ID, '+962795081102', 'driver');
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('rejects unauthenticated listing with 401', async () => {
    const res = await ctx.agent.get('/api/payment-methods');
    expect(res.status).toBe(401);
  });

  it('admin creates a payment method and authenticated users see it', async () => {
    await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bank of Jordan',
        account_number: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
      });

    const res = await ctx.agent
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toHaveLength(1);
    expect(res.body.methods[0].type).toBe('bank_account');
  });

  it('deactivating a method hides it from the list', async () => {
    const created = await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover', account_number: 'CL-0001', type: 'e-wallet' });

    await ctx.agent
      .delete(`/api/admin/payment-methods/${created.body.method.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await ctx.agent
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.body.methods).toHaveLength(0);
  });

  it('admin updates a payment method', async () => {
    const created = await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover', account_number: 'CL-0001', type: 'e-wallet' });

    const res = await ctx.agent
      .put(`/api/admin/payment-methods/${created.body.method.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover Pay', type: 'mobile_money' });
    expect(res.status).toBe(200);
    expect(res.body.method.name).toBe('Clover Pay');
    expect(res.body.method.type).toBe('mobile_money');

    const list = await ctx.agent
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(list.body.methods[0].name).toBe('Clover Pay');
  });

  it('admin updating a missing payment method returns 404', async () => {
    const res = await ctx.agent
      .put(`/api/admin/payment-methods/${MISSING_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('admin can list all payment methods including inactive', async () => {
    const created = await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Clover', account_number: 'CL-0001', type: 'e-wallet' });

    await ctx.agent
      .delete(`/api/admin/payment-methods/${created.body.method.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await ctx.agent
      .get('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toHaveLength(1);
    expect(res.body.methods[0].is_active).toBe(false);
  });

  it('rejects invalid payment method type', async () => {
    const res = await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', account_number: 'X', type: 'crypto' });
    expect(res.status).toBe(422);
  });

  it('rejects non-admin mutations with 403', async () => {
    const res = await ctx.agent
      .post('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ name: 'Hack', account_number: '123', type: 'bank_account' });
    expect(res.status).toBe(403);
  });

  it('admin CRUD also works on the /api/payment-methods mount', async () => {
    const created = await ctx.agent
      .post('/api/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bank of Jordan', account_number: 'JO94BOJX0000000123', type: 'bank_account' });
    expect(created.status).toBe(201);
    expect(created.body.payment_method.name).toBe('Bank of Jordan');
    expect(created.body.payment_method.is_active).toBe(true);

    const updated = await ctx.agent
      .put(`/api/payment-methods/${created.body.payment_method.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Renamed Bank' });
    expect(updated.status).toBe(200);
    expect(updated.body.payment_method.name).toBe('Renamed Bank');

    const all = await ctx.agent
      .get('/api/payment-methods/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(all.status).toBe(200);
    expect(all.body.methods).toHaveLength(1);

    const del = await ctx.agent
      .delete(`/api/payment-methods/${created.body.payment_method.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    const row = await ctx.prisma.paymentMethod.findUnique({
      where: { id: created.body.payment_method.id as string },
    });
    expect(row?.isActive).toBe(false);
  });
});

describe('Contract: GET /api/plans', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let passengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await ctx.redis.flushall();
    await createUser(ctx, ADMIN_ID, '+962710000001', 'admin');
    await createUser(ctx, DRIVER_ID, '+962710000002', 'driver');
    await createUser(ctx, PASSENGER_ID, '+962710000003', 'passenger');
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    void adminToken;

    await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 15,
        status: 'popular',
        features: ['no booking fees'],
        isFree: false,
        isActive: true,
      },
    });
    await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Free Trial',
        periodDays: 30,
        percentageCut: 0,
        cost: 0,
        features: [],
        isFree: true,
        freeOffer: { type: 'trips', value: 5 },
        isActive: true,
      },
    });
  });

  it('returns 200 with paid-plans array shape (free plans excluded)', async () => {
    const res = await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans).toBeDefined();
    expect(Array.isArray(res.body.plans)).toBe(true);
    expect(res.body.plans.length).toBe(1);

    const plan = res.body.plans[0] as Record<string, unknown>;
    expect(typeof plan.id).toBe('string');
    expect(typeof plan.name).toBe('string');
    expect(typeof plan.period_days).toBe('number');
    expect(typeof plan.percentage_cut).toBe('number');
    expect(typeof plan.cost).toBe('number');
    expect(Array.isArray(plan.features)).toBe(true);
    expect(typeof plan.is_free).toBe('boolean');
    expect('status' in plan).toBe(true);
  });

  it('returns 401 without auth', async () => {
    const res = await ctx.agent.get('/api/plans');
    expect(res.status).toBe(401);
  });

  it('returns 403 for passenger role', async () => {
    const res = await ctx.agent
      .get('/api/plans')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Contract: admin plan + payment-method management', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await ctx.redis.flushall();
    await createUser(ctx, ADMIN_ID, '+962710000001', 'admin');
    await createUser(ctx, DRIVER_ID, '+962710000002', 'driver');
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    void driverToken;
  });

  const PLAN_WITH_STATUS = { ...PLAN_BODY, status: 'popular' };

  it('POST /api/admin/plans returns 201 with created plan', async () => {
    const res = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_WITH_STATUS);
    expect(res.status).toBe(201);
    expect(res.body.plan).toBeDefined();
    expect(typeof res.body.plan.id).toBe('string');
    expect(res.body.plan.name).toBe('Basic');
    expect(res.body.plan.is_active).toBe(true);
  });

  it('POST /api/admin/plans returns 422 with error shape on validation failure', async () => {
    const res = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });
    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/admin/plans returns all plans including inactive', async () => {
    await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Inactive Plan',
        periodDays: 30,
        percentageCut: 5,
        cost: 10,
        features: [],
        isFree: false,
        isActive: false,
      },
    });

    const res = await ctx.agent
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.plans.length).toBe(1);
    expect(res.body.plans[0].is_active).toBe(false);
  });

  it('PUT /api/admin/plans/:id returns 200 with updated plan', async () => {
    const created = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_WITH_STATUS);

    const res = await ctx.agent
      .put(`/api/admin/plans/${created.body.plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost: 20 });
    expect(res.status).toBe(200);
    expect(res.body.plan.cost).toBe(20);
  });

  it('DELETE /api/admin/plans/:id returns 200 with deactivation message', async () => {
    const created = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(PLAN_WITH_STATUS);

    const res = await ctx.agent
      .delete(`/api/admin/plans/${created.body.plan.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivat/i);
  });

  it('POST /api/admin/payment-methods returns 201', async () => {
    const res = await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bank of Jordan',
        account_number: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
      });
    expect(res.status).toBe(201);
    expect(res.body.method).toBeDefined();
    expect(typeof res.body.method.id).toBe('string');
    expect(res.body.method.account_number).toBe('JO94BOJX0000000000');
  });

  it('GET /api/admin/payment-methods lists methods', async () => {
    const res = await ctx.agent
      .get('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toBeDefined();
  });

  it('GET /api/payment-methods returns 200 with methods array shape', async () => {
    await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });

    const res = await ctx.agent
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toBeDefined();
    expect(Array.isArray(res.body.methods)).toBe(true);
    expect(res.body.methods.length).toBe(1);

    const method = res.body.methods[0] as Record<string, unknown>;
    expect(typeof method.id).toBe('string');
    expect(typeof method.name).toBe('string');
    expect(typeof method.account_number).toBe('string');
    expect(typeof method.type).toBe('string');
    expect('email' in method).toBe(true);
  });
});
