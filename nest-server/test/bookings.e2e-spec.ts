// 1:1 port of Main Server/tests/integration/bookingFlow.test.js,
// bookingMultiSeat.test.js, bookingSeatNumbers.test.js and
// contract/booking.contract.test.js (Wave 5.3).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'a1000000-0000-4000-8000-000000000001';
const PASSENGER1_ID = 'a1000000-0000-4000-8000-000000000002';
const PASSENGER2_ID = 'a1000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'a1000000-0000-4000-8000-000000000010';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

const TRIP_BODY = {
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
};

describe('Booking flow', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passenger1Token: string;
  let passenger2Token: string;
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
        fullName: 'Booking Driver',
        phone: '+962795556001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER1_ID,
        fullName: 'Booking Passenger 1',
        phone: '+962795556002',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER2_ID,
        fullName: 'Booking Passenger 2',
        phone: '+962795556003',
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
        plateNumber: 'BKF-101',
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
    passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });

    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(TRIP_BODY);
    expect(tripRes.status).toBe(201);
    tripId = tripRes.body.trip_id as string;
  });

  function lockSeat(token: string, seatNumber: number): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ seat_number: seatNumber });
  }

  function createBooking(
    token: string,
    overrides: Record<string, unknown> = {},
  ): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '20.00', ...overrides });
  }

  it('books with held lock and default pickup', async () => {
    await lockSeat(passenger1Token, 2);
    const res = await createBooking(passenger1Token);

    expect(res.status).toBe(201);
    expect(res.body.booking.id).toBeDefined();
    expect(res.body.booking.reference_code).toMatch(/^MSR-[A-Z0-9]{6}$/);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.payment_status).toBe('pending');
    expect(res.body.booking.seat_number).toBe(2);
    expect(res.body.booking.agreed_fare).toBe(20);
    expect(res.body.booking.driver.phone_masked).not.toContain('+962795556001');
  });

  it('marks seat unavailable and decrements capacity', async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);

    const seat = await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 2 } });
    expect(seat?.seatType).toBe('unavailable');
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.availableSeats).toBe(1);
    expect(
      (await ctx.prisma.booking.findMany({ where: { tripId } })).every((b) => b.status === 'confirmed'),
    ).toBe(true);
  });

  it('flips trip to full when last seat books', async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);
    await lockSeat(passenger2Token, 3);
    const res = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`)
      .send({ trip_id: tripId, seat_numbers: [3], agreed_fare: '20.00' });

    expect(res.status).toBe(201);
    const trip = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(trip?.availableSeats).toBe(0);
    expect(trip?.status).toBe('full');
  });

  it('rejects booking without lock with 404', async () => {
    const res = await createBooking(passenger1Token);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it("rejects booking on another passenger's lock with 404", async () => {
    await lockSeat(passenger1Token, 2);
    const res = await createBooking(passenger2Token);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it('rejects fare mismatch with 422', async () => {
    await lockSeat(passenger1Token, 2);
    const res = await createBooking(passenger1Token, { agreed_fare: 25.0 });
    expect(res.status).toBe(422);
  });

  it('rejects lock on booked seat and second booking', async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);
    expect((await lockSeat(passenger2Token, 2)).status).toBe(422);
    const res = await createBooking(passenger2Token);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it('rejects driver, anonymous and invalid payloads', async () => {
    expect((await createBooking(driverToken)).status).toBe(403);
    expect((await ctx.agent.post('/api/bookings').send({ trip_id: tripId })).status).toBe(401);
    expect(
      (
        await ctx.agent
          .post('/api/bookings')
          .set('Authorization', `Bearer ${passenger1Token}`)
          .send({ trip_id: 'not-a-uuid' })
      ).status,
    ).toBe(422);
  });

  it('lists own bookings with mask and pagination', async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);

    const res = await ctx.agent.get('/api/bookings').set('Authorization', `Bearer ${passenger1Token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('confirmed');
    expect(res.body.data[0].reference_code).toMatch(/^MSR-/);
    expect(String(res.body.data[0].driver.phone_masked)).not.toContain('5556001');
    expect(res.body.pagination).toBeDefined();

    const cancelled = await ctx.agent
      .get('/api/bookings?status=cancelled')
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(cancelled.body.data.length).toBe(0);

    const other = await ctx.agent
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`);
    expect(other.body.data.length).toBe(0);
  });

  it('shows detail to owner, 403 to others, 404 to unknown', async () => {
    await lockSeat(passenger1Token, 2);
    const created = await createBooking(passenger1Token);
    const bookingId = created.body.booking.id as string;

    const res = await ctx.agent
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.booking.id).toBe(bookingId);
    expect(res.body.booking.trip.origin).toMatchObject({ city: 'Amman' });
    expect(res.body.booking.driver.full_name).toBe('Booking Driver');

    expect(
      (
        await ctx.agent
          .get(`/api/bookings/${bookingId}`)
          .set('Authorization', `Bearer ${passenger2Token}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .get('/api/bookings/b1000000-0000-4000-8000-000000000099')
          .set('Authorization', `Bearer ${passenger1Token}`)
      ).status,
    ).toBe(404);
  });

  it('cancels more than 1h before departure', async () => {
    await lockSeat(passenger1Token, 2);
    const created = await createBooking(passenger1Token);
    const bookingId = created.body.booking.id as string;

    const res = await ctx.agent
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');

    const seat = await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 2 } });
    expect(seat?.seatType).toBe('available');
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.availableSeats).toBe(2);
    const booking = await ctx.prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking?.cancelledAt).not.toBeNull();
    expect(booking?.cancellationReason).toBe('cancelled_by_passenger');
  });

  it('restores full to published and allows rebook', async () => {
    await lockSeat(passenger1Token, 2);
    const first = await createBooking(passenger1Token);
    await lockSeat(passenger1Token, 3);
    await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ trip_id: tripId, seat_numbers: [3], agreed_fare: '20.00' });
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.status).toBe('full');

    await ctx.agent
      .put(`/api/bookings/${first.body.booking.id as string}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.status).toBe('published');

    await lockSeat(passenger2Token, 2);
    const rebook = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`)
      .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '20.00' });
    expect(rebook.status).toBe(201);
    expect(rebook.body.booking.passenger.full_name).toBe('Booking Passenger 2');
  });

  it('rejects double cancel, window violation and foreign cancel', async () => {
    await lockSeat(passenger1Token, 2);
    const created = await createBooking(passenger1Token);
    const bookingId = created.body.booking.id as string;

    await ctx.agent.put(`/api/bookings/${bookingId}/cancel`).set('Authorization', `Bearer ${passenger1Token}`);
    expect(
      (
        await ctx.agent
          .put(`/api/bookings/${bookingId}/cancel`)
          .set('Authorization', `Bearer ${passenger1Token}`)
      ).status,
    ).toBe(409);

    await lockSeat(passenger2Token, 3);
    const second = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`)
      .send({ trip_id: tripId, seat_numbers: [3], agreed_fare: '20.00' });
    await ctx.prisma.trip.update({
      where: { id: tripId },
      data: { departureTime: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const inside = await ctx.agent
      .put(`/api/bookings/${second.body.booking.id as string}/cancel`)
      .set('Authorization', `Bearer ${passenger2Token}`);
    expect(inside.status).toBe(409);
    expect(inside.body.code).toBe('CANCELLATION_WINDOW_CLOSED');

    expect(
      (
        await ctx.agent
          .put(`/api/bookings/${bookingId}/cancel`)
          .set('Authorization', `Bearer ${passenger2Token}`)
      ).status,
    ).toBe(403);
  });
});

describe('Multi-seat bookings', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let tripId: string;
  let stopId: string;

  const M_DRIVER_ID = 'f4000000-0000-4000-8000-000000000001';
  const M_PASSENGER_ID = 'f4000000-0000-4000-8000-000000000002';
  const M_VEHICLE_ID = 'f4000000-0000-4000-8000-000000000010';

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
        id: M_DRIVER_ID,
        fullName: 'MultiSeat Driver',
        phone: '+962795559020',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: M_PASSENGER_ID,
        fullName: 'MultiSeat Passenger',
        phone: '+962795559021',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: M_VEHICLE_ID,
        driverId: M_DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'MS-101',
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
        driverId: M_DRIVER_ID,
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
      where: { id: M_DRIVER_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
    passengerToken = generateAccessToken({ id: M_PASSENGER_ID, role: 'passenger' });
    const driverToken = generateAccessToken({ id: M_DRIVER_ID, role: 'driver' });

    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
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
        waypoints: [{ stop_name: 'Salt' }],
      });
    expect(res.status).toBe(201);
    tripId = res.body.trip_id as string;
    const stop = await ctx.prisma.tripStop.findFirst({ where: { tripId } });
    stopId = stop?.id ?? '';
  });

  async function lockSeats(body: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
    const res = await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send(body as never);
    return { status: res.status, body: res.body as Record<string, unknown> };
  }

  async function book(body: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
    const res = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, ...(body as Record<string, unknown>) });
    return { status: res.status, body: res.body as Record<string, unknown> };
  }

  it('books multiple seats with dropoff stop', async () => {
    await lockSeats({ seat_numbers: [2, 3] });
    const res = await book({ seat_numbers: [2, 3], agreed_fare: 15.0, drop_off_point: stopId });

    expect(res.status).toBe(201);
    const booking = res.body.booking as Record<string, unknown>;
    expect(booking.status).toBe('confirmed');
    expect(booking.seats_booked).toBe(2);
    expect(booking.dropoff_place).toBeDefined();

    const trip = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(trip?.availableSeats).toBe(0);
    expect(trip?.status).toBe('full');
  });

  it('rejects foreign drop-off with 409', async () => {
    await lockSeats({ seat_numbers: [2] });
    const res = await book({
      seat_numbers: [2],
      agreed_fare: 15.0,
      drop_off_point: 'f4000000-0000-4000-8000-000000000099',
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DROP_OFF_POINT_NOT_ON_TRIP');
  });

  it('rejects exceeding available with 409', async () => {
    await lockSeats({ seat_numbers: [2] });
    await book({ seat_numbers: [2], agreed_fare: 15.0 });
    const res = await book({ seat_numbers: [2, 3], agreed_fare: 15.0 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
  });

  it('rejects deprecated single-seat fields with 422', async () => {
    const res = await book({ seat_number: 2, seats: 2, agreed_fare: 15.0 });
    expect(res.status).toBe(422);
  });

  it('locks, books and flips multiple seats with history', async () => {
    const locked = await lockSeats({ seat_numbers: [2, 3] });
    expect(locked.status).toBe(200);
    expect(locked.body.seat_numbers).toEqual([2, 3]);

    const res = await book({ seat_numbers: [2, 3], agreed_fare: 15.0 });
    expect(res.status).toBe(201);
    const booking = res.body.booking as Record<string, unknown>;
    expect(booking.seat_numbers).toEqual([2, 3]);
    expect(booking.seats_booked).toBe(2);
    expect(booking.seat_number).toBe(2);

    const s2 = await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 2 } });
    const s3 = await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 3 } });
    expect(s2?.seatType).toBe('unavailable');
    expect(s3?.seatType).toBe('unavailable');
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.status).toBe('full');

    const seats = await ctx.agent
      .get(`/api/trips/${tripId}/seats`)
      .set('Authorization', `Bearer ${passengerToken}`);
    const byNumber = Object.fromEntries(
      (seats.body.seats as { seat_number: number; is_available: boolean }[]).map((s) => [s.seat_number, s]),
    ) as Record<number, { is_available: boolean }>;
    expect(byNumber[2]?.is_available).toBe(false);
    expect(byNumber[3]?.is_available).toBe(false);
  });

  it('requires the mandatory seat list', async () => {
    await lockSeats({ seat_numbers: [2, 3] });
    const res = await book({ seats: 2, agreed_fare: 15.0 });
    expect(res.status).toBe(422);
    expect((await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 2 } }))?.seatType).toBe(
      'available',
    );
  });

  it('clashes atomically without half-locks', async () => {
    await ctx.prisma.user.create({
      data: {
        id: 'f4000000-0000-4000-8000-000000000003',
        fullName: 'Second Passenger',
        phone: '+962795559022',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    const otherToken = generateAccessToken({
      id: 'f4000000-0000-4000-8000-000000000003',
      role: 'passenger',
    });
    await lockSeats({ seat_number: 2 });

    const clash = await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ seat_numbers: [2, 3] });
    expect(clash.status).toBe(409);

    // Seat 3 was not half-locked by the failed bulk attempt.
    const solo = await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ seat_number: 3 });
    expect(solo.status).toBe(200);
  });

  it('rejects booking mismatches', async () => {
    await lockSeats({ seat_numbers: [2, 3] });
    expect((await book({ seat_numbers: [2, 3], seats: 1, agreed_fare: 15.0 })).status).toBe(422);
    expect(
      (await book({ seat_number: 2, seat_numbers: [2, 3], agreed_fare: 15.0 })).status,
    ).toBe(422);
    expect(
      (
        await ctx.agent
          .post(`/api/trips/${tripId}/seats/lock`)
          .set('Authorization', `Bearer ${passengerToken}`)
          .send({ seat_number: 2, seat_numbers: [2, 3] })
      ).status,
    ).toBe(422);
  });

  it('restores seats on cancel and allows relock', async () => {
    await lockSeats({ seat_numbers: [2, 3] });
    const created = await book({ seat_numbers: [2, 3], agreed_fare: 15.0 });
    const bookingId = (created.body.booking as Record<string, unknown>).id as string;

    const cancelled = await ctx.agent
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(cancelled.status).toBe(200);

    expect((await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 2 } }))?.seatType).toBe(
      'available',
    );
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.availableSeats).toBe(2);
    expect((await lockSeats({ seat_number: 2 })).status).toBe(200);
  });
});
