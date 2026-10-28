// 1:1 port of Main Server/tests/integration/mapsPickup.test.js and
// contract/maps.contract.test.js (Wave 5.3/5.5). MAPS_MOCK=true (test env),
// so no provider network calls occur.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapsClient } from '../src/modules/maps/maps.client.js';
import { RouteService } from '../src/modules/maps/route.service.js';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'e1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e1300000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e1300000-0000-4000-8000-000000000010';

function dayOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0] as string;
}

describe('Maps pickup flow', () => {
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
        fullName: 'Pickup Driver',
        phone: '+962799141111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Pickup Passenger',
        phone: '+962799142222',
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
        plateNumber: 'PCK-1301',
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

  async function createTrip(): Promise<string> {
    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        origin_lat: 31.9539,
        origin_lng: 35.9106,
        destination_city: 'Irbid',
        destination_lat: 32.5568,
        destination_lng: 35.8469,
        departure_time: `${dayOffset(5)}T14:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '15.50',
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
    tripId: string,
    seat: number,
    extraBody: Record<string, unknown> = {},
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: seat });
    const res = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_numbers: [seat], agreed_fare: '15.50', ...extraBody });
    return { status: res.status, body: res.body as Record<string, unknown> };
  }

  it('publishes ready, books custom pickup, bumps version, notifies driver', async () => {
    const tripId = await createTrip();
    const trip = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(trip?.routeStatus).toBe('ready');
    expect(Number(trip?.routeVersion)).toBeGreaterThanOrEqual(1);

    const res = await lockAndBook(tripId, 2, {
      pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 },
    });
    expect(res.status).toBe(201);

    const booking = await ctx.prisma.booking.findFirst({ where: { tripId } });
    expect(booking?.pickupType).toBe('custom');
    expect(Number(booking?.pickupLat)).toBeCloseTo(32.25, 4);

    const after = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(Number(after?.routeVersion)).toBeGreaterThan(Number(trip?.routeVersion));

    const note = await ctx.prisma.notification.findFirst({
      where: { userId: DRIVER_ID, type: 'PICKUP_ADDED' },
    });
    expect(note).not.toBeNull();
  });

  it('accepts any custom pickup point, adds it to the route, and defaults missing pickup to origin', async () => {
    const tripId = await createTrip();

    const far = await lockAndBook(tripId, 2, { pickup: { name: 'Aqaba', lat: 29.53, lng: 35.01 } });
    expect(far.status).toBe(201);

    const farBooking = await ctx.prisma.booking.findFirst({
      where: { tripId, passengerId: PASSENGER_ID, seatNumber: 2 },
    });
    expect(Number(farBooking?.pickupLat)).toBeCloseTo(29.53, 4);

    const route = await ctx.agent
      .get(`/api/trips/${tripId}/route`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(route.status).toBe(200);
    expect(
      (route.body.pickups as Array<{ lat: number; lng: number }>).some(
        (p) => Math.abs(Number(p.lat) - 29.53) < 0.001 && Math.abs(Number(p.lng) - 35.01) < 0.001,
      ),
    ).toBe(true);

    const def = await lockAndBook(tripId, 3);
    expect(def.status).toBe(201);
    const defaultBooking = await ctx.prisma.booking.findFirst({
      where: { tripId, passengerId: PASSENGER_ID, seatNumber: 3 },
    });
    expect(Number(defaultBooking?.pickupLat)).toBeCloseTo(31.9539, 4);
  });

  it('recovers from provider failure via recompute', async () => {
    const maps = ctx.app.get(MapsClient);
    const spy = vi.spyOn(maps, 'computeRoutes').mockRejectedValueOnce(new Error('boom'));
    const tripId = await createTrip();
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.routeStatus).toBe('failed');

    const routes = ctx.app.get(RouteService);
    const out = await routes.computeTripRoute(tripId);
    expect(out.ok).toBe(true);
    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.routeStatus).toBe('ready');
    spy.mockRestore();
  });

  it('cancelling a booking recomputes and notifies', async () => {
    const tripId = await createTrip();
    const created = await lockAndBook(tripId, 2, {
      pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 },
    });
    const bookingId = (created.body.booking as Record<string, unknown>).id as string;

    const cancelled = await ctx.agent
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});
    expect(cancelled.status).toBe(200);

    expect((await ctx.prisma.trip.findUnique({ where: { id: tripId } }))?.routeStatus).toBe('ready');
    expect(
      await ctx.prisma.notification.findFirst({
        where: { userId: DRIVER_ID, type: 'PICKUP_CANCELLED' },
      }),
    ).not.toBeNull();
  });

  it('replaces stops with recompute, notify and version bump', async () => {
    const tripId = await createTrip();
    await lockAndBook(tripId, 2, {
      pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 },
    });
    const before = await ctx.prisma.trip.findUnique({ where: { id: tripId } });

    const res = await ctx.agent
      .patch(`/api/trips/${tripId}/stops`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ stops: [{ stop_name: 'Jerash', city: 'Jerash', lat: 32.27, lng: 35.89, stop_type: 'both' }] });
    expect(res.status).toBe(200);
    expect(res.body.stops).toBe(1);

    const after = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(Number(after?.routeVersion)).toBeGreaterThan(Number(before?.routeVersion));
    expect(
      await ctx.prisma.notification.findFirst({
        where: { userId: PASSENGER_ID, type: 'ROUTE_UPDATED' },
      }),
    ).not.toBeNull();
  });
});

describe('Contract: maps', () => {
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
        fullName: 'Maps Driver',
        phone: '+962799141111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Maps Passenger',
        phone: '+962799142222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('previews routes with cache flag', async () => {
    const maps = ctx.app.get(MapsClient);
    const callsBefore = maps.fetchCalls.routes;

    const first = await ctx.agent
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin: { lat: 31.9539, lng: 35.9106 },
        destination: { lat: 32.5568, lng: 35.8469 },
        stops: [],
      });
    expect(first.status).toBe(200);
    expect(typeof first.body.polyline).toBe('string');
    expect(first.body.distance_m).toBeGreaterThan(0);
    expect(first.body.duration_s).toBeGreaterThan(0);
    expect(first.body.suggested_arrival).toBeDefined();
    expect(first.body.cached).toBe(false);

    const second = await ctx.agent
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin: { lat: 31.9539, lng: 35.9106 },
        destination: { lat: 32.5568, lng: 35.8469 },
        stops: [],
      });
    expect(second.status).toBe(200);
    expect(second.body.cached).toBe(true);
    expect(maps.fetchCalls.routes).toBe(callsBefore);
  });

  it('rejects preview for passengers and identical points', async () => {
    expect(
      (
        await ctx.agent
          .post('/api/maps/route-preview')
          .set('Authorization', `Bearer ${passengerToken}`)
          .send({ origin: { lat: 31.9539, lng: 35.9106 }, destination: { lat: 32.5568, lng: 35.8469 } })
      ).status,
    ).toBe(403);

    const close = await ctx.agent
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ origin: { lat: 31.9539, lng: 35.9106 }, destination: { lat: 31.954, lng: 35.9107 } });
    expect(close.status).toBe(422);
    expect(close.body.code).toBe('ORIGIN_DESTINATION_TOO_CLOSE');
  });

  it('reverse-geocodes a point', async () => {
    const res = await ctx.agent
      .post('/api/maps/reverse-geocode')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ lat: 31.9539, lng: 35.9106 });
    expect(res.status).toBe(200);
    expect(res.body.label).toBeDefined();
  });

  it('previews pickups near and far', async () => {
    const res = await ctx.agent
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin: { lat: 31.9539, lng: 35.9106 },
        destination: { lat: 32.5568, lng: 35.8469 },
        stops: [],
      });
    expect(res.status).toBe(200);

    // Build a trip through the API so preview has real route geometry.
    await ctx.prisma.vehicle.create({
      data: {
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'MAP-1',
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
    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        origin_lat: 31.9539,
        origin_lng: 35.9106,
        destination_city: 'Irbid',
        destination_lat: 32.5568,
        destination_lng: 35.8469,
        departure_time: `${dayOffset(5)}T14:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '15.50',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(tripRes.status).toBe(201);
    const tripId = tripRes.body.trip_id as string;

    const near = await ctx.agent
      .post(`/api/trips/${tripId}/pickup-preview`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 32.25, lng: 35.8793 });
    expect(near.status).toBe(200);
    expect(near.body.accepted).toBe(true);
    expect(typeof near.body.detour_seconds).toBe('number');

    const far = await ctx.agent
      .post(`/api/trips/${tripId}/pickup-preview`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 31.5, lng: 35.5 });
    expect(far.status).toBe(200);
    expect(far.body.accepted).toBe(false);
    expect(far.body.reason).toBe('PICKUP_TOO_FAR_FROM_ROUTE');
  });
});
