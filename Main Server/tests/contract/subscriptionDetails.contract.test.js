const { getAgent } = require('../setup/setup');
const { User, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c61';
const UNVERIFIED_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c62';
const VEHICLE_PHONE = '+962710000561';

let driverToken;
let unverifiedToken;

async function seedActivePlan() {
  const plan = await SubscriptionPlan.create({
    name: 'Pro',
    periodDays: 30,
    percentageCut: 10,
    cost: 16,
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
    balance: 12.4,
    paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE,
    approvedAt: new Date(),
    activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
  });
}

beforeEach(async () => {
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: [DRIVER_ID, UNVERIFIED_DRIVER_ID] }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, UNVERIFIED_DRIVER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Sub Details Driver',
    phone: VEHICLE_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: UNVERIFIED_DRIVER_ID,
    fullName: 'Unverified Driver',
    phone: '+962710000562',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: false,
  });
  await DriverProfile.create({ driverId: DRIVER_ID });
  await DriverProfile.create({ driverId: UNVERIFIED_DRIVER_ID });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  unverifiedToken = generateAccessToken({ id: UNVERIFIED_DRIVER_ID, role: 'driver' });
});

describe('Contract: GET /api/driver/subscription', () => {
  it('returns {subscription, history} shape with a current plan', async () => {
    await seedActivePlan();

    const res = await getAgent()
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

  it('returns subscription null with empty history when no plan exists', async () => {
    const res = await getAgent()
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
    expect(res.body.history).toEqual([]);
  });

  it('returns 403 for an unverified driver', async () => {
    const res = await getAgent()
      .get('/api/driver/subscription')
      .set('Authorization', `Bearer ${unverifiedToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without an auth token', async () => {
    const res = await getAgent().get('/api/driver/subscription');
    expect(res.status).toBe(401);
  });
});
