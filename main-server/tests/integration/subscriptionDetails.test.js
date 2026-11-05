const { getAgent } = require('../setup/setup');
const { User, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS, USER_STATUS } = require('../../config/constants');

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c71';
const NO_PLAN_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c72';
const SUSPENDED_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c73';

const DAY_MS = 24 * 60 * 60 * 1000;

let driverToken;
let noPlanToken;
let suspendedToken;

async function seedDriver(userId, phone, { isVerified = true, status = 'active' } = {}) {
  await User.create({
    id: userId,
    fullName: `Driver ${userId.slice(-2)}`,
    phone,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified,
    status,
  });
  await DriverProfile.create({ driverId: userId });
}

async function createPlan(name) {
  return SubscriptionPlan.create({
    name,
    periodDays: 30,
    percentageCut: 10,
    cost: 16,
    features: [],
    isFree: false,
    isActive: true,
  });
}

async function seedSubscription(userId, plan, { balance, status, createdAt, expiresAt }) {
  return DriverSubscription.create({
    driverId: userId,
    planId: plan.id,
    planName: plan.name,
    planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut,
    planCost: plan.cost,
    balance,
    paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status,
    approvedAt: createdAt,
    activatedAt: createdAt,
    expiresAt,
    createdAt,
  });
}

beforeEach(async () => {
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await seedDriver(DRIVER_ID, '+962710000571');
  await seedDriver(NO_PLAN_DRIVER_ID, '+962710000572');
  await seedDriver(SUSPENDED_DRIVER_ID, '+962710000573', { status: USER_STATUS.SUSPENDED });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  noPlanToken = generateAccessToken({ id: NO_PLAN_DRIVER_ID, role: 'driver' });
  suspendedToken = generateAccessToken({ id: SUSPENDED_DRIVER_ID, role: 'driver' });
});

describe('US4 - Subscription details', () => {
  it('returns the current plan with tier/days_remaining and newest-first history', async () => {
    const pro = await createPlan('Pro');

    await seedSubscription(DRIVER_ID, pro, {
      balance: 10,
      status: SUBSCRIPTION_STATUS.EXPIRED,
      createdAt: new Date(Date.now() - 40 * DAY_MS),
      expiresAt: new Date(Date.now() - 10 * DAY_MS),
    });
    const activeExpiresAt = new Date(Date.now() + 19 * DAY_MS);
    await seedSubscription(DRIVER_ID, pro, {
      balance: 12.4,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      createdAt: new Date(Date.now() - 10 * DAY_MS),
      expiresAt: activeExpiresAt,
    });

    const res = await getAgent()
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.tier).toBe('pro');
    expect(res.body.subscription.price).toBe(16);
    expect(res.body.subscription.currency).toBe('JOD');
    expect(res.body.subscription.days_remaining).toBe(19);
    expect(res.body.subscription.balance).toBe(12.4);
    expect(res.body.subscription.plan_name).toBe('Pro');
    expect(new Date(res.body.subscription.expires_at).getTime()).toBeCloseTo(activeExpiresAt.getTime());

    expect(res.body.history).toHaveLength(2);
    expect(res.body.history[0].plan_name).toBe('Pro');
    expect(res.body.history[0].status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(res.body.history[1].status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(res.body.history[0].created_at).toBeDefined();
    expect(res.body.history[0].expires_at).toBeDefined();
  });

  it('returns subscription null and empty history for a driver without a plan', async () => {
    const res = await getAgent()
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${noPlanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
    expect(res.body.history).toEqual([]);
  });

  it('returns 403 for a suspended driver', async () => {
    const res = await getAgent()
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${suspendedToken}`);

    expect(res.status).toBe(403);
  });

  it('returns free_trips for a free-trips plan', async () => {
    const plan = await SubscriptionPlan.create({
      name: 'Starter',
      periodDays: 30,
      percentageCut: 10,
      cost: 0,
      features: [],
      isFree: true,
      freeOffer: { type: 'trips', value: 5 },
      isActive: true,
    });
    await DriverSubscription.create({
      driverId: DRIVER_ID,
      planId: plan.id,
      planName: plan.name,
      planPeriodDays: plan.periodDays,
      planPercentageCut: plan.percentageCut,
      planCost: plan.cost,
      balance: 0,
      paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
      status: SUBSCRIPTION_STATUS.ACTIVE,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 19 * DAY_MS),
      freeOffer: { type: 'trips', value: 5 },
      freeTripsUsed: 4,
    });

    const res = await getAgent()
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.free_trips).toEqual({ max: 5, used: 4, remaining: 1 });
    expect(res.body.subscription.balance).toBe(0);
    expect(res.body.subscription.price).toBe(0);
  });
});
