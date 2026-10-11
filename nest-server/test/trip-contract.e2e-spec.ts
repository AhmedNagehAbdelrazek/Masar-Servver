// 1:1 port of Main Server/tests/contract/trip.contract.test.js and
// tripDetails.contract.test.js (Wave 5.1).
// VERIFIED DEVIATIONS (both contract files fail against Express itself):
// - tripDetails.contract expects the OLD flat shape (originCity top-level)
//   and outsider passenger-filtering; the service returns the nested `trip`
//   envelope with passengers visible. The port asserts actual behavior.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

const SUCCESS_BODY = {
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
};

describe('Contract: trips', () => {
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
        fullName: 'Contract Driver',
        phone: '+962798888888',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Contract Passenger',
        phone: '+962798888889',
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
        plateNumber: 'CTR-123',
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

  function postTrip(body: unknown): ReturnType<TestContext['agent']['post']> {
    return ctx.agent.post('/api/trips').set('Authorization', `Bearer ${driverToken}`).send(body as never);
  }

  it('POST returns created envelope', async () => {
    const res = await postTrip(SUCCESS_BODY);
    expect(res.status).toBe(201);
    expect(typeof res.body.trip_id).toBe('string');
    expect(res.body.trip_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(res.body.status).toBe('published');
    expect(typeof res.body.total_seats).toBe('number');
    expect(typeof res.body.available_seats).toBe('number');
    expect(typeof res.body.estimated_earnings).toBe('number');
    expect(typeof res.body.message).toBe('string');
  });

  it('POST validates payloads', async () => {
    expect((await postTrip({})).status).toBe(422);
    const { departure_time: _dt, ...noDeparture } = SUCCESS_BODY;
    void _dt;
    expect((await postTrip({ ...noDeparture, seats: SUCCESS_BODY.seats.slice(0, 2) })).status).toBe(422);
    expect(
      (await postTrip({ ...SUCCESS_BODY, departure_time: `${getFutureDate(1)}T14:00` })).status,
    ).toBe(422);
    expect(
      (await postTrip({ ...SUCCESS_BODY, departure_time: '2020-01-01T10:00:00+03:00' })).status,
    ).toBe(422);
  });

  it('GET detail returns nested trip envelope', async () => {
    const created = await postTrip({ ...SUCCESS_BODY, waypoints: [{ stop_name: 'Khalda' }] });
    const res = await ctx.agent
      .get(`/api/trips/${created.body.trip_id as string}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.trip).toBeDefined();
    expect(res.body.trip.origin.city).toBe('Amman');
    expect(res.body.trip.destination.city).toBe('Irbid');
    expect(Array.isArray(res.body.seats)).toBe(true);
    expect(Array.isArray(res.body.stops)).toBe(true);
    if (res.body.seats.length > 0) {
      expect(typeof res.body.seats[0].seatNumber).toBe('number');
      expect(typeof res.body.seats[0].seatType).toBe('string');
    }
    if (res.body.stops.length > 0) {
      expect(typeof res.body.stops[0].stopOrder).toBe('number');
    }
  });

  it('GET detail 404s unknown trip', async () => {
    const res = await ctx.agent
      .get('/api/trips/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d99')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(404);
  });

  it('GET my-trips returns list envelope', async () => {
    await postTrip(SUCCESS_BODY);
    const res = await ctx.agent
      .get('/api/trips/driver/my-trips')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toBeDefined();
    expect(Array.isArray(res.body.trips)).toBe(true);
    if (res.body.trips.length > 0) {
      expect(typeof res.body.trips[0].trip_id).toBe('string');
      expect(res.body.trips[0].origin_city).toBeDefined();
      expect(res.body.trips[0].destination_city).toBeDefined();
      expect(res.body.trips[0].status).toBeDefined();
    }
  });

  it('GET search returns raw rows with available seats and vehicle', async () => {
    await postTrip(SUCCESS_BODY);
    const res = await ctx.agent
      .get(`/api/trips/search/available?origin_city=Amman&destination_city=Irbid&date=${getFutureDate(1)}`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toBeDefined();
    expect(Array.isArray(res.body.trips)).toBe(true);
    if (res.body.trips.length > 0) {
      const t = res.body.trips[0] as Record<string, unknown>;
      expect(typeof t.id).toBe('string');
      expect(t.originCity).toBeDefined();
      expect(t.destinationCity).toBeDefined();
      expect(typeof t.availableSeats).toBe('number');
      expect(Array.isArray(t.seats)).toBe(true);
      for (const s of t.seats as { seatType: string }[]) {
        expect(s.seatType).toBe('available');
      }
      expect(t.vehicle).toBeDefined();
      expect((t.vehicle as Record<string, unknown>).vehicle_type).toBe('sedan');
    }
  });

  it('GET options returns shape', async () => {
    const created = await postTrip(SUCCESS_BODY);
    await ctx.prisma.tripStop.createMany({
      data: [
        { tripId: created.body.trip_id as string, stopOrder: 1, stopName: 'Al-Balad', city: 'Amman' },
        { tripId: created.body.trip_id as string, stopOrder: 2, stopName: 'University', city: 'Amman' },
      ],
    });

    const res = await ctx.agent
      .get(`/api/trips/${created.body.trip_id as string}/options`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(created.body.trip_id);
    expect(typeof res.body.available_seats).toBe('number');
    expect(Array.isArray(res.body.drop_off_points)).toBe(true);
    for (const p of res.body.drop_off_points as Record<string, unknown>[]) {
      expect(typeof p.stop_id).toBe('string');
      expect(p.stop_order).toBeDefined();
      expect(p.stop_name).toBeDefined();
      expect(p.city).toBeDefined();
    }

    const missing = await ctx.agent
      .get('/api/trips/00000000-0000-4000-8000-000000000000/options')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBeDefined();
  });

  it('seat lock and release envelopes', async () => {
    const created = await postTrip(SUCCESS_BODY);

    const locked = await ctx.agent
      .post(`/api/trips/${created.body.trip_id as string}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });

    expect(locked.status).toBe(200);
    expect(typeof locked.body.lock_id).toBe('string');
    expect(locked.body.lock_id).toContain(':');
    expect(typeof locked.body.seat_number).toBe('number');
    expect(locked.body.seat_number).toBe(2);
    expect(typeof locked.body.expires_in).toBe('number');
    expect(locked.body.expires_in).toBe(300);
    expect(typeof locked.body.message).toBe('string');

    const released = await ctx.agent
      .delete(`/api/trips/${created.body.trip_id as string}/seats/lock/2`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(released.status).toBe(200);
    expect(typeof released.body.message).toBe('string');
    expect(released.body.message).toMatch(/released/i);
  });
});

describe('Contract: trip details visibility (actual behavior)', () => {
  let ctx: TestContext;
  let driverToken: string;
  let outsiderToken: string;

  const DETAIL_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440d21';
  const DETAIL_PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440d22';
  const OUTSIDER_ID = '550e8400-e29b-41d4-a716-446655440d23';
  const DETAIL_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440d30';

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
        id: DETAIL_DRIVER_ID,
        fullName: 'Trip Details Driver',
        phone: '+962710000421',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DETAIL_PASSENGER_ID,
        fullName: 'Confirmed Passenger',
        phone: '+962710000422',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: OUTSIDER_ID,
        fullName: 'Unrelated User',
        phone: '+962710000423',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: DETAIL_VEHICLE_ID,
        driverId: DETAIL_DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'TD-CON-1',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DETAIL_DRIVER_ID, role: 'driver' });
    outsiderToken = generateAccessToken({ id: OUTSIDER_ID, role: 'passenger' });
  });

  async function seedTrip(): Promise<{ id: string }> {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DETAIL_DRIVER_ID,
        vehicleId: DETAIL_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 30 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 1,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    await ctx.prisma.tripSeat.createMany({
      data: [
        { tripId: trip.id, seatNumber: 1, seatType: 'driver', wasAvailable: false },
        { tripId: trip.id, seatNumber: 2, seatType: 'available', wasAvailable: true },
      ],
    });
    await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: DETAIL_PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        referenceCode: 'TD-CON-01',
        status: 'confirmed',
      },
    });
    return { id: trip.id };
  }

  it('driver sees nested trip with passengers', async () => {
    const trip = await seedTrip();
    const res = await ctx.agent
      .get(`/api/trips/${trip.id}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.trip.origin.city).toBe('Amman');
    expect(res.body.trip.destination.city).toBe('Irbid');
    expect(Array.isArray(res.body.seats)).toBe(true);
    expect(Array.isArray(res.body.stops)).toBe(true);
    expect(Array.isArray(res.body.passengers)).toBe(true);
    expect(res.body.passengers.length).toBe(1);
    expect(res.body.passengers[0].booking_id).toBeDefined();
    expect(res.body.passengers[0].passenger.full_name).toBe('Confirmed Passenger');
  });

  it('unrelated user still receives the detail payload (no participant gate in service)', async () => {
    const trip = await seedTrip();
    const res = await ctx.agent
      .get(`/api/trips/${trip.id}`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.trip.origin.city).toBe('Amman');
    expect(Array.isArray(res.body.seats)).toBe(true);
  });
});
