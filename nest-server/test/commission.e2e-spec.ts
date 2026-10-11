// 1:1 port of Main Server/tests/integration/commission.test.js and
// contract/commission.contract.test.js (Wave 5.2 — trips now exist).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = 'c0000000-0000-4000-8000-0000000000e1';
const DRIVER_ID = 'c0000000-0000-4000-8000-0000000000e2';
const PASSENGER_ID = 'c0000000-0000-4000-8000-0000000000e3';
const VEHICLE_ID = 'c0000000-0000-4000-8000-0000000000e0';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

function startableDeparture(): string {
  return new Date(Date.now() + 30 * 60 * 1000).toISOString();
}

const SEATS = [
  { seat_number: 1, type: 'driver' },
  { seat_number: 2, type: 'available' },
  { seat_number: 3, type: 'available' },
  { seat_number: 4, type: 'unavailable' },
];

describe('Commission gating and deduction', () => {
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
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+9627000000e1',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Commission Driver',
        phone: '+9627000000e2',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Commission Passenger',
        phone: '+9627000000e3',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'INT-COM-1',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  async function createPlan(name: string, cut: number, cost: number): Promise<{ id: string }> {
    return ctx.prisma.subscriptionPlan.create({
      data: {
        name,
        periodDays: 30,
        percentageCut: cut,
        cost,
        features: [],
        isFree: false,
        isActive: true,
      },
    });
  }

  async function activatePlan(planId: string, balance: number): Promise<void> {
    const plan = await ctx.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    const now = new Date();
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER_ID,
        planId,
        planName: plan?.name ?? '',
        planPeriodDays: plan?.periodDays ?? 30,
        planPercentageCut: plan?.percentageCut ?? 0,
        planCost: plan?.cost ?? 0,
        balance,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      },
    });
    const total = await ctx.prisma.driverSubscription.aggregate({
      where: { driverId: DRIVER_ID, status: 'active', expiresAt: { gt: new Date() } },
      _sum: { balance: true },
    });
    const totalBalance = Number(total._sum.balance ?? 0);
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { totalBalance, isInDebt: totalBalance < 0 },
    });
  }

  function tripBody(fare = '15.00', departure = startableDeparture()): Record<string, unknown> {
    return {
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: departure,
      type_of_trip: 'once',
      fare_per_seat: fare,
      seats: SEATS,
    };
  }

  async function addBooking(tripId: string, fare: number, seatNumber = 2): Promise<void> {
    await ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber,
        seatsBooked: 1,
        agreedFare: fare,
        status: 'confirmed',
        referenceCode: makeRef(),
      },
    });
  }

  it('rejects publish without an active plan', async () => {
    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody());
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('NO_ACTIVE_PLAN');
    expect(typeof res.body.message).toBe('string');
  });

  it('rejects publish with insufficient balance', async () => {
    const plan = await createPlan('Basic', 10, 100);
    await activatePlan(plan.id, 0.5);

    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody());
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
    expect(res.body.message).toMatch(/1\.50/);
    expect(res.body.message).toMatch(/0\.50/);
  });

  it('publishes when balance covers commission', async () => {
    const plan = await createPlan('Basic', 8, 100);
    await activatePlan(plan.id, 100);

    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody());
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('published');
  });

  it('blocks start when balance drops below minimum', async () => {
    const plan = await createPlan('Basic', 10, 100);
    await activatePlan(plan.id, 100);

    const created = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody());
    const tripId = created.body.trip_id as string;

    await ctx.prisma.driverSubscription.updateMany({
      where: { driverId: DRIVER_ID },
      data: { balance: 0.1 },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { totalBalance: 0.1, isInDebt: false },
    });

    const res = await ctx.agent
      .post(`/api/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
    expect(typeof res.body.message).toBe('string');
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.status).toBe('published');
  });

  it('starts with sufficient balance', async () => {
    const plan = await createPlan('Basic', 8, 100);
    await activatePlan(plan.id, 100);

    const created = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody());
    const res = await ctx.agent
      .post(`/api/trips/${created.body.trip_id as string}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(created.body.trip_id);
    expect(res.body.status).toBe('in_progress');
    expect(typeof res.body.message).toBe('string');
  });

  it('deducts FIFO at the current plan rate on complete', async () => {
    const planA = await createPlan('Plan A', 10, 100);
    const planB = await createPlan('Plan B', 20, 100);
    await activatePlan(planA.id, 30);
    await activatePlan(planB.id, 100);

    const created = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody());
    const tripId = created.body.trip_id as string;
    await addBooking(tripId, 250);
    await addBooking(tripId, 250, 3);
    await ctx.agent.post(`/api/trips/${tripId}/start`).set('Authorization', `Bearer ${driverToken}`);

    const res = await ctx.agent
      .post(`/api/trips/${tripId}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.commission).toBe(50);
    expect(res.body.plan_name).toBe('Plan A');
    expect(res.body.balance_after).toBe(80);
    expect(res.body.is_in_debt).toBe(false);

    const subs = await ctx.prisma.driverSubscription.findMany({ where: { driverId: DRIVER_ID } });
    expect(Number(subs.find((s) => s.planId === planA.id)?.balance)).toBe(0);
    expect(Number(subs.find((s) => s.planId === planB.id)?.balance)).toBe(80);
    expect(Number((await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } }))?.totalBalance)).toBe(80);
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.status).toBe('completed');
  });

  it('goes into debt when commission exceeds balance and blocks trips', async () => {
    const plan = await createPlan('Basic', 10, 100);
    await activatePlan(plan.id, 10);

    const t1 = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('15.00', new Date(Date.now() + 30 * 60000).toISOString()));
    const t2 = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('15.00', new Date(Date.now() + 5 * 3600 * 1000).toISOString()));
    const trip1 = t1.body.trip_id as string;
    const trip2 = t2.body.trip_id as string;

    await ctx.agent.post(`/api/trips/${trip1}/start`).set('Authorization', `Bearer ${driverToken}`);
    await addBooking(trip1, 300);

    const res = await ctx.agent
      .post(`/api/trips/${trip1}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.commission).toBe(30);
    expect(res.body.is_in_debt).toBe(true);

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(-20);
    expect(user?.isInDebt).toBe(true);
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip1 } }))?.isBlockedByBalance).toBe(true);
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip2 } }))?.isBlockedByBalance).toBe(true);

    const publish = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('15.00', new Date(Date.now() + 8 * 3600 * 1000).toISOString()));
    expect(publish.status).toBe(422);
    expect(publish.body.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('unblocks when a new approval clears debt', async () => {
    const plan = await createPlan('Basic', 10, 100);
    await activatePlan(plan.id, 10);

    const t1 = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('15.00', new Date(Date.now() + 30 * 60000).toISOString()));
    const trip1 = t1.body.trip_id as string;
    const t2 = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('15.00', new Date(Date.now() + 5 * 3600 * 1000).toISOString()));
    const trip2 = t2.body.trip_id as string;
    await ctx.agent.post(`/api/trips/${trip1}/start`).set('Authorization', `Bearer ${driverToken}`);
    await addBooking(trip1, 300);
    await ctx.agent.post(`/api/trips/${trip1}/complete`).set('Authorization', `Bearer ${driverToken}`);
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip2 } }))?.isBlockedByBalance).toBe(true);

    const renewal = await createPlan('Renewal', 8, 200);
    const screenshot = await ctx.prisma.uploadedImage.create({
      data: { hash: `r${Date.now()}`, url: 'https://x/y.jpg', filename: 'y.jpg', mimetype: 'image/jpeg', size: 10 },
    });
    const method = await ctx.prisma.paymentMethod.create({
      data: { name: 'Bank', accountNumber: 'X', type: 'bank_account', isActive: true },
    });
    const sub = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: renewal.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(sub.status).toBe(201);
    const approved = await ctx.agent
      .post(`/api/admin/subscriptions/${sub.body.subscription_id as string}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approved.status).toBe(200);

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(180);
    expect(user?.isInDebt).toBe(false);

    // The still-published trip unblocks once debt clears.
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip2 } }))?.isBlockedByBalance).toBe(false);
  });
});
