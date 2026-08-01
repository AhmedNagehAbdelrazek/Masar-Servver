const { getAgent } = require('../setup/setup');
const { User, DriverProfile, SubscriptionPlan, PaymentMethod, DriverSubscription, Vehicle, Trip, TripSeat, Notification } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS, TRIP_STATUS } = require('../../config/constants');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440d01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440d02';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440d10';

let adminToken;
let driverToken;
let plan;
let freePlan;
let method;

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await PaymentMethod.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962710000201', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: DRIVER_ID, fullName: 'Driver Two', phone: '+962710000202', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
  await DriverProfile.create({ driverId: DRIVER_ID, nationalID: 'N7654321' });

  plan = await SubscriptionPlan.create({
    name: 'Basic',
    periodDays: 30,
    percentageCut: 8,
    cost: 15,
    features: [],
    isFree: false,
    isActive: true,
  });
  freePlan = await SubscriptionPlan.create({
    name: 'Free Trial',
    periodDays: 30,
    percentageCut: 0,
    cost: 0,
    features: [],
    isFree: true,
    freeOffer: { type: 'trips', value: 5 },
    isActive: true,
  });
  method = await PaymentMethod.create({
    name: 'Bank of Jordan',
    accountNumber: 'JO94BOJX0000000000',
    type: 'bank_account',
    email: 'payments@boj.com',
    isActive: true,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

const submit = (planId) =>
  getAgent()
    .post('/api/subscriptions')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      plan_id: planId,
      payment_method_id: method.id,
      screenshot_url: 'https://res.cloudinary.com/x/screenshot.jpg',
    });

const activateSub = (subPlan, balance, opts = {}) =>
  DriverSubscription.create({
    driverId: DRIVER_ID,
    planId: subPlan.id,
    planName: subPlan.name,
    planPeriodDays: opts.periodDays || subPlan.periodDays,
    planPercentageCut: subPlan.percentageCut,
    planCost: subPlan.cost,
    balance,
    paymentMethod: { name: method.name, account_number: method.accountNumber, type: method.type },
    status: SUBSCRIPTION_STATUS.ACTIVE,
    approvedAt: new Date(),
    activatedAt: new Date(),
    expiresAt: opts.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

const createPublishedTrip = async () => {
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'SUB-Q-1',
    color: 'White',
    seats: 4,
    isVerified: true,
  });
  return Trip.create({
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    totalSeats: 4,
    availableSeats: 3,
    farePerSeat: 20,
    status: TRIP_STATUS.PUBLISHED,
  });
};

describe('Driver subscription lifecycle - US2', () => {
  it('submits a request that appears as pending in the list', async () => {
    const res = await submit(plan.id);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending_approval');

    const list = await getAgent().get('/api/subscriptions').set('Authorization', `Bearer ${driverToken}`);
    expect(list.status).toBe(200);
    expect(list.body.subscriptions).toHaveLength(1);
    expect(list.body.subscriptions[0].plan.name).toBe('Basic');
    expect(list.body.subscriptions[0].status).toBe('pending_approval');
  });

  it('rejects a plain duplicate pending request with 409', async () => {
    await submit(plan.id);
    const res = await submit(plan.id);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_SUBSCRIPTION_REQUEST');
  });

  it('resubmitting cancels the older request and creates a new one', async () => {
    const first = await submit(plan.id);
    expect(first.status).toBe(201);

    const resubmit = await getAgent()
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        plan_id: plan.id,
        payment_method_id: method.id,
        screenshot_url: 'https://res.cloudinary.com/x/screenshot2.jpg',
        resubmit: true,
      });
    expect(resubmit.status).toBe(201);

    const subs = await DriverSubscription.findAll({
      where: { driverId: DRIVER_ID, planId: plan.id },
      order: [['createdat', 'ASC']],
    });
    expect(subs).toHaveLength(2);
    expect(subs[0].status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect(subs[1].status).toBe(SUBSCRIPTION_STATUS.PENDING_APPROVAL);
  });

  it('rejects submitting an inactive plan with PLAN_INACTIVE', async () => {
    await plan.update({ isActive: false });
    const res = await submit(plan.id);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PLAN_INACTIVE');
  });

  it('rejects an inactive payment method', async () => {
    await method.update({ isActive: false });
    const res = await submit(plan.id);
    expect(res.status).toBe(422);
  });
});

describe('Free plan one-time per national ID - US2', () => {
  it('blocks a second free plan activation', async () => {
    const first = await submit(freePlan.id);
    expect(first.status).toBe(201);

    await getAgent()
      .post(`/api/admin/subscriptions/${first.body.subscription_id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(first.body.status).toBe('pending_approval');

    const second = await submit(freePlan.id);
    expect(second.status).toBe(422);
    expect(second.body.code).toBe('FREE_PLAN_ALREADY_USED');
  });
});

describe('GET /api/subscriptions/current - US2', () => {
  it('is null before approval and returns the plan after approval', async () => {
    const before = await getAgent().get('/api/subscriptions/current').set('Authorization', `Bearer ${driverToken}`);
    expect(before.body.subscription).toBeNull();
    expect(before.body.total_balance).toBe(0);

    const created = await submit(plan.id);
    await getAgent()
      .post(`/api/admin/subscriptions/${created.body.subscription_id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const after = await getAgent().get('/api/subscriptions/current').set('Authorization', `Bearer ${driverToken}`);
    expect(after.body.subscription).not.toBeNull();
    expect(after.body.subscription.plan.name).toBe('Basic');
    expect(after.body.subscription.plan.percentage_cut).toBe(8);
    expect(after.body.total_balance).toBe(15);
    expect(after.body.is_in_debt).toBe(false);
  });
});

describe('US4 - Plan queue ordering', () => {
  it('activates the shortest-period plan first', async () => {
    const plan30 = await SubscriptionPlan.create({
      name: '30 Day', periodDays: 30, percentageCut: 10, cost: 100, features: [], isFree: false, isActive: true,
    });
    const plan15 = await SubscriptionPlan.create({
      name: '15 Day', periodDays: 15, percentageCut: 10, cost: 60, features: [], isFree: false, isActive: true,
    });
    await activateSub(plan30, 100, { periodDays: 30 });
    await activateSub(plan15, 60, { periodDays: 15 });
    await User.update({ totalBalance: 160, isInDebt: false }, { where: { id: DRIVER_ID } });

    const res = await getAgent().get('/api/subscriptions/current').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription.plan.name).toBe('15 Day');
  });

  it('uses submission FIFO for same-period plans', async () => {
    const planA = await SubscriptionPlan.create({
      name: 'Plan A', periodDays: 30, percentageCut: 10, cost: 100, features: [], isFree: false, isActive: true,
    });
    const planB = await SubscriptionPlan.create({
      name: 'Plan B', periodDays: 30, percentageCut: 10, cost: 100, features: [], isFree: false, isActive: true,
    });
    await activateSub(planA, 100, { periodDays: 30 });
    await activateSub(planB, 100, { periodDays: 30 });
    await User.update({ totalBalance: 200, isInDebt: false }, { where: { id: DRIVER_ID } });

    const res = await getAgent().get('/api/subscriptions/current').set('Authorization', `Bearer ${driverToken}`);
    expect(res.body.subscription.plan.name).toBe('Plan A');
  });

  it('puts an active free plan ahead of paid plans', async () => {
    await activateSub(freePlan, 0);
    await activateSub(plan, 15);
    await User.update({ totalBalance: 15, isInDebt: false }, { where: { id: DRIVER_ID } });

    const res = await getAgent().get('/api/subscriptions/current').set('Authorization', `Bearer ${driverToken}`);
    expect(res.body.subscription.plan.name).toBe('Free Trial');
  });
});

describe('US4 - Expiry transition', () => {
  it('sweeps expired plans: flips status, recomputes balance, unpublishes trips, notifies', async () => {
    const { runExpirySweep } = require('../../jobs/expirySweepJob');

    const sub = await activateSub(plan, 100);
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
    const trip = await createPublishedTrip();

    await DriverSubscription.update(
      { expiresAt: new Date(Date.now() - 60 * 1000) },
      { where: { id: sub.id } }
    );

    await runExpirySweep();

    const expired = await DriverSubscription.findByPk(sub.id);
    expect(expired.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);

    const user = await User.findByPk(DRIVER_ID);
    expect(Number(user.totalBalance)).toBe(0);
    expect(user.isInDebt).toBe(false);

    const dbTrip = await Trip.findByPk(trip.id);
    expect(dbTrip.isBlockedByBalance).toBe(true);

    const notif = await Notification.findOne({
      where: { userId: DRIVER_ID, type: 'PLAN_EXPIRED' },
    });
    expect(notif).not.toBeNull();
  });
});

describe('US4 - Same-plan renewal', () => {
  it('merges remaining balance into the new subscription and resets the period', async () => {
    const sub1 = await activateSub(plan, 50);
    await User.update({ totalBalance: 50, isInDebt: false }, { where: { id: DRIVER_ID } });

    const submitted = await submit(plan.id);
    expect(submitted.status).toBe(201);

    const approve = await getAgent()
      .post(`/api/admin/subscriptions/${submitted.body.subscription_id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);

    const oldSub = await DriverSubscription.findByPk(sub1.id);
    const newSub = await DriverSubscription.findByPk(submitted.body.subscription_id);

    expect(oldSub.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(Number(oldSub.balance)).toBe(0);

    expect(newSub.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(Number(newSub.balance)).toBe(50 + Number(plan.cost));

    const periodMs = new Date(newSub.expiresAt).getTime() - new Date(newSub.activatedAt).getTime();
    expect(periodMs).toBeGreaterThanOrEqual(29.5 * 24 * 60 * 60 * 1000);
    expect(periodMs).toBeLessThanOrEqual(30.5 * 24 * 60 * 60 * 1000);

    const user = await User.findByPk(DRIVER_ID);
    expect(Number(user.totalBalance)).toBe(50 + Number(plan.cost));
    expect(user.isInDebt).toBe(false);
  });
});
