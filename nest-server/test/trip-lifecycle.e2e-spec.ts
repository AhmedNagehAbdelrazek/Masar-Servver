// 1:1 port of Main Server/tests/integration/tripStartWindow.test.js,
// tripCompletion.test.js, tripEditCancel.test.js, tripCancellation.test.js,
// tripLifecycle.test.js and contract/tripStart + tripCompletion +
// tripEditCancel (Wave 5.2).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TripExpiryService } from '../src/modules/trips/trip-expiry.service.js';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'e4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e4000000-0000-4000-8000-000000000010';

function makeRef(prefix = 'MSR-'): string {
  return `${prefix}${randomUUID().slice(0, 7).toUpperCase()}`;
}

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
  departure_time: `${getFutureDate(5)}T14:00:00+03:00`,
  type_of_trip: 'once',
  fare_per_seat: '15.50',
  seats: [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ],
  instructions: ['No smoking please'],
  additional_instructions: 'Bring water',
  waypoints: [{ stop_name: 'Khalda', stop_lat: '31.9600', stop_lng: '35.9000' }],
};

async function seedEssentials(
  ctx: TestContext,
  driverId = DRIVER_ID,
  phone = '+962791111111',
  plate = 'LC-1',
  vehicleId = VEHICLE_ID,
): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id: driverId,
      fullName: 'Lifecycle Driver',
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
      driverId,
      manufacturer: 'Toyota',
      model: 'Camry',
      vehicleType: 'sedan',
      modelYear: 2023,
      plateNumber: plate,
      color: 'White',
      seats: 4,
      isVerified: true,
    },
  });
  const plan = await ctx.prisma.subscriptionPlan.create({
    data: {
      name: `Basic ${driverId.slice(0, 4)}`,
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
      driverId,
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
    where: { id: driverId },
    data: { totalBalance: 100, isInDebt: false },
  });
}

describe('Trip start window', () => {
  let ctx: TestContext;
  let driverToken: string;
  let driver2Token: string;

  const DRIVER2_ID = 'e4000000-0000-4000-8000-000000000062';

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
        id: DRIVER2_ID,
        fullName: 'Driver Two',
        phone: '+962710000362',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Start Passenger',
        phone: '+962710000363',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    driver2Token = generateAccessToken({ id: DRIVER2_ID, role: 'driver' });
  });

  async function seedTrip(departure: Date, status = 'published'): Promise<{ id: string }> {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: departure,
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status: status as 'published' | 'in_progress',
      },
    });
    await ctx.prisma.tripSeat.createMany({
      data: [
        { tripId: trip.id, seatNumber: 1, seatType: 'driver', wasAvailable: false },
        { tripId: trip.id, seatNumber: 2, seatType: 'available', wasAvailable: true },
      ],
    });
    return { id: trip.id };
  }

  async function seedBooking(tripId: string): Promise<{ id: string }> {
    return ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        referenceCode: 'STRT-INT-01',
        status: 'confirmed',
      },
    });
  }

  function future(minutes: number): Date {
    return new Date(Date.now() + minutes * 60000);
  }

  it('starts within the window with tracking link + notify', async () => {
    const trip = await seedTrip(future(30));
    await seedBooking(trip.id);

    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.tracking_link).toContain(`trip=${trip.id}`);
    expect(res.body.tracking_link).toBe(`wss://api.masar.app/socket.io?trip=${trip.id}`);

    const row = await ctx.prisma.trip.findUnique({ where: { id: trip.id } });
    expect(row?.status).toBe('in_progress');

    const notes = await ctx.prisma.notification.findMany({
      where: { userId: PASSENGER_ID, type: 'TRIP_STARTED' },
    });
    expect(notes.length).toBe(1);
  });

  it('rejects too-early start with 400', async () => {
    const trip = await seedTrip(future(120));
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOO_EARLY_TO_START');
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip.id } }))?.status).toBe('published');
  });

  it('allows overdue start', async () => {
    const trip = await seedTrip(future(-30));
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('rejects double start with 422', async () => {
    const trip = await seedTrip(future(30));
    await ctx.agent.post(`/api/trips/${trip.id}/start`).set('Authorization', `Bearer ${driverToken}`);
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRIP_STATUS');
  });

  it('clears next_trip on home after start', async () => {
    const trip = await seedTrip(future(30));
    await seedBooking(trip.id);

    const before = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(before.status).toBe(200);
    expect(before.body.next_trip).not.toBeNull();
    expect(before.body.next_trip.trip_id).toBe(trip.id);

    await ctx.agent.post(`/api/trips/${trip.id}/start`).set('Authorization', `Bearer ${driverToken}`);

    const after = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(after.status).toBe(200);
    expect(after.body.next_trip).toBeNull();
  });

  it('rejects other driver with 403', async () => {
    const trip = await seedTrip(future(30));
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driver2Token}`);
    expect(res.status).toBe(403);
  });
});

describe('Trip completion', () => {
  let ctx: TestContext;
  let driverToken: string;

  const C_DRIVER_ID = 'f4000000-0000-4000-8000-000000000001';
  const C_PASSENGER_ID = 'f4000000-0000-4000-8000-000000000002';
  const C_VEHICLE_ID = 'f4000000-0000-4000-8000-000000000010';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx, C_DRIVER_ID, '+962794001101', 'CMPL-1', C_VEHICLE_ID);
    await ctx.prisma.user.create({
      data: {
        id: C_PASSENGER_ID,
        fullName: 'Completion Passenger',
        phone: '+962794001102',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: C_DRIVER_ID, role: 'driver' });
  });

  async function seedInProgressTrip(): Promise<{ id: string }> {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: C_DRIVER_ID,
        vehicleId: C_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() - 10 * 60 * 1000),
        totalSeats: 3,
        availableSeats: 2,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status: 'in_progress',
      },
    });
    await ctx.prisma.tripSeat.createMany({
      data: [
        { tripId: trip.id, seatNumber: 1, seatType: 'driver', wasAvailable: false },
        { tripId: trip.id, seatNumber: 2, seatType: 'unavailable', wasAvailable: false },
        { tripId: trip.id, seatNumber: 3, seatType: 'available', wasAvailable: true },
      ],
    });
    return { id: trip.id };
  }

  it('finalizes confirmed bookings', async () => {
    const trip = await seedInProgressTrip();
    const booking = await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: C_PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        status: 'confirmed',
        paymentStatus: 'pending',
        referenceCode: makeRef('MSR-T'),
      },
    });

    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(trip.id);
    expect(typeof res.body.commission).toBe('number');
    expect(typeof res.body.balance_after).toBe('number');
    expect(typeof res.body.is_in_debt).toBe('boolean');

    const updated = await ctx.prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe('completed');
    expect(updated?.paymentStatus).toBe('paid_cash');
    expect(updated?.completedAt).not.toBeNull();
  });

  it('leaves cancelled bookings untouched', async () => {
    const trip = await seedInProgressTrip();
    const booking = await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: C_PASSENGER_ID,
        seatNumber: 3,
        seatsBooked: 1,
        agreedFare: 5,
        status: 'cancelled',
        paymentStatus: null,
        cancellationReason: 'cancelled_by_passenger',
        cancelledAt: new Date(),
        referenceCode: makeRef('MSR-T'),
      },
    });

    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);

    const updated = await ctx.prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe('cancelled');
    expect(updated?.completedAt).toBeNull();
  });

  it('rejects double complete with 422', async () => {
    const trip = await seedInProgressTrip();
    await ctx.agent.post(`/api/trips/${trip.id}/complete`).set('Authorization', `Bearer ${driverToken}`);
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRIP_STATUS');
  });

  it('rejects completion from non-started trip', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: C_DRIVER_ID,
        vehicleId: C_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 3600 * 1000),
        totalSeats: 2,
        availableSeats: 1,
        farePerSeat: 6.5,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
  });
});

describe('Trip edit, cancel and attributes', () => {
  let ctx: TestContext;
  let driverToken: string;
  let otherDriverToken: string;

  const E_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const E_PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
  const E_OTHER_ID = '550e8400-e29b-41d4-a716-446655440003';
  const E_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx, E_DRIVER_ID, '+962791111111', 'TEST-123', E_VEHICLE_ID);
    await ctx.prisma.user.create({
      data: {
        id: E_PASSENGER_ID,
        fullName: 'Test Passenger',
        phone: '+962792222222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: E_OTHER_ID,
        fullName: 'Other Driver',
        phone: '+962793333333',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: E_DRIVER_ID, role: 'driver' });
    otherDriverToken = generateAccessToken({ id: E_OTHER_ID, role: 'driver' });
  });

  async function createTrip(): Promise<string> {
    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_TRIP_BODY);
    expect(res.status).toBe(201);
    return res.body.trip_id as string;
  }

  async function createConfirmedBooking(tripId: string): Promise<{ id: string }> {
    return ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: E_PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 15.5,
        status: 'confirmed',
        referenceCode: makeRef(),
      },
    });
  }

  it('edits fare preserving other fields', async () => {
    const tripId = await createTrip();
    const res = await ctx.agent
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ fare_per_seat: 8.5 });

    expect(res.status).toBe(200);
    expect(res.body.trip.id).toBe(tripId);
    expect(res.body.trip.fare_per_seat).toBe(8.5);
    expect(res.body.trip.status).toBe('published');
    expect(res.body.trip.origin_city).toBe('Amman');
    expect(res.body.trip.departure_time).toBeDefined();

    const row = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(Number(row?.farePerSeat)).toBe(8.5);
    expect(row?.originCity).toBe('Amman');
    expect(row?.status).toBe('published');
  });

  it('rejects non-owner edit with flat 403 envelope', async () => {
    const tripId = await createTrip();
    const res = await ctx.agent
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${otherDriverToken}`)
      .send({ fare_per_seat: 1 });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(typeof res.body.message).toBe('string');
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('notifies on departure change', async () => {
    const tripId = await createTrip();
    await createConfirmedBooking(tripId);
    const plus7 = getFutureDate(7);

    const res = await ctx.agent
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ departure_time: `${plus7}T09:00:00+03:00` });

    expect(res.status).toBe(200);
    expect(res.body.trip.notified_passengers).toBe(1);
    const notes = await ctx.prisma.notification.findMany({
      where: { userId: E_PASSENGER_ID, type: 'TRIP_TIME_CHANGED' },
    });
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect((notes[0].data as Record<string, unknown>).trip_id).toBe(tripId);
  });

  it('rejects past departure and bad enum', async () => {
    const tripId = await createTrip();
    expect(
      (
        await ctx.agent
          .put(`/api/trips/${tripId}`)
          .set('Authorization', `Bearer ${driverToken}`)
          .send({ departure_time: '2020-01-01T00:00:00Z' })
      ).status,
    ).toBe(422);
    expect(
      (
        await ctx.agent
          .put(`/api/trips/${tripId}`)
          .set('Authorization', `Bearer ${driverToken}`)
          .send({ gender_preference: 'everyone' })
      ).status,
    ).toBe(422);
  });

  it('replaces attributes wholesale', async () => {
    const tripId = await createTrip();
    const res = await ctx.agent
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ attributes: [{ attr_key: 'ac', attr_value: 'true' }] });

    expect(res.status).toBe(200);
    expect(res.body.trip.attributes).toEqual([{ attr_key: 'ac', attr_value: 'true' }]);
  });

  it('returns raw attribute pairs from the attributes endpoint', async () => {
    const tripId = await createTrip();
    await ctx.agent
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        attributes: [
          { attr_key: 'ac', attr_value: 'true' },
          { attr_key: 'women_only', attr_value: 'false' },
        ],
      });

    const attrRes = await ctx.agent
      .get(`/api/trips/${tripId}/attributes`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(attrRes.status).toBe(200);
    expect(attrRes.body.trip_id).toBe(tripId);
    expect(attrRes.body.attributes).toEqual([
      { attr_key: 'ac', attr_value: 'true' },
      { attr_key: 'women_only', attr_value: 'false' },
    ]);

    const missing = await ctx.agent
      .get('/api/trips/550e8400-e29b-41d4-a716-446655440099/attributes')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(missing.status).toBe(404);
  });

  it('cancels with booking cascade, lock release and notify', async () => {
    const tripId = await createTrip();
    await createConfirmedBooking(tripId);
    await ctx.redis.set(
      `seat_lock:${tripId}:2`,
      JSON.stringify({ passenger_id: E_PASSENGER_ID }),
      'EX',
      300,
    );
    expect(await ctx.redis.exists(`seat_lock:${tripId}:2`)).toBe(1);

    const res = await ctx.agent
      .delete(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip.status).toBe('cancelled');
    expect(res.body.trip.notified_passengers).toBe(1);
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.status).toBe('cancelled');
    const bookings = await ctx.prisma.booking.findMany({ where: { tripId } });
    expect(bookings.every((b) => b.status === 'cancelled')).toBe(true);
    expect(await ctx.redis.exists(`seat_lock:${tripId}:2`)).toBe(0);
    expect(
      (
        await ctx.prisma.notification.findMany({
          where: { userId: E_PASSENGER_ID, type: 'TRIP_CANCELLED' },
        })
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('rejects cancel once started or by non-owner', async () => {
    const tripId = await createTrip();
    await ctx.prisma.trip.update({ where: { id: tripId }, data: { status: 'in_progress' } });
    expect(
      (
        await ctx.agent.delete(`/api/trips/${tripId}`).set('Authorization', `Bearer ${driverToken}`)
      ).status,
    ).toBe(403);

    // Second create needs a free slot (1h overlap guard is live in this port).
    const plus6 = getFutureDate(6);
    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_TRIP_BODY, departure_time: `${plus6}T14:00:00+03:00` });
    expect(res.status).toBe(201);
    const tripId2 = res.body.trip_id as string;
    expect(
      (
        await ctx.agent
          .delete(`/api/trips/${tripId2}`)
          .set('Authorization', `Bearer ${otherDriverToken}`)
      ).status,
    ).toBe(403);
  });

  it('moves a trip into a free window via update (overlap recheck)', async () => {
    const date = getFutureDate(5);
    async function overlapCreate(time: string): Promise<string> {
      const res = await ctx.agent
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ ...VALID_TRIP_BODY, departure_time: `${date}T${time}:00+03:00` });
      return res.body.trip_id as string;
    }
    await overlapCreate('05:00');
    const second = await overlapCreate('10:00');

    const bad = await ctx.agent
      .put(`/api/trips/${second}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ departure_time: `${date}T05:30:00+03:00` });
    expect(bad.status).toBe(409);
    expect(bad.body.code).toBe('TRIP_TIME_OVERLAP');

    const good = await ctx.agent
      .put(`/api/trips/${second}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ departure_time: `${date}T06:00:00+03:00` });
    expect(good.status).toBe(200);
  });
});

describe('Trip cancellation with penalty', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;

  const CANCEL_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440c01';
  const CANCEL_PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440c02';
  const CANCEL_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440c10';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx, CANCEL_DRIVER_ID, '+962710000c01', 'CANCEL-1', CANCEL_VEHICLE_ID);
    await ctx.prisma.user.create({
      data: {
        id: CANCEL_PASSENGER_ID,
        fullName: 'Cancel Test Passenger',
        phone: '+962710000c02',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: CANCEL_DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: CANCEL_PASSENGER_ID, role: 'passenger' });
  });

  async function seedTrip(status = 'published'): Promise<{ id: string }> {
    return ctx.prisma.trip.create({
      data: {
        driverId: CANCEL_DRIVER_ID,
        vehicleId: CANCEL_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Aqaba',
        departureTime: new Date(Date.now() + 3600 * 1000),
        totalSeats: 4,
        availableSeats: 4,
        farePerSeat: 10,
        isRecurring: false,
        genderPreference: 'all',
        status: status as 'published' | 'in_progress',
      },
    });
  }

  it('cancels with no bookings and records penalty', async () => {
    const trip = await seedTrip();
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/cancel`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ reason: 'Personal emergency', note: 'Will resume tomorrow' });

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(trip.id);
    expect(res.body.penalty_id).toBeDefined();
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip.id } }))?.status).toBe('cancelled');

    const penalty = await ctx.prisma.penalty.findUnique({ where: { id: res.body.penalty_id as string } });
    expect(penalty).toBeDefined();
    expect(penalty?.penaltyType).toBe('trip_cancellation');
  });

  it('rejects when confirmed bookings exist', async () => {
    const trip = await seedTrip();
    await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: CANCEL_PASSENGER_ID,
        seatNumber: 1,
        seatsBooked: 1,
        agreedFare: 10,
        referenceCode: 'CN-001',
        status: 'confirmed',
      },
    });

    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/cancel`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ reason: 'Changed my mind' });
    expect(res.status).toBe(409);
  });

  it('rejects in-progress trips', async () => {
    const trip = await seedTrip('in_progress');
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/cancel`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ reason: 'Engine trouble' });
    expect(res.status).toBe(409);
  });

  it('rejects non-owner and missing reason', async () => {
    const trip = await seedTrip();
    expect(
      (
        await ctx.agent
          .post(`/api/trips/${trip.id}/cancel`)
          .set('Authorization', `Bearer ${passengerToken}`)
          .send({ reason: 'Haha no' })
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .post(`/api/trips/${trip.id}/cancel`)
          .set('Authorization', `Bearer ${driverToken}`)
          .send({})
      ).status,
    ).toBe(422);
  });

  it('escalates severity on repeat cancellations', async () => {
    for (let i = 0; i < 3; i++) {
      await ctx.prisma.penalty.create({
        data: {
          userId: CANCEL_DRIVER_ID,
          type: 'warning',
          penaltyType: 'trip_cancellation',
          severity: 'minor',
          reason: `Previous cancel ${i}`,
          issuedBy: CANCEL_DRIVER_ID,
        },
      });
    }
    const trip = await seedTrip();
    const res = await ctx.agent
      .post(`/api/trips/${trip.id}/cancel`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ reason: 'Fourth cancellation' });

    expect(res.status).toBe(200);
    const penalty = await ctx.prisma.penalty.findUnique({ where: { id: res.body.penalty_id as string } });
    expect(penalty?.severity).toBe('moderate');
  });
});

describe('tripExpiry sweep', () => {
  let ctx: TestContext;
  let driverToken: string;

  const SWEEP_DRIVER_ID = 'e4000000-0000-4000-8000-000000000001';
  const SWEEP_PASSENGER_ID = 'e4000000-0000-4000-8000-000000000002';
  const SWEEP_VEHICLE_ID = 'e4000000-0000-4000-8000-000000000010';

  function hoursAgo(h: number): Date {
    return new Date(Date.now() - h * 3600 * 1000);
  }

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx, SWEEP_DRIVER_ID, '+962795559021', 'LIFECYCLE1', SWEEP_VEHICLE_ID);
    await ctx.prisma.user.create({
      data: {
        id: SWEEP_PASSENGER_ID,
        fullName: 'Lifecycle Passenger',
        phone: '+962795559020',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: SWEEP_DRIVER_ID, role: 'driver' });
    void driverToken;
  });

  async function addBooking(tripId: string): Promise<{ id: string }> {
    return ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: SWEEP_PASSENGER_ID,
        seatNumber: null,
        seatsBooked: 1,
        agreedFare: '15.00',
        status: 'confirmed',
        referenceCode: makeRef(),
      },
    });
  }

  it('auto-completes started trips past their end', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: SWEEP_DRIVER_ID,
        vehicleId: SWEEP_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: hoursAgo(5),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        isRecurring: false,
        genderPreference: 'all',
        status: 'in_progress',
      },
    });
    const booking = await addBooking(trip.id);

    const expiry = ctx.app.get(TripExpiryService);
    const result = await expiry.refreshStaleTrips();

    expect(result.autoCompleted).toContain(trip.id);
    expect(result.errors).toEqual([]);
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip.id } }))?.status).toBe('completed');
    const updated = await ctx.prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe('completed');
    expect(updated?.completedAt).not.toBeNull();
  });

  it('expires never-operated trips with NO_SHOW bookings', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: SWEEP_DRIVER_ID,
        vehicleId: SWEEP_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: hoursAgo(5),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    const booking = await addBooking(trip.id);

    const expiry = ctx.app.get(TripExpiryService);
    const result = await expiry.refreshStaleTrips();

    expect(result.expiredUnoperated).toContain(trip.id);
    expect(result.noShowBookings).toBe(1);
    expect(result.errors).toEqual([]);
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip.id } }))?.status).toBe('cancelled');
    expect((await ctx.prisma.booking.findUnique({ where: { id: booking.id } }))?.status).toBe('no_show');
  });

  it('leaves future trips untouched but expires just-departed ones', async () => {
    const futureTrip = await ctx.prisma.trip.create({
      data: {
        driverId: SWEEP_DRIVER_ID,
        vehicleId: SWEEP_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 3600 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    const futureBooking = await addBooking(futureTrip.id);
    const recentTrip = await ctx.prisma.trip.create({
      data: {
        driverId: SWEEP_DRIVER_ID,
        vehicleId: SWEEP_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: hoursAgo(1),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    const recentBooking = await addBooking(recentTrip.id);

    const expiry = ctx.app.get(TripExpiryService);
    const result = await expiry.refreshStaleTrips();

    expect(result.autoCompleted).toEqual([]);
    expect(result.expiredUnoperated).toEqual([recentTrip.id]);
    expect(result.noShowBookings).toBe(1);
    expect((await ctx.prisma.trip.findUnique({ where: { id: futureTrip.id } }))?.status).toBe('published');
    expect((await ctx.prisma.booking.findUnique({ where: { id: futureBooking.id } }))?.status).toBe('confirmed');
    expect((await ctx.prisma.trip.findUnique({ where: { id: recentTrip.id } }))?.status).toBe('cancelled');
    expect((await ctx.prisma.booking.findUnique({ where: { id: recentBooking.id } }))?.status).toBe('no_show');
  });

  it('leaves started trips within the ride duration untouched', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: SWEEP_DRIVER_ID,
        vehicleId: SWEEP_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: hoursAgo(1),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        isRecurring: false,
        genderPreference: 'all',
        status: 'in_progress',
      },
    });
    const booking = await addBooking(trip.id);

    const expiry = ctx.app.get(TripExpiryService);
    const result = await expiry.refreshStaleTrips();

    expect(result.autoCompleted).toEqual([]);
    expect(result.expiredUnoperated).toEqual([]);
    expect((await ctx.prisma.trip.findUnique({ where: { id: trip.id } }))?.status).toBe('in_progress');
    expect((await ctx.prisma.booking.findUnique({ where: { id: booking.id } }))?.status).toBe('confirmed');
  });

  it('tolerates non-array scheduler arguments', async () => {
    const expiry = ctx.app.get(TripExpiryService);
    await expect(expiry.refreshStaleTrips({ date: new Date() })).resolves.toMatchObject({ errors: [] });
    await expect(expiry.refreshStaleTrips(new Date())).resolves.toMatchObject({ errors: [] });
    await expect(expiry.refreshStaleTrips()).resolves.toMatchObject({ errors: [] });
  });
});
