// 1:1 port of Main Server/tests/integration/trip.test.js (Wave 5.1).
// VERIFIED DEVIATIONS (Express fails 4/35 of its own file):
// - GET detail asserts the CURRENT nested shape (the flat originCity assert
//   is stale — the service deletes those keys).
// - The overlap guard implements the DOCUMENTED 2h window (code comments +
//   suite names); Express ships TRIP_DURATION_HOURS=0 which deadens the guard
//   (see trip.constants.ts).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

const VALID_TRIP_BODY = {
  origin_city: 'Amman',
  origin_area: 'Abdoun',
  origin_lat: '31.9500',
  origin_lng: '35.9100',
  destination_city: 'Irbid',
  destination_area: 'Downtown',
  destination_lat: '32.5500',
  destination_lng: '35.8500',
  departure_time: `${getFutureDate(1)}T14:00:00+03:00`,
  type_of_trip: 'once',
  fare_per_seat: '15.50',
  seats: [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ],
  instructions: ['No smoking please', 'Be ready 10 mins early'],
  additional_instructions: 'Bring water',
  waypoints: [{ stop_name: 'Khalda', stop_lat: '31.9600', stop_lng: '35.9000' }],
};

describe('Trip - Create', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;

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
        fullName: 'Trip Driver',
        phone: '+962791111111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Trip Passenger',
        phone: '+962792222222',
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
        plateNumber: 'TEST-123',
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
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  function postTrip(body: unknown, token = driverToken): ReturnType<TestContext['agent']['post']> {
    return ctx.agent.post('/api/trips').set('Authorization', `Bearer ${token}`).send(body as never);
  }

  it('creates a one-time trip', async () => {
    const res = await postTrip(VALID_TRIP_BODY);
    expect(res.status).toBe(201);
    expect(res.body.trip_id).toBeDefined();
    expect(res.body.status).toBe('published');
    expect(res.body.total_seats).toBe(4);
    expect(res.body.available_seats).toBe(2);
    expect(res.body.estimated_earnings).toBe(31);
    expect(res.body.message).toMatch(/successfully/i);

    const trip = await ctx.prisma.trip.findUnique({ where: { id: res.body.trip_id as string } });
    expect(trip?.originCity).toBe('Amman');
    expect(trip?.destinationCity).toBe('Irbid');
    expect(trip?.isRecurring).toBe(false);
    expect(Number(trip?.farePerSeat)).toBe(15.5);

    const seats = await ctx.prisma.tripSeat.findMany({ where: { tripId: res.body.trip_id as string } });
    expect(seats.length).toBe(4);
    expect(seats.filter((s) => s.seatType === 'driver').length).toBe(1);
    expect(seats.filter((s) => s.seatType === 'available').length).toBe(2);

    const stops = await ctx.prisma.tripStop.findMany({ where: { tripId: res.body.trip_id as string } });
    expect(stops.length).toBe(1);
    expect(stops[0].stopName).toBe('Khalda');
  });

  it('creates a recurring trip', async () => {
    const res = await postTrip({
      ...VALID_TRIP_BODY,
      type_of_trip: 'repeated',
      repeated_days: [1, 3, 5],
      repeated_end_date: getFutureDate(30),
    });
    expect(res.status).toBe(201);
    const trip = await ctx.prisma.trip.findUnique({ where: { id: res.body.trip_id as string } });
    expect(trip?.isRecurring).toBe(true);
    expect(trip?.recurrenceDays).toEqual([1, 3, 5]);
    expect(trip?.recurrenceEndDate).toBeDefined();
  });

  it('rejects unauthenticated and passenger callers', async () => {
    expect((await ctx.agent.post('/api/trips').send(VALID_TRIP_BODY)).status).toBe(401);
    expect((await postTrip(VALID_TRIP_BODY, passengerToken)).status).toBe(403);
  });

  it('rejects driver without vehicle or unverified vehicle', async () => {
    await ctx.prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440099',
        fullName: 'No Car',
        phone: '+962799999999',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    const noCarToken = generateAccessToken({ id: '550e8400-e29b-41d4-a716-446655440099', role: 'driver' });
    expect((await postTrip(VALID_TRIP_BODY, noCarToken)).status).toBe(403);

    await ctx.prisma.vehicle.update({ where: { id: VEHICLE_ID }, data: { isVerified: false } });
    expect((await postTrip(VALID_TRIP_BODY)).status).toBe(403);
  });

  it.each([
    [{ ...VALID_TRIP_BODY, origin_city: undefined }, 'missing origin_city'],
    [{ ...VALID_TRIP_BODY, destination_city: undefined }, 'missing destination_city'],
    [{ ...VALID_TRIP_BODY, departure_time: `${getFutureDate(1)}T14:00` }, 'naive departure_time'],
    [{ ...VALID_TRIP_BODY, departure_time: undefined }, 'missing departure_time'],
    [{ ...VALID_TRIP_BODY, fare_per_seat: undefined }, 'missing fare_per_seat'],
    [{ ...VALID_TRIP_BODY, seats: undefined }, 'missing seats'],
    [{ ...VALID_TRIP_BODY, fare_per_seat: 'abc' }, 'non-decimal fare'],
    [{ ...VALID_TRIP_BODY, fare_per_seat: '-5.00' }, 'negative fare'],
    [{ ...VALID_TRIP_BODY, type_of_trip: 'repeated' }, 'repeated without days'],
  ])('rejects invalid payload (%s)', async (body: unknown, _label: string) => {
    void _label;
    expect((await postTrip(body as Record<string, unknown>)).status).toBe(422);
  });

  it('rejects seat map violations', async () => {
    const twoSeats = {
      ...VALID_TRIP_BODY,
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
      ],
    };
    expect((await postTrip(twoSeats)).status).toBe(422);

    const noDriver = {
      ...VALID_TRIP_BODY,
      seats: [
        { seat_number: 1, type: 'available' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
    };
    expect((await postTrip(noDriver)).status).toBe(422);

    const noneAvailable = {
      ...VALID_TRIP_BODY,
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'unavailable' },
        { seat_number: 3, type: 'unavailable' },
        { seat_number: 4, type: 'unavailable' },
      ],
    };
    expect((await postTrip(noneAvailable)).status).toBe(422);
  });

  it('rejects past departure', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0] as string;
    expect(
      (await postTrip({ ...VALID_TRIP_BODY, departure_time: `${date}T14:00:00+03:00` })).status,
    ).toBe(422);
  });
});

describe('Trip - Driver overlap guard (2h window)', () => {
  let ctx: TestContext;
  let driverToken: string;

  const OVERLAP_SEATS = [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ];

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
        fullName: 'Trip Driver',
        phone: '+962791111111',
        countryCode: 'JO',
        role: 'driver',
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
        plateNumber: 'TEST-123',
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  function overlapBody(date: string, time: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${date}T${time}:00+03:00`,
      type_of_trip: 'once',
      fare_per_seat: '15.50',
      seats: OVERLAP_SEATS,
      ...extra,
    };
  }

  function postTrip(body: unknown): ReturnType<TestContext['agent']['post']> {
    return ctx.agent.post('/api/trips').set('Authorization', `Bearer ${driverToken}`).send(body as never);
  }

  it('rejects a second trip inside the first trip window', async () => {
    const date = getFutureDate(5);
    expect((await postTrip(overlapBody(date, '05:00'))).status).toBe(201);
    const res = await postTrip(overlapBody(date, '06:00'));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('TRIP_TIME_OVERLAP');
  });

  it('allows a trip exactly at the window boundary', async () => {
    const date = getFutureDate(5);
    expect((await postTrip(overlapBody(date, '05:00'))).status).toBe(201);
    expect((await postTrip(overlapBody(date, '07:00'))).status).toBe(201);
  });

  it('allows same time on different days', async () => {
    expect((await postTrip(overlapBody(getFutureDate(5), '05:00'))).status).toBe(201);
    expect((await postTrip(overlapBody(getFutureDate(6), '06:00'))).status).toBe(201);
  });

  it('frees the slot after cancel', async () => {
    const date = getFutureDate(5);
    const created = await postTrip(overlapBody(date, '05:00'));
    const del = await ctx.agent
      .delete(`/api/trips/${created.body.trip_id as string}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(del.status).toBe(200);
    expect((await postTrip(overlapBody(date, '06:00'))).status).toBe(201);
  });

  // NOTE: update-enforced overlap moves to the Wave 5.2 spec (PUT not ported yet).

  it('rejects a one-off overlapping a weekly series occurrence', async () => {
    const startDate = getFutureDate(5);
    const weekday = new Date(`${startDate}T00:00:00+03:00`).getDay();
    const series = await postTrip(
      overlapBody(startDate, '10:00', {
        type_of_trip: 'repeated',
        repeated_days: [weekday],
        repeated_end_date: getFutureDate(35),
      }),
    );
    expect(series.status).toBe(201);

    const sameWeekdayNextWeek = getFutureDate(12);
    const clash = await postTrip(overlapBody(sameWeekdayNextWeek, '11:00'));
    expect([409, 201]).toContain(clash.status);
    if (new Date(`${sameWeekdayNextWeek}T00:00:00+03:00`).getDay() === weekday) {
      expect(clash.status).toBe(409);
      expect(clash.body.code).toBe('TRIP_TIME_OVERLAP');
    }
  });
});

describe('Trip - Get Trip By ID', () => {
  let ctx: TestContext;
  let driverToken: string;
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
        fullName: 'Trip Driver',
        phone: '+962791111111',
        countryCode: 'JO',
        role: 'driver',
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
        plateNumber: 'TEST-123',
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });

    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_TRIP_BODY);
    tripId = res.body.trip_id as string;
  });

  it('returns trip with seats and stops (current nested shape)', async () => {
    const res = await ctx.agent
      .get(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(tripId);
    expect(res.body.trip.origin.city).toBe('Amman');
    expect(res.body.trip.destination.city).toBe('Irbid');
    expect(res.body.seats).toBeDefined();
    expect(res.body.seats.length).toBe(4);
    expect(res.body.stops).toBeDefined();
    expect(res.body.stops.length).toBe(1);
  });

  it('returns 404 for non-existent trip', async () => {
    const res = await ctx.agent
      .get('/api/trips/550e8400-e29b-41d4-a716-446655440099')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(404);
  });

  it('rejects without auth token', async () => {
    expect((await ctx.agent.get(`/api/trips/${tripId}`)).status).toBe(401);
  });
});

describe('Trip - Get Driver Trips', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;

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
        fullName: 'Trip Driver',
        phone: '+962791111111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Trip Passenger',
        phone: '+962792222222',
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
        plateNumber: 'TEST-123',
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

    await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_TRIP_BODY);
    await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        ...VALID_TRIP_BODY,
        origin_city: 'Zarqa',
        destination_city: 'Aqaba',
        departure_time: `${getFutureDate(2)}T14:00:00+03:00`,
      });
  });

  it('lists own trips and filters by status', async () => {
    const res = await ctx.agent
      .get('/api/trips/driver/my-trips')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.trips).toBeDefined();
    expect(res.body.trips.length).toBe(2);

    const filtered = await ctx.agent
      .get('/api/trips/driver/my-trips?status=published')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.trips.length).toBe(2);
    for (const t of filtered.body.trips as { status: string }[]) {
      expect(t.status).toBe('published');
    }
  });

  it('rejects passenger role', async () => {
    expect(
      (
        await ctx.agent
          .get('/api/trips/driver/my-trips')
          .set('Authorization', `Bearer ${passengerToken}`)
      ).status,
    ).toBe(403);
  });
});
