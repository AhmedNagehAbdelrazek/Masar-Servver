// 1:1 port of Main Server/tests/integration/subscription.test.js (minus the
// expiry-sweep test → Wave 7 jobs), integration/subscriptionDetails.test.js,
// contract/subscription + subscriptionDetails (Wave 4.1).
// DEVIATION (verified): Express forbids manual free-plan subscription, but its
// own test demands one-time free activation (fails 11/12 against Express).
// The port implements the test's rule: first free submit 201, second 422
// FREE_PLAN_ALREADY_USED.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440d01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440d02';

describe('Driver subscription lifecycle', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let plan: { id: string };
  let freePlan: { id: string };
  let method: { id: string };
  let screenshot: { id: number };

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962700000001',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Driver',
        phone: '+962700000002',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, nationalID: 'N7654321' } });
    plan = await ctx.prisma.subscriptionPlan.create({
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
    freePlan = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Free Trial',
        periodDays: 30,
        percentageCut: 0,
        cost: 0,
        isFree: true,
        freeOffer: { type: 'trips', value: 5 },
        isActive: true,
      },
    });
    method = await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });
    screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: 'subscription-screenshot-hash',
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  function submit(planId: string, extra: Record<string, unknown> = {}): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: planId, payment_method_id: method.id, screenshot_id: screenshot.id, ...extra });
  }

  async function approve(id: string): Promise<unknown> {
    return ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
  }

  it('submits a request that appears as pending', async () => {
    const res = await submit(plan.id);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending_approval');

    const list = await ctx.agent.get('/api/subscriptions').set('Authorization', `Bearer ${driverToken}`);
    expect(list.status).toBe(200);
    expect(list.body.subscriptions.length).toBe(1);
    expect(list.body.subscriptions[0].plan.name).toBe('Basic');
    expect(list.body.subscriptions[0].status).toBe('pending_approval');
  });

  it('rejects plain duplicate pending with 409', async () => {
    await submit(plan.id);
    const res = await submit(plan.id);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_SUBSCRIPTION_REQUEST');
  });

  it('resubmits by cancelling the older request', async () => {
    await submit(plan.id);
    const res = await submit(plan.id, { resubmit: true });
    expect(res.status).toBe(201);

    const subs = await ctx.prisma.driverSubscription.findMany({
      where: { driverId: DRIVER_ID, planId: plan.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(subs).toHaveLength(2);
    expect(subs[0].status).toBe('cancelled');
    expect(subs[1].status).toBe('pending_approval');
  });

  it('rejects inactive plan with PLAN_INACTIVE', async () => {
    await ctx.prisma.subscriptionPlan.update({ where: { id: plan.id }, data: { isActive: false } });
    const res = await submit(plan.id);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PLAN_INACTIVE');
  });

  it('rejects inactive payment method', async () => {
    await ctx.prisma.paymentMethod.update({ where: { id: method.id }, data: { isActive: false } });
    const res = await submit(plan.id);
    expect(res.status).toBe(422);
  });

  it('blocks a second free plan activation', async () => {
    const first = await submit(freePlan.id);
    expect(first.status).toBe(201);
    expect(first.body.status).toBe('pending_approval');

    await approve(first.body.subscription_id as string);

    const second = await submit(freePlan.id);
    expect(second.status).toBe(422);
    expect(second.body.code).toBe('FREE_PLAN_ALREADY_USED');
  });

  it('current is null before approval and returns the plan after', async () => {
    const before = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(before.body.subscription).toBeNull();
    expect(before.body.total_balance).toBe(0);

    const created = await submit(plan.id);
    await approve(created.body.subscription_id as string);

    const after = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(after.body.subscription).not.toBeNull();
    expect(after.body.subscription.plan.name).toBe('Basic');
    expect(after.body.subscription.plan.percentage_cut).toBe(8);
    expect(after.body.total_balance).toBe(15);
    expect(after.body.is_in_debt).toBe(false);
  });

  it('activates the shortest-period plan first', async () => {
    const plan30 = await ctx.prisma.subscriptionPlan.create({
      data: { name: '30 Day', periodDays: 30, percentageCut: 10, cost: 100, features: [], isFree: false, isActive: true },
    });
    const plan15 = await ctx.prisma.subscriptionPlan.create({
      data: { name: '15 Day', periodDays: 15, percentageCut: 10, cost: 60, features: [], isFree: false, isActive: true },
    });
    const now = new Date();
    const far = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    for (const [p, balance] of [
      [plan30, 100],
      [plan15, 60],
    ] as const) {
      await ctx.prisma.driverSubscription.create({
        data: {
          driverId: DRIVER_ID,
          planId: p.id,
          planName: p.name,
          planPeriodDays: p.periodDays,
          planPercentageCut: p.percentageCut,
          planCost: p.cost,
          balance,
          paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
          status: 'active',
          approvedAt: now,
          activatedAt: now,
          expiresAt: far,
        },
      });
    }
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { totalBalance: 160, isInDebt: false } });

    const res = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription.plan.name).toBe('15 Day');
  });

  it('uses submission FIFO for same-period plans', async () => {
    const planA = await ctx.prisma.subscriptionPlan.create({
      data: { name: 'Plan A', periodDays: 30, percentageCut: 10, cost: 100, features: [], isFree: false, isActive: true },
    });
    const planB = await ctx.prisma.subscriptionPlan.create({
      data: { name: 'Plan B', periodDays: 30, percentageCut: 10, cost: 100, features: [], isFree: false, isActive: true },
    });
    const now = new Date();
    const far = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    for (const p of [planA, planB]) {
      await ctx.prisma.driverSubscription.create({
        data: {
          driverId: DRIVER_ID,
          planId: p.id,
          planName: p.name,
          planPeriodDays: p.periodDays,
          planPercentageCut: p.percentageCut,
          planCost: p.cost,
          balance: 100,
          paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
          status: 'active',
          approvedAt: now,
          activatedAt: now,
          expiresAt: far,
        },
      });
    }
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { totalBalance: 200, isInDebt: false } });

    const res = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.body.subscription.plan.name).toBe('Plan A');
  });

  it('puts free plans ahead of paid ones', async () => {
    const now = new Date();
    const far = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    for (const [p, balance] of [
      [freePlan, 0],
      [plan, 15],
    ] as const) {
      const full = await ctx.prisma.subscriptionPlan.findUnique({ where: { id: p.id } });
      await ctx.prisma.driverSubscription.create({
        data: {
          driverId: DRIVER_ID,
          planId: p.id,
          planName: full?.name ?? '',
          planPeriodDays: full?.periodDays ?? 30,
          planPercentageCut: full?.percentageCut ?? 0,
          planCost: full?.cost ?? 0,
          balance,
          paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
          status: 'active',
          approvedAt: now,
          activatedAt: now,
          expiresAt: far,
        },
      });
    }
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { totalBalance: 15, isInDebt: false } });

    const res = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.body.subscription.plan.name).toBe('Free Trial');
  });

  it('merges balance on same-plan renewal and resets the period', async () => {
    const now = new Date();
    const far = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER_ID,
        planId: plan.id,
        planName: 'Basic',
        planPeriodDays: 30,
        planPercentageCut: 8,
        planCost: 15,
        balance: 50,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: far,
      },
    });
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { totalBalance: 50, isInDebt: false } });

    const created = await submit(plan.id);
    expect(created.status).toBe(201);
    const approved = await approve(created.body.subscription_id as string);
    expect((approved as { status: number }).status).toBe(200);

    const subs = await ctx.prisma.driverSubscription.findMany({
      where: { driverId: DRIVER_ID, planId: plan.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(subs[0].status).toBe('expired');
    expect(Number(subs[0].balance)).toBe(0);
    expect(subs[1].status).toBe('active');
    expect(Number(subs[1].balance)).toBe(65);
    const periodMs =
      (subs[1].expiresAt?.getTime() ?? 0) - (subs[1].activatedAt?.getTime() ?? 0);
    expect(periodMs).toBeGreaterThan(29.5 * 24 * 3600 * 1000);
    expect(periodMs).toBeLessThan(30.5 * 24 * 3600 * 1000);

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(65);
    expect(user?.isInDebt).toBe(false);
  });
});

describe('Contract: subscriptions', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let passengerToken: string;
  let plan: { id: string };
  let premium: { id: string };
  let method: { id: string };
  let screenshot: { id: number };

  const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440c01';
  const DRIVER2_ID = '550e8400-e29b-41d4-a716-446655440c02';
  const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440c03';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962700000011',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER2_ID,
        fullName: 'Driver',
        phone: '+962700000012',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Passenger',
        phone: '+962700000013',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER2_ID, nationalID: 'N1234567' } });
    plan = await ctx.prisma.subscriptionPlan.create({
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
    premium = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Premium',
        periodDays: 30,
        percentageCut: 10,
        cost: 25,
        features: [],
        isFree: false,
        isActive: true,
      },
    });
    method = await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });
    screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: `sub-shot-${Date.now()}`,
        url: 'https://x/y.jpg',
        filename: 'y.jpg',
        mimetype: 'image/jpeg',
        size: 10,
      },
    });
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER2_ID,
        planId: premium.id,
        planName: 'Premium',
        planPeriodDays: 30,
        planPercentageCut: 10,
        planCost: 25,
        balance: 0,
        screenshotId: screenshot.id,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'x', type: 'bank_account' },
        status: 'pending_approval',
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER2_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('POST creates with envelope + auth matrix', async () => {
    const res = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });

    expect(res.status).toBe(201);
    expect(typeof res.body.subscription_id).toBe('string');
    expect(res.body.status).toBe('pending_approval');
    expect(typeof res.body.message).toBe('string');

    const noAuth = await ctx.agent
      .post('/api/subscriptions')
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(noAuth.status).toBe(401);

    const wrongRole = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(wrongRole.status).toBe(403);
  });

  it('GET lists with shape', async () => {
    const res = await ctx.agent.get('/api/subscriptions').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
    const item = res.body.subscriptions[0] as Record<string, unknown>;
    expect(typeof item.id).toBe('string');
    expect(item.plan).toBeDefined();
    expect(typeof (item.plan as Record<string, unknown>).name).toBe('string');
    expect(typeof (item.plan as Record<string, unknown>).period_days).toBe('number');
    expect(typeof item.balance).toBe('number');
    expect(typeof item.status).toBe('string');
    expect('rejection_reason' in item).toBe(true);
    expect(typeof item.created_at).toBe('string');
  });

  it('GET current shape', async () => {
    const res = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect('subscription' in res.body).toBe(true);
    expect(typeof res.body.total_balance).toBe('number');
    expect(typeof res.body.is_in_debt).toBe('boolean');
  });

  it('GET admin pending queue shape + driver forbidden', async () => {
    const res = await ctx.agent
      .get('/api/admin/subscriptions/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.pending)).toBe(true);
    expect(res.body.pending.length).toBe(1);
    const item = res.body.pending[0] as Record<string, unknown>;
    expect(typeof item.subscription_id).toBe('string');
    const driver = item.driver as Record<string, unknown>;
    expect(typeof driver.id).toBe('string');
    expect(typeof driver.full_name).toBe('string');
    expect(typeof driver.phone).toBe('string');
    expect(driver.national_id_masked).toMatch(/^\*{4}\d{4}$/);
    const planOut = item.plan as Record<string, unknown>;
    expect(typeof planOut.name).toBe('string');
    expect(typeof planOut.cost).toBe('number');
    expect(typeof planOut.is_active).toBe('boolean');
    expect(typeof (item.payment_method as Record<string, unknown>).name).toBe('string');
    expect(typeof item.screenshot_id).toBe('number');
    expect(typeof item.screenshot_url).toBe('string');
    expect(typeof item.submitted_at).toBe('string');

    const forbidden = await ctx.agent
      .get('/api/admin/subscriptions/pending')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('POST approve returns envelope', async () => {
    const pending = await ctx.prisma.driverSubscription.findFirst({
      where: { driverId: DRIVER2_ID, status: 'pending_approval' },
    });
    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${pending?.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.subscription_id).toBe('string');
    expect(typeof res.body.balance_added).toBe('number');
    expect(typeof res.body.message).toBe('string');
  });

  it('POST reject requires reason', async () => {
    const pending = await ctx.prisma.driverSubscription.findFirst({
      where: { driverId: DRIVER2_ID, status: 'pending_approval' },
    });
    const ok = await ctx.agent
      .post(`/api/admin/subscriptions/${pending?.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Screenshot unclear' });
    expect(ok.status).toBe(200);
    expect(ok.body.subscription_id).toBe(pending?.id);
    expect(typeof ok.body.message).toBe('string');

    const pending2 = await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER2_ID,
        planId: plan.id,
        planName: 'Basic',
        planPeriodDays: 30,
        planPercentageCut: 8,
        planCost: 15,
        balance: 0,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'pending_approval',
      },
    });
    const missing = await ctx.agent
      .post(`/api/admin/subscriptions/${pending2.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(missing.status).toBe(422);
  });
});

describe('Contract: driver subscription page', () => {
  let ctx: TestContext;
  let driverToken: string;

  const SUB_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c61';
  const UNVERIFIED_ID = '550e8400-e29b-41d4-a716-446655440c62';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: SUB_DRIVER_ID,
        fullName: 'Sub Driver',
        phone: '+962700000061',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: UNVERIFIED_ID,
        fullName: 'Unverified',
        phone: '+962700000062',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: false,
      },
    });
    const pro = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Pro',
        periodDays: 30,
        percentageCut: 10,
        cost: 16,
        features: [],
        isFree: false,
        isActive: true,
      },
    });
    const now = new Date();
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: SUB_DRIVER_ID,
        planId: pro.id,
        planName: 'Pro',
        planPeriodDays: 30,
        planPercentageCut: 10,
        planCost: 16,
        balance: 12.4,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: new Date(now.getTime() - 11 * 24 * 3600 * 1000),
        expiresAt: new Date(now.getTime() + 19 * 24 * 3600 * 1000),
      },
    });
    await ctx.prisma.user.update({
      where: { id: SUB_DRIVER_ID },
      data: { totalBalance: 12.4, isInDebt: false },
    });
    driverToken = generateAccessToken({ id: SUB_DRIVER_ID, role: 'driver' });
  });

  it('returns current plan with tier/days and history', async () => {
    const res = await ctx.agent
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.subscription).toBe('object');
    expect(typeof res.body.subscription.tier).toBe('string');
    expect(typeof res.body.subscription.price).toBe('number');
    expect(res.body.subscription.currency).toBe('JOD');
    expect(typeof res.body.subscription.expires_at).toBe('string');
    expect(typeof res.body.subscription.days_remaining).toBe('number');
    expect(typeof res.body.subscription.balance).toBe('number');
    expect(typeof res.body.subscription.plan_name).toBe('string');
    expect('free_trips' in res.body.subscription).toBe(true);
    expect(res.body.subscription.free_trips).toBeNull();
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('returns null subscription with empty history when none', async () => {
    await ctx.prisma.driverSubscription.deleteMany({ where: { driverId: SUB_DRIVER_ID } });
    const res = await ctx.agent
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
    expect(res.body.history).toEqual([]);
  });

  it('rejects unverified driver with 403', async () => {
    const token = generateAccessToken({ id: UNVERIFIED_ID, role: 'driver' });
    const res = await ctx.agent
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('exposes free-trips counters for trips-offer plans', async () => {
    const starter = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Starter',
        periodDays: 30,
        percentageCut: 0,
        cost: 0,
        features: [],
        isFree: true,
        freeOffer: { type: 'trips', value: 5 },
        isActive: true,
      },
    });
    await ctx.prisma.driverSubscription.deleteMany({ where: { driverId: SUB_DRIVER_ID } });
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: SUB_DRIVER_ID,
        planId: starter.id,
        planName: 'Starter',
        planPeriodDays: 30,
        planPercentageCut: 0,
        planCost: 0,
        balance: 0,
        paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
        status: 'active',
        approvedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        freeOffer: { type: 'trips', value: 5 },
        freeTripsUsed: 4,
      },
    });

    const res = await ctx.agent
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.free_trips).toEqual({ max: 5, used: 4, remaining: 1 });
    expect(res.body.subscription.balance).toBe(0);
    expect(res.body.subscription.price).toBe(0);
  });

  it('rejects anonymous with 401', async () => {
    const res = await ctx.agent.get('/api/driver/subscription');
    expect(res.status).toBe(401);
  });
});

// Port of Main Server/tests/integration/adminSubscription.test.js (gaps only).
// Pending-queue shape + approve/reject envelopes are covered above; these
// blocks assert the admin behaviors that had no coverage: exact masked
// national id, balance credit + expiry timestamps, debt clearing,
// first-action-wins 409s, APPROVAL_BLOCKED on deactivated plans, adminNotes
// persistence and empty-reason 422.
describe('Admin subscriptions - pending queue details', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let plan: { id: string };
  let method: { id: string };
  let screenshot: { id: number };

  const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440e01';
  const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e02';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962710000301',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Driver Three',
        phone: '+962710000302',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, nationalID: 'N5554443' } });
    plan = await ctx.prisma.subscriptionPlan.create({
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
    method = await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });
    screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: `admin-sub-shot-${Date.now()}`,
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'admin-subscription-screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  async function createPending(): Promise<string> {
    const res = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(res.status).toBe(201);
    return res.body.subscription_id as string;
  }

  it('lists pending requests with masked national id', async () => {
    await createPending();

    const res = await ctx.agent
      .get('/api/admin/subscriptions/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pending).toHaveLength(1);
    expect(res.body.pending[0].driver.national_id_masked).toBe('****4443');
    expect(res.body.pending[0].driver.full_name).toBe('Driver Three');
    expect(res.body.pending[0].plan.name).toBe('Basic');
    expect(res.body.pending[0].payment_method.name).toBe('Bank of Jordan');
    expect(res.body.pending[0].screenshot_id).toBe(screenshot.id);
    expect(res.body.pending[0].screenshot_url).toContain('res.cloudinary.com');
  });
});

describe('Admin subscriptions - approval details', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let plan: { id: string };
  let method: { id: string };
  let screenshot: { id: number };

  const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440e01';
  const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e02';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962710000301',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Driver Three',
        phone: '+962710000302',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, nationalID: 'N5554443' } });
    plan = await ctx.prisma.subscriptionPlan.create({
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
    method = await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });
    screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: `admin-approve-shot-${Date.now()}`,
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'admin-subscription-screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  async function createPending(): Promise<string> {
    const res = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(res.status).toBe(201);
    return res.body.subscription_id as string;
  }

  it('approves, credits balance, sets expiry and activates the plan', async () => {
    const id = await createPending();

    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription_id).toBe(id);
    expect(res.body.balance_added).toBe(15);

    const sub = await ctx.prisma.driverSubscription.findUnique({ where: { id } });
    expect(sub?.status).toBe('active');
    expect(sub?.approvedAt).not.toBeNull();
    expect(sub?.activatedAt).not.toBeNull();
    expect(sub?.expiresAt).not.toBeNull();
    expect(Number(sub?.balance)).toBe(15);

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(15);
    expect(user?.isInDebt).toBe(false);
  });

  it('clears debt before adding positive balance', async () => {
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { totalBalance: -10, isInDebt: true },
    });

    const id = await createPending();
    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.balance_added).toBe(15);

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(5);
    expect(user?.isInDebt).toBe(false);
  });

  it('is first-action-wins: second approve returns 409 REQUEST_ALREADY_PROCESSED', async () => {
    const id = await createPending();

    const first = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(first.status).toBe(200);

    const second = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('REQUEST_ALREADY_PROCESSED');
  });

  it('is blocked when the plan is deactivated (APPROVAL_BLOCKED)', async () => {
    const id = await createPending();
    await ctx.prisma.subscriptionPlan.update({ where: { id: plan.id }, data: { isActive: false } });

    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('APPROVAL_BLOCKED');
  });
});

describe('Admin subscriptions - rejection details', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let plan: { id: string };
  let method: { id: string };
  let screenshot: { id: number };

  const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440e01';
  const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e02';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962710000301',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Driver Three',
        phone: '+962710000302',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, nationalID: 'N5554443' } });
    plan = await ctx.prisma.subscriptionPlan.create({
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
    method = await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });
    screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: `admin-reject-shot-${Date.now()}`,
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'admin-subscription-screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  async function createPending(): Promise<string> {
    const res = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(res.status).toBe(201);
    return res.body.subscription_id as string;
  }

  it('rejects with a reason and records admin_notes', async () => {
    const id = await createPending();

    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Payment proof unclear' });
    expect(res.status).toBe(200);
    expect(res.body.subscription_id).toBe(id);

    const sub = await ctx.prisma.driverSubscription.findUnique({ where: { id } });
    expect(sub?.status).toBe('rejected');
    expect(sub?.adminNotes).toBe('Payment proof unclear');
  });

  it('reject is first-action-wins after approval', async () => {
    const id = await createPending();
    await ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Too late' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('REQUEST_ALREADY_PROCESSED');
  });

  it('reject requires a non-empty reason (422)', async () => {
    const id = await createPending();
    const res = await ctx.agent
      .post(`/api/admin/subscriptions/${id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: '' });
    expect(res.status).toBe(422);
  });
});

describe('Money-race hardening - free re-subscribe and double approve', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
  let plan: { id: string };
  let freePlan: { id: string };
  let method: { id: string };
  let screenshot: { id: number };

  const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440f01';
  const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440f02';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962720000301',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Race Driver',
        phone: '+962720000302',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, nationalID: 'N9998887' } });
    plan = await ctx.prisma.subscriptionPlan.create({
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
    freePlan = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Free Trial',
        periodDays: 30,
        percentageCut: 0,
        cost: 0,
        isFree: true,
        freeOffer: { type: 'trips', value: 5 },
        isActive: true,
      },
    });
    method = await ctx.prisma.paymentMethod.create({
      data: {
        name: 'Bank of Jordan',
        accountNumber: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
        isActive: true,
      },
    });
    screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: 'money-race-screenshot-hash',
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  function submit(planId: string): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: planId, payment_method_id: method.id, screenshot_id: screenshot.id });
  }

  async function approve(id: string): Promise<ReturnType<TestContext['agent']['post']>> {
    return ctx.agent
      .post(`/api/admin/subscriptions/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
  }

  it('blocks a second free subscribe after the first free row expired (422)', async () => {
    const first = await submit(freePlan.id);
    expect(first.status).toBe(201);

    await ctx.prisma.driverSubscription.updateMany({
      where: { driverId: DRIVER_ID },
      data: { status: 'expired' },
    });

    const second = await submit(freePlan.id);
    expect(second.status).toBe(422);
    expect(second.body.code).toBe('FREE_PLAN_ALREADY_USED');
  });

  it('double approve conflicts and credits the balance exactly once', async () => {
    const created = await submit(plan.id);
    expect(created.status).toBe(201);
    const id = created.body.subscription_id as string;

    const firstApprove = await approve(id);
    expect(firstApprove.status).toBe(200);
    const balanceAdded = (firstApprove.body as { balance_added: number }).balance_added;

    const secondApprove = await approve(id);
    expect(secondApprove.status).toBe(409);
    expect((secondApprove.body as { code: string }).code).toBe('REQUEST_ALREADY_PROCESSED');

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(balanceAdded);
  });
});
