// 1:1 port of Main Server/tests/integration/tripOptions.test.js and
// tripPassengers.test.js (Wave 5.1).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'd2000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'd2000000-0000-4000-8000-000000000002';
const OTHER_DRIVER_ID = 'f4100000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'd2000000-0000-4000-8000-000000000010';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

async function seedEssentials(ctx: TestContext): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id: DRIVER_ID,
      fullName: 'Reads Driver',
      phone: '+962795559001',
      countryCode: 'JO',
      role: 'driver',
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
  await ctx.prisma.user.create({
    data: {
      id: PASSENGER_ID,
      fullName: 'Reads Passenger',
      phone: '+962795559002',
      countryCode: 'JO',
      role: 'passenger',
      passwordHash: 'hashed',
      isVerified: true,
      avatarUrl: 'https://cdn.example.test/avatar.png',
      avgRating: 4.5,
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
      plateNumber: 'READ-101',
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

describe('GET /api/trips/:trip_id/options', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let tripId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedEssentials(ctx);
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

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
        waypoints: [{ stop_name: 'Khalda' }, { stop_name: 'Salt Street' }],
      });
    expect(res.status).toBe(201);
    tripId = res.body.trip_id as string;
  });

  it('exposes sellable count and ordered drop-off points', async () => {
    const res = await ctx.agent
      .get(`/api/trips/${tripId}/options`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(tripId);
    expect(typeof res.body.available_seats).toBe('number');
    expect(res.body.available_seats).toBe(2);
    expect(Array.isArray(res.body.drop_off_points)).toBe(true);
    expect(res.body.drop_off_points.length).toBe(2);
    const orders = (res.body.drop_off_points as { stop_order: number }[]).map((p) => p.stop_order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    expect(res.body.drop_off_points[0].stop_name).toBeDefined();
  });

  it('returns 404 for unknown trip', async () => {
    const res = await ctx.agent
      .get('/api/trips/d2000000-0000-4000-8000-000000000099/options')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/trips/:trip_id/passengers', () => {
  let ctx: TestContext;
  let driverToken: string;
  let otherDriverToken: string;
  let passengerToken: string;
  let tripId: string;

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
        phone: '+962795001103',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    otherDriverToken = generateAccessToken({ id: OTHER_DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() - 10 * 60 * 1000),
        totalSeats: 3,
        availableSeats: 1,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status: 'in_progress',
      },
    });
    tripId = trip.id;
    await ctx.prisma.tripSeat.createMany({
      data: [
        { tripId: trip.id, seatNumber: 1, seatType: 'driver', wasAvailable: false },
        { tripId: trip.id, seatNumber: 2, seatType: 'unavailable', wasAvailable: false },
        { tripId: trip.id, seatNumber: 3, seatType: 'available', wasAvailable: true },
      ],
    });
  });

  async function seedBooking(status: string, overrides: Record<string, unknown> = {}): Promise<{ id: string }> {
    return ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        status: status as 'confirmed' | 'cancelled',
        paymentStatus: status === 'confirmed' ? 'pending' : null,
        referenceCode: `MSR-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
        ...(status === 'cancelled'
          ? { cancellationReason: 'cancelled_by_passenger', cancelledAt: new Date() }
          : {}),
        ...overrides,
      },
    });
  }

  it('lists confirmed passengers with embedded profile', async () => {
    await seedBooking('confirmed');

    const res = await ctx.agent
      .get(`/api/trips/${tripId}/passengers`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(tripId);
    expect(res.body.route).toBe('Amman - Irbid');
    expect(res.body.passengers.length).toBe(1);
    const row = res.body.passengers[0] as Record<string, unknown>;
    expect(row.booking_id).toBeTruthy();
    const passenger = row.passenger as Record<string, unknown>;
    expect(passenger.id).toBe(PASSENGER_ID);
    expect(passenger.full_name).toBe('Reads Passenger');
    expect(passenger.profile_picture_url).toBe('https://cdn.example.test/avatar.png');
    expect(passenger.rating).toBe(4.5);
    expect(row.seats_booked).toBe(1);
    expect(row.seat_numbers).toEqual([2]);
    expect(row.booking_status).toBe('confirmed');
  });

  it('excludes cancelled by default and filters explicitly', async () => {
    await seedBooking('confirmed');
    await seedBooking('cancelled', { seatNumber: null });

    const def = await ctx.agent
      .get(`/api/trips/${tripId}/passengers`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(def.status).toBe(200);
    expect(def.body.passengers.length).toBe(1);
    expect((def.body.passengers[0] as Record<string, unknown>).booking_status).toBe('confirmed');

    const cancelled = await ctx.agent
      .get(`/api/trips/${tripId}/passengers?status=cancelled`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.passengers.length).toBe(1);
    expect((cancelled.body.passengers[0] as Record<string, unknown>).booking_status).toBe('cancelled');
  });

  it('rejects non-owner driver and passenger roles', async () => {
    expect(
      (
        await ctx.agent
          .get(`/api/trips/${tripId}/passengers`)
          .set('Authorization', `Bearer ${otherDriverToken}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .get(`/api/trips/${tripId}/passengers`)
          .set('Authorization', `Bearer ${passengerToken}`)
      ).status,
    ).toBe(403);
  });

  it('validates trip id and status filter', async () => {
    expect(
      (await ctx.agent.get('/api/trips/550e8400-e29b-41d4-a716-446655440099/passengers').set('Authorization', `Bearer ${driverToken}`)).status,
    ).toBe(404);
    expect(
      (await ctx.agent.get('/api/trips/not-a-uuid/passengers').set('Authorization', `Bearer ${driverToken}`)).status,
    ).toBe(422);
    expect(
      (
        await ctx.agent
          .get(`/api/trips/${tripId}/passengers?status=bogus`)
          .set('Authorization', `Bearer ${driverToken}`)
      ).status,
    ).toBe(422);
  });
});
