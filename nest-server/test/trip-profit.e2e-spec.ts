// 1:1 port of Main Server/tests/integration/tripProfitSeatHistory.test.js.
// Covers trip total_profit (fare x sellable seats) on create/detail/driver
// list/update plus seat was_available history across booking. No prior Nest
// spec asserted total_profit or was_available (verified via grep).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'e8000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e8000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e8000000-0000-4000-8000-000000000010';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

const SEATS = [
  { seat_number: 1, type: 'driver' },
  { seat_number: 2, type: 'available' },
  { seat_number: 3, type: 'available' },
  { seat_number: 4, type: 'unavailable' },
];

function tripBody(fare: string, daysAhead = 1, destination = 'Irbid'): Record<string, unknown> {
  return {
    origin_city: 'Amman',
    destination_city: destination,
    departure_time: `${getFutureDate(daysAhead)}T14:00:00+03:00`,
    type_of_trip: 'once',
    fare_per_seat: fare,
    seats: SEATS,
  };
}

describe('trip total profit + seat availability history', () => {
  let ctx: TestContext;
  let driverToken: string;
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
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Profit Driver',
        phone: '+962795559050',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Profit Passenger',
        phone: '+962795559051',
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
        plateNumber: 'PRF-101',
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
        paymentMethod: { name: 'Bank', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
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

    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('15.00'));
    expect(res.status).toBe(201);
    tripId = res.body.trip_id as string;
  });

  it('returns total_profit on trip creation (fare x sellable seats)', async () => {
    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripBody('10.00', 2, 'Zarqa'));
    expect(res.status).toBe(201);
    // 2 sellable seats x 10.00
    expect(res.body.total_profit).toBe(20);
  });

  it('exposes total_profit on trip detail and driver list', async () => {
    const detail = await ctx.agent
      .get(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(detail.status).toBe(200);
    // 2 sellable seats x 15.00
    expect(detail.body.trip.total_profit).toBe(30);

    const list = await ctx.agent
      .get('/api/trips/driver/my-trips')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(list.status).toBe(200);
    const row = (list.body.trips as Record<string, unknown>[]).find((t) => t.trip_id === tripId) as
      | Record<string, unknown>
      | undefined;
    expect(row?.total_profit).toBe(30);
  });

  it('marks driver-designated seats with was_available, kept after booking', async () => {
    const before = await ctx.agent
      .get(`/api/trips/${tripId}/seats`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(before.status).toBe(200);
    const byNumber = Object.fromEntries(
      (before.body.seats as Record<string, unknown>[]).map((s) => [s.seat_number, s]),
    ) as Record<number, Record<string, unknown>>;
    expect(byNumber[2].was_available).toBe(true);
    expect(byNumber[3].was_available).toBe(true);
    expect(byNumber[1].was_available).toBe(false);
    expect(byNumber[4].was_available).toBe(false);

    await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_numbers: [2] });
    const booked = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '15.00' });
    expect(booked.status).toBe(201);

    const after = await ctx.agent
      .get(`/api/trips/${tripId}/seats`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(after.status).toBe(200);
    const taken = (after.body.seats as Record<string, unknown>[]).find(
      (s) => s.seat_number === 2,
    ) as Record<string, unknown>;
    expect(taken.seat_type).toBe('unavailable');
    expect(taken.was_available).toBe(true);
    expect(taken.is_available).toBe(false);
  });

  it('recomputes total_profit when the fare is updated', async () => {
    const res = await ctx.agent
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ fare_per_seat: '20.00' });
    expect(res.status).toBe(200);
    // 2 sellable seats x 20.00
    expect(res.body.trip.total_profit).toBe(40);
  });
});
