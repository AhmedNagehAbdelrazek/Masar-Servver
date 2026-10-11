// 1:1 port of Main Server/tests/integration/tripSearchFilters.test.js and
// tripSearchTimeWindow.test.js (Wave 5.1). Dates anchor to Asia/Amman.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

function jordanDate(daysAhead: number): string {
  // Calendar date in Asia/Amman, not UTC: toISOString() is a day behind
  // between 00:00-03:00 Jordan time and makes "today" queries 422.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Amman',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date(Date.now() + daysAhead * 24 * 3600 * 1000));
}

async function seedDriver(
  ctx: TestContext,
  id: string,
  phone: string,
  vehicleId: string,
  vehicleType: string,
  plate: string,
): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id,
      fullName: `Driver ${id.slice(0, 8)}`,
      phone,
      countryCode: 'JO',
      role: 'driver',
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
  await ctx.prisma.vehicle.create({
    data: {
      id: vehicleId,
      driverId: id,
      manufacturer: 'Toyota',
      model: 'Camry',
      vehicleType: vehicleType as 'sedan' | 'van',
      modelYear: 2023,
      plateNumber: plate,
      color: 'White',
      seats: 4,
      isVerified: true,
    },
  });
  const plan = await ctx.prisma.subscriptionPlan.create({
    data: {
      name: `Basic ${id.slice(0, 4)}`,
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
      driverId: id,
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
    where: { id },
    data: { totalBalance: 100, isInDebt: false },
  });
}

describe('Trip search filters', () => {
  let ctx: TestContext;
  let tokenA: string;
  let passengerToken: string;

  const DRIVER_A = '550e8400-e29b-41d4-a716-446655440001';
  const DRIVER_B = '550e8400-e29b-41d4-a716-446655440003';
  const PASSENGER = '550e8400-e29b-41d4-a716-446655440002';
  const VEH_A = '550e8400-e29b-41d4-a716-446655440010';
  const VEH_B = '550e8400-e29b-41d4-a716-446655440011';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDriver(ctx, DRIVER_A, '+962791111111', VEH_A, 'sedan', 'SF-A1');
    await seedDriver(ctx, DRIVER_B, '+962791111113', VEH_B, 'van', 'SF-B1');
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER,
        fullName: 'Search Passenger',
        phone: '+962792222222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    tokenA = generateAccessToken({ id: DRIVER_A, role: 'driver' });
    const tokenB = generateAccessToken({ id: DRIVER_B, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER, role: 'passenger' });

    async function createTrip(
      token: string,
      time: string,
      seats: { seat_number: number; type: string }[],
    ): Promise<string> {
      const res = await ctx.agent
        .post('/api/trips')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin_city: 'Amman',
          destination_city: 'Irbid',
          departure_time: `${jordanDate(1)}T${time}:00+03:00`,
          type_of_trip: 'once',
          fare_per_seat: '15.00',
          seats,
        });
      expect(res.status).toBe(201);
      return res.body.trip_id as string;
    }

    await createTrip(tokenA, '10:00', [
      { seat_number: 1, type: 'driver' },
      { seat_number: 2, type: 'available' },
      { seat_number: 3, type: 'available' },
      { seat_number: 4, type: 'unavailable' },
    ]);
    await createTrip(tokenB, '10:00', [
      { seat_number: 1, type: 'driver' },
      { seat_number: 2, type: 'available' },
      { seat_number: 3, type: 'unavailable' },
      { seat_number: 4, type: 'unavailable' },
    ]);
  });

  function search(q: string): ReturnType<TestContext['agent']['get']> {
    return ctx.agent
      .get(`/api/trips/search/available?origin_city=Amman&destination_city=Irbid${q}`)
      .set('Authorization', `Bearer ${passengerToken}`);
  }

  it('returns both trips for the base query', async () => {
    const res = await search(`&date=${jordanDate(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(2);
    expect(typeof res.body.trips[0].id).toBe('string');
    expect(res.body.trips[0].originCity).toBe('Amman');
  });

  it('filters by vehicle_type', async () => {
    const res = await search(`&date=${jordanDate(1)}&vehicle_type=van`);
    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(1);
  });

  it('filters by minimum available seats', async () => {
    const res = await search(`&date=${jordanDate(1)}&seats=2`);
    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(1);
  });

  it('returns empty outside the time window', async () => {
    const res = await search(`&date=${jordanDate(1)}&time_from=15:00&time_to=18:00`);
    expect(res.status).toBe(200);
    expect(res.body.trips).toEqual([]);
  });

  it('returns both inside the time window', async () => {
    const res = await search(`&date=${jordanDate(1)}&time_from=09:00&time_to=11:00`);
    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(2);
  });

  it('includes future trips when searching today', async () => {
    const res = await search(`&date=${jordanDate(0)}`);
    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(2);
  });

  it('rejects inverted time window with 422', async () => {
    const res = await search(`&date=${jordanDate(1)}&time_from=12:00&time_to=09:00`);
    expect(res.status).toBe(422);
  });
});

describe('Trip search time windows', () => {
  let ctx: TestContext;
  let passengerToken: string;

  const DRIVER_A = '550e8400-e29b-41d4-a716-44665544aa01';
  const DRIVER_B = '550e8400-e29b-41d4-a716-44665544aa02';
  const PASSENGER = '550e8400-e29b-41d4-a716-44665544aa03';
  const VEH_A = '550e8400-e29b-41d4-a716-44665544aa10';
  const VEH_B = '550e8400-e29b-41d4-a716-44665544aa11';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDriver(ctx, DRIVER_A, '+962791111121', VEH_A, 'sedan', 'TW-A1');
    await seedDriver(ctx, DRIVER_B, '+962791111122', VEH_B, 'sedan', 'TW-B1');
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER,
        fullName: 'Window Passenger',
        phone: '+962792222122',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    passengerToken = generateAccessToken({ id: PASSENGER, role: 'passenger' });

    async function createTripIso(token: string, iso: string): Promise<string> {
      const res = await ctx.agent
        .post('/api/trips')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin_city: 'Amman',
          destination_city: 'Irbid',
          departure_time: iso,
          type_of_trip: 'once',
          fare_per_seat: '15.00',
          seats: [
            { seat_number: 1, type: 'driver' },
            { seat_number: 2, type: 'available' },
            { seat_number: 3, type: 'available' },
            { seat_number: 4, type: 'unavailable' },
          ],
        });
      expect(res.status).toBe(201);
      return res.body.trip_id as string;
    }

    const tokenA = generateAccessToken({ id: DRIVER_A, role: 'driver' });
    const tokenB = generateAccessToken({ id: DRIVER_B, role: 'driver' });
    await createTripIso(tokenA, `${jordanDate(1)}T10:00:00+03:00`);
    await createTripIso(tokenA, `${jordanDate(1)}T16:00:00+03:00`);
    await createTripIso(tokenB, `${jordanDate(2)}T09:00:00+03:00`);
  });

  async function search(q: string): Promise<string[]> {
    const res = await ctx.agent
      .get(`/api/trips/search/available?origin_city=Amman&destination_city=Irbid${q}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);
    return (res.body.trips as { departureTime: string }[]).map((t) => t.departureTime);
  }

  it('from-only returns date-and-after forward', async () => {
    expect(await search(`&date=${jordanDate(1)}&time_from=15:00`)).toEqual([
      `${jordanDate(1)}T13:00:00.000Z`,
      `${jordanDate(2)}T06:00:00.000Z`,
    ]);
  });

  it('to-only returns now-to-to', async () => {
    expect(await search(`&date=${jordanDate(1)}&time_to=12:00`)).toEqual([
      `${jordanDate(1)}T07:00:00.000Z`,
    ]);
  });

  it('both matches time-of-day across future days, closest first', async () => {
    expect(await search(`&date=${jordanDate(1)}&time_from=09:00&time_to=11:00`)).toEqual([
      `${jordanDate(1)}T07:00:00.000Z`,
      `${jordanDate(2)}T06:00:00.000Z`,
    ]);
  });

  it('no-date from anchors to today with now clamp', async () => {
    expect(await search('&time_from=00:00')).toEqual([
      `${jordanDate(1)}T07:00:00.000Z`,
      `${jordanDate(1)}T13:00:00.000Z`,
      `${jordanDate(2)}T06:00:00.000Z`,
    ]);
  });
});
