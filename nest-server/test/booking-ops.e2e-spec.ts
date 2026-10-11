// 1:1 port of Main Server/tests/integration/delays.test.js,
// passengerBookingList.test.js, driverBookings.test.js (read parts),
// driverReveal.test.js and contract/booking.contract.test.js (Wave 5.3).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'b1000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'b1000000-0000-4000-8000-000000000002';
const OTHER_ID = 'b1000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'b1000000-0000-4000-8000-000000000010';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

async function seedEssentials(ctx: TestContext): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id: DRIVER_ID,
      fullName: 'Ops Driver',
      phone: '+962795559031',
      countryCode: 'JO',
      role: 'driver',
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
  await ctx.prisma.user.create({
    data: {
      id: PASSENGER_ID,
      fullName: 'Ops Passenger',
      phone: '+962795559032',
      countryCode: 'JO',
      role: 'passenger',
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
  await ctx.prisma.user.create({
    data: {
      id: OTHER_ID,
      fullName: 'Other User',
      phone: '+962795559033',
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
      plateNumber: 'OPS-101',
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
}

async function createTripViaApi(ctx: TestContext, token: string): Promise<string> {
  const res = await ctx.agent
    .post('/api/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${getFutureDate(1)}T14:00:00+03:00`,
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

async function lockAndBook(
  ctx: TestContext,
  token: string,
  tripId: string,
  seatNumbers: number[] = [2],
): Promise<{ id: string }> {
  await ctx.agent
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${token}`)
    .send({ seat_numbers: seatNumbers });
  const res = await ctx.agent
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ trip_id: tripId, seat_numbers: seatNumbers, agreed_fare: '15.00' });
  expect(res.status).toBe(201);
  return { id: (res.body.booking as Record<string, unknown>).id as string };
}

describe('Delay events', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;
  let otherToken: string;
  let bookingId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx);
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });

    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 12 * 3600 * 1000),
        totalSeats: 3,
        availableSeats: 2,
        farePerSeat: 8,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    const booking = await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 8,
        status: 'confirmed',
        paymentStatus: 'pending',
        referenceCode: `MSR-DLY${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      },
    });
    bookingId = booking.id;
  });

  function reportDelay(
    token: string,
    body: unknown,
  ): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post(`/api/bookings/${bookingId}/delay`)
      .set('Authorization', `Bearer ${token}`)
      .send(body as never);
  }

  it('lets the passenger report own delay', async () => {
    const res = await reportDelay(passengerToken, {
      party: 'passenger',
      delay_minutes: 10,
      reason: 'Traffic',
    });
    expect(res.status).toBe(201);
    expect(res.body.delay_event.party).toBe('passenger');
    expect(res.body.delay_event.delay_minutes).toBe(10);
    expect(res.body.delay_event.booking_id).toBe(bookingId);
  });

  it('lets the driver report driver delay', async () => {
    const res = await reportDelay(driverToken, {
      party: 'driver',
      delay_minutes: 15,
      reason: 'Car issue',
    });
    expect(res.status).toBe(201);
    expect(res.body.delay_event.party).toBe('driver');
  });

  it('rejects cross-party reports with 403', async () => {
    expect(
      (await reportDelay(passengerToken, { party: 'driver', delay_minutes: 5 })).status,
    ).toBe(403);
    expect(
      (await reportDelay(driverToken, { party: 'passenger', delay_minutes: 5 })).status,
    ).toBe(403);
    expect((await reportDelay(otherToken, { party: 'passenger', delay_minutes: 5 })).status).toBe(403);
  });

  it('validates delay payload', async () => {
    expect((await reportDelay(passengerToken, { party: 'passenger', delay_minutes: 0 })).status).toBe(422);
    expect((await reportDelay(passengerToken, { party: 'alien', delay_minutes: 5 })).status).toBe(422);
  });

  it('lists delays with party filter and membership gate', async () => {
    await reportDelay(passengerToken, { party: 'passenger', delay_minutes: 10 });
    await reportDelay(driverToken, { party: 'driver', delay_minutes: 5 });

    const all = await ctx.agent
      .get(`/api/bookings/${bookingId}/delays`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(all.status).toBe(200);
    expect(all.body.data.length).toBe(2);
    expect(all.body.pagination.total).toBe(2);

    const drivers = await ctx.agent
      .get(`/api/bookings/${bookingId}/delays?party=driver`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(drivers.status).toBe(200);
    expect(drivers.body.data.length).toBe(1);
    expect(drivers.body.data[0].party).toBe('driver');

    expect(
      (
        await ctx.agent
          .get(`/api/bookings/${bookingId}/delays`)
          .set('Authorization', `Bearer ${otherToken}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .get('/api/bookings/f9000000-0000-4000-8000-000000000099/delays')
          .set('Authorization', `Bearer ${passengerToken}`)
      ).status,
    ).toBe(404);
  });
});

describe('Passenger booking list', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let passenger2Token: string;

  const P2_ID = 'b1000000-0000-4000-8000-000000000004';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx);
    await ctx.prisma.user.create({
      data: {
        id: P2_ID,
        fullName: 'Second Passenger',
        phone: '+962795559034',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { avatarUrl: 'http://example.com/driver.png' },
    });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: P2_ID, role: 'passenger' });
  });

  it('returns enriched rows with rating lifecycle', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    await lockAndBook(ctx, passengerToken, tripId);

    const res = await ctx.agent.get('/api/bookings').set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    const row = res.body.data[0] as Record<string, unknown>;
    expect((row.vehicle as Record<string, unknown>).type).toBe('sedan');
    expect((row.vehicle as Record<string, unknown>).plate).toBe('OPS-101');
    expect((row.vehicle as Record<string, unknown>).seats).toBe(4);
    expect((row.driver as Record<string, unknown>).full_name).toBe('Ops Driver');
    expect(typeof (row.driver as Record<string, unknown>).image).toBe('string');
    expect(row.passenger_rating).toBeNull();

    const bookingId = (
      await ctx.prisma.booking.findFirst({ where: { passengerId: PASSENGER_ID } })
    )?.id as string;
    await ctx.prisma.rating.create({
      data: { bookingId, raterId: PASSENGER_ID, rateeId: DRIVER_ID, stars: 5 },
    });

    const rated = await ctx.agent.get('/api/bookings').set('Authorization', `Bearer ${passengerToken}`);
    expect(rated.body.data[0].passenger_rating).toBe(5);
  });

  it('filters by status and isolates owners', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    await lockAndBook(ctx, passengerToken, tripId);

    const completed = await ctx.agent
      .get('/api/bookings?status=completed')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(completed.status).toBe(200);
    expect(completed.body.data).toEqual([]);

    const other = await ctx.agent.get('/api/bookings').set('Authorization', `Bearer ${passenger2Token}`);
    expect(other.body.data.length).toBe(0);
  });

  it('shows vehicle and route on detail', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    const booking = await lockAndBook(ctx, passengerToken, tripId);

    const res = await ctx.agent
      .get(`/api/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);
    expect((res.body.booking.vehicle as Record<string, unknown>).type).toBe('sedan');
    expect((res.body.booking.trip as Record<string, unknown>).origin).toMatchObject({ city: 'Amman' });
  });
});

describe('Driver bookings', () => {
  let ctx: TestContext;
  let driverToken: string;
  let otherDriverToken: string;

  const OTHER_DRIVER_ID = 'b1000000-0000-4000-8000-000000000005';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx);
    await ctx.prisma.user.create({
      data: {
        id: OTHER_DRIVER_ID,
        fullName: 'Other Driver',
        phone: '+962795559035',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    otherDriverToken = generateAccessToken({ id: OTHER_DRIVER_ID, role: 'driver' });
  });

  it('lists own-trip bookings with masked phones', async () => {
    const tripId = await createTripViaApi(ctx, driverToken);
    const passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    await lockAndBook(ctx, passengerToken, tripId);

    const res = await ctx.agent
      .get('/api/driver/bookings')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.total_pages).toBe(1);
    const row = res.body.data[0] as Record<string, unknown>;
    expect(typeof row.id).toBe('string');
    expect(row.passenger_name).toBe('Ops Passenger');
    expect(row.passenger_phone as string).toContain('***');
    expect(row.seats_booked).toBe(1);
    expect(typeof row.agreed_fare).toBe('number');
    expect(row.status).toBe('confirmed');
    expect(row.reference_code).toMatch(/^MSR-/);
    expect(row.trip_id).toBe(tripId);
  });

  it('filters by status and isolates drivers', async () => {
    const tripId = await createTripViaApi(ctx, driverToken);
    const passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    const booking = await lockAndBook(ctx, passengerToken, tripId);
    await ctx.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'no_show' },
    });

    const filtered = await ctx.agent
      .get('/api/driver/bookings?status=no_show')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.length).toBe(1);
    expect(filtered.body.data[0].status).toBe('no_show');

    const other = await ctx.agent
      .get('/api/driver/bookings')
      .set('Authorization', `Bearer ${otherDriverToken}`);
    expect(other.body.data.length).toBe(0);

    const bogus = await ctx.agent
      .get('/api/driver/bookings?status=nope')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(bogus.status).toBe(422);
    expect(bogus.body.status).toBe('error');
    expect(typeof bogus.body.message).toBe('string');
    expect(Array.isArray(bogus.body.details)).toBe(true);
    expect(bogus.body.code).toBe('VALIDATION_ERROR');
  });

  it('shows booking detail to owner, 403 to others, 404 to unknown', async () => {
    const tripId = await createTripViaApi(ctx, driverToken);
    const passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    const booking = await lockAndBook(ctx, passengerToken, tripId);

    const res = await ctx.agent
      .get(`/api/driver/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.booking.id).toBe(booking.id);
    expect(res.body.booking.passenger_phone as string).toContain('***');
    expect(res.body.booking.seat_number).toBe(2);
    expect(res.body.booking.payment_status).toBeDefined();
    expect(res.body.booking.trip.origin).toMatchObject({ city: 'Amman' });
    expect(res.body.booking.trip.destination).toMatchObject({ city: 'Irbid' });
    expect(typeof res.body.booking.passenger_rating).toBe('number');

    expect(
      (
        await ctx.agent
          .get(`/api/driver/bookings/${booking.id}`)
          .set('Authorization', `Bearer ${otherDriverToken}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .get('/api/driver/bookings/550e8400-e29b-41d4-a716-446655440099')
          .set('Authorization', `Bearer ${driverToken}`)
      ).status,
    ).toBe(404);
  });
});

describe('PATCH /api/bookings/:id/pickup', () => {
  let ctx: TestContext;
  let passengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx);
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('edits pickup to a nearby custom point', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    const booking = await lockAndBook(ctx, passengerToken, tripId);

    // Compute a route first so the pickup has geometry to validate against.
    await ctx.agent.get(`/api/trips/${tripId}/route`).set('Authorization', `Bearer ${driverToken}`);

    const res = await ctx.agent
      .patch(`/api/bookings/${booking.id}/pickup`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ pickup_type: 'custom', lat: 32.25, lng: 35.8793, pickup_label: 'Near corridor' });

    expect(res.status).toBe(200);
    expect(res.body.booking_id).toBe(booking.id);
    expect(res.body.pickup_type).toBe('custom');
    expect(typeof res.body.detour_seconds).toBe('number');

    const row = await ctx.prisma.booking.findUnique({ where: { id: booking.id } });
    expect(row?.pickupStatus).toBe('pending');
    expect(Number(row?.pickupLat)).toBeCloseTo(32.25, 3);
  });

  it('rejects edit inside the cutoff window', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    const booking = await lockAndBook(ctx, passengerToken, tripId);
    await ctx.prisma.trip.update({
      where: { id: tripId },
      data: { departureTime: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const res = await ctx.agent
      .patch(`/api/bookings/${booking.id}/pickup`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ pickup_type: 'custom', lat: 32.25, lng: 35.8793 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PICKUP_EDIT_CUTOFF_PASSED');
  });

  it('rejects edit on non-confirmed booking', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    const booking = await lockAndBook(ctx, passengerToken, tripId);
    await ctx.prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });

    const res = await ctx.agent
      .patch(`/api/bookings/${booking.id}/pickup`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ pickup_type: 'custom', lat: 32.25, lng: 35.8793 });
    expect(res.status).toBe(409);
  });
});

describe('Driver reveal', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let otherToken: string;
  let adminToken: string;

  const ADMIN_ID = 'b1000000-0000-4000-8000-000000000006';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx);
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { fullName: 'Reveal Driver', age: 34, gender: 'male' },
    });
    await ctx.prisma.driverProfile.create({
      data: {
        driverId: DRIVER_ID,
        totalTrips: 32,
        punctualityRate: 96,
        professionalDriver: true,
        responseRate: 100,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962795559036',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  });

  it('reveals driver PII to booking participants', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    const booking = await lockAndBook(ctx, passengerToken, tripId);

    const res = await ctx.agent
      .get(`/api/bookings/${booking.id}/driver-profile`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver).toMatchObject({
      id: DRIVER_ID,
      first_name: 'Reveal',
      last_name: 'Driver',
      phone: '+962795559031',
      age: 34,
      gender: 'male',
      is_professional_driver: true,
    });
    expect(res.body.driver.driver_stats).toMatchObject({
      punctuality_rate: 96,
      completed_trips: 32,
    });
    expect(res.body.driver.vehicle_details).toMatchObject({
      manufacturer: 'Toyota',
      model: 'Camry',
      year: 2023,
      color: 'White',
      plate_number: 'OPS-101',
      seat_capacity: 4,
    });
  });

  it('gates reveal by participation and confirmation', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const tripId = await createTripViaApi(ctx, driverToken);
    const booking = await lockAndBook(ctx, passengerToken, tripId);

    expect(
      (
        await ctx.agent
          .get(`/api/bookings/${booking.id}/driver-profile`)
          .set('Authorization', `Bearer ${otherToken}`)
      ).status,
    ).toBe(403);

    await ctx.prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
    expect(
      (
        await ctx.agent
          .get(`/api/bookings/${booking.id}/driver-profile`)
          .set('Authorization', `Bearer ${passengerToken}`)
      ).status,
    ).toBe(409);

    const unknown = await ctx.agent
      .get('/api/bookings/550e8400-e29b-41d4-a716-446655440099/driver-profile')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(unknown.status).toBe(404);
    void adminToken;
  });
});
