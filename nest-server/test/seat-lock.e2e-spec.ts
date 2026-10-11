// 1:1 port of Main Server/tests/integration/seatLock.test.js (Wave 5.1).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASS1_ID = '550e8400-e29b-41d4-a716-446655440002';
const PASS2_ID = '550e8400-e29b-41d4-a716-446655440003';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const FAKE_ID = '9906e4a0-e29b-41d4-80b4-00c04fd43099';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

describe('Seat locks', () => {
  let ctx: TestContext;
  let pass1Token: string;
  let pass2Token: string;
  let tripId: string;

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
        id: DRIVER_ID,
        fullName: 'Lock Driver',
        phone: '+962795555555',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASS1_ID,
        fullName: 'Lock Pass One',
        phone: '+962796666666',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASS2_ID,
        fullName: 'Lock Pass Two',
        phone: '+962797777777',
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
        plateNumber: 'LK-123',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    const plan = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 100,
        features: [],
        isFree: false,
        isActive: true,
      },
    });
    const now = new Date();
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER_ID,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance: 100,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
    pass1Token = generateAccessToken({ id: PASS1_ID, role: 'passenger' });
    pass2Token = generateAccessToken({ id: PASS2_ID, role: 'passenger' });
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });

    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: `${getFutureDate(1)}T15:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '20.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(res.status).toBe(201);
    tripId = res.body.trip_id as string;
  });

  function lock(seat: unknown, token = pass1Token): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${token}`)
      .send(seat as never);
  }

  it('locks a seat with TTL metadata', async () => {
    const res = await lock({ seat_number: 2 });
    expect(res.status).toBe(200);
    expect(res.body.lock_id).toBeDefined();
    expect(res.body.seat_number).toBe(2);
    expect(res.body.expires_in).toBe(300);
    expect(res.body.message).toMatch(/locked/i);
  });

  it('rejects a second passenger with 409 but allows owner re-lock', async () => {
    await lock({ seat_number: 2 });
    expect((await lock({ seat_number: 2 }, pass2Token)).status).toBe(409);
    expect((await lock({ seat_number: 2 })).status).toBe(200);
  });

  it('locks a different seat for another passenger', async () => {
    await lock({ seat_number: 2 });
    const res = await lock({ seat_number: 3 }, pass2Token);
    expect(res.status).toBe(200);
    expect(res.body.seat_number).toBe(3);
  });

  it.each([[4, 'unavailable'], [1, 'driver']])('rejects %s seat with 422', async (seat) => {
    expect((await lock({ seat_number: seat })).status).toBe(422);
  });

  it('returns 404 for unknown seat', async () => {
    expect((await lock({ seat_number: 99 })).status).toBe(404);
  });

  it('requires auth and a real trip', async () => {
    expect((await ctx.agent.post(`/api/trips/${tripId}/seats/lock`).send({ seat_number: 2 })).status).toBe(
      401,
    );
    expect(
      (
        await ctx.agent
          .post(`/api/trips/${FAKE_ID}/seats/lock`)
          .set('Authorization', `Bearer ${pass1Token}`)
          .send({ seat_number: 2 })
      ).status,
    ).toBe(404);
  });

  it('validates lock payloads', async () => {
    expect((await lock({})).status).toBe(422);
    expect((await lock({ seat_number: 0 })).status).toBe(422);
    const badTrip = await ctx.agent
      .post('/api/trips/not-a-uuid/seats/lock')
      .set('Authorization', `Bearer ${pass1Token}`)
      .send({ seat_number: 2 });
    expect(badTrip.status).toBe(422);
  });

  it('releases own lock and 404s on double release', async () => {
    await lock({ seat_number: 2 });
    const del = (seat: number, token = pass1Token): ReturnType<TestContext['agent']['delete']> =>
      ctx.agent
        .delete(`/api/trips/${tripId}/seats/lock/${seat}`)
        .set('Authorization', `Bearer ${token}`);

    const first = await del(2);
    expect(first.status).toBe(200);
    expect(first.body.message).toMatch(/released/i);
    expect((await del(2)).status).toBe(404);
  });

  it('rejects releasing another passenger lock with 403', async () => {
    await lock({ seat_number: 2 });
    expect(
      (
        await ctx.agent
          .delete(`/api/trips/${tripId}/seats/lock/2`)
          .set('Authorization', `Bearer ${pass2Token}`)
      ).status,
    ).toBe(403);
  });

  it('handles release edge cases', async () => {
    const del = (path: string, token = pass1Token): ReturnType<TestContext['agent']['delete']> =>
      ctx.agent.delete(path).set('Authorization', `Bearer ${token}`);

    expect((await del(`/api/trips/${tripId}/seats/lock/2`)).status).toBe(404);
    await lock({ seat_number: 2 });
    expect((await ctx.agent.delete(`/api/trips/${tripId}/seats/lock/2`)).status).toBe(401);
    expect((await del(`/api/trips/${FAKE_ID}/seats/lock/2`)).status).toBe(404);
    expect((await del(`/api/trips/${tripId}/seats/lock/abc`)).status).toBe(422);
  });
});
