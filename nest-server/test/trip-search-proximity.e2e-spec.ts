// Proximity search e2e (spec 013 P1/P2). The MapsClient mock always returns
// the same Amman -> Irbid corridor, so each test rewrites the trip's
// route_polyline to the geometry it actually needs.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GeoService, type LatLng } from '../src/modules/maps/geo.service.js';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const geo = new GeoService();

const AMMAN: LatLng = [31.9539, 35.9106];
const IRBID: LatLng = [32.5568, 35.8469];
const ZARQA: LatLng = [32.25, 35.8793];
const AQABA: LatLng = [29.532, 35.006];

function jordanDate(daysAhead: number): string {
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

function routeDistance(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += geo.haversineM(points[i - 1] as LatLng, points[i] as LatLng);
  }
  return Math.round(total);
}

describe('Trip search proximity', () => {
  let ctx: TestContext;
  let token: string;
  let passengerToken: string;

  const DRIVER = '550e8400-e29b-41d4-a716-44665555a001';
  const PASSENGER = '550e8400-e29b-41d4-a716-44665555a002';
  const VEHICLE = '550e8400-e29b-41d4-a716-44665555a010';

  let tripAmmanIrbid: string;
  let tripWiden: string;
  let tripReturn: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  async function createTrip(
    date: string,
    time: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const res = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: `${date}T${time}:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'available' },
        ],
        ...body,
      });
    expect(res.status).toBe(201);
    return res.body.trip_id as string;
  }

  async function setRoute(tripId: string, points: LatLng[]): Promise<void> {
    await ctx.prisma.trip.update({
      where: { id: tripId },
      data: {
        routePolyline: geo.encode(points),
        routeStatus: 'ready',
        routeDistanceM: routeDistance(points),
        routeDurationS: 5400,
        routeVersion: { increment: 1 },
      },
    });
  }

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDriver(ctx, DRIVER, '+962795555551', VEHICLE, 'PS-A1');
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER,
        fullName: 'Proximity Passenger',
        phone: '+962795555552',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    token = generateAccessToken({ id: DRIVER, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER, role: 'passenger' });

    const ammanIrbid = [AMMAN, ZARQA, IRBID];
    tripAmmanIrbid = await createTrip(jordanDate(1), '10:00', {
      origin_lat: AMMAN[0],
      origin_lng: AMMAN[1],
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
    });
    await setRoute(tripAmmanIrbid, ammanIrbid);

    // Origin ~2.6 km east of Amman (outside the 2 km default, inside the
    // 5 km widened radius). Destination stays Irbid.
    tripWiden = await createTrip(jordanDate(2), '10:00', {
      origin_city: 'Amman',
      destination_city: 'Irbid',
      origin_lat: AMMAN[0],
      origin_lng: 35.9379,
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
    });
    await setRoute(tripWiden, [[AMMAN[0], 35.9379], IRBID]);

    tripReturn = await createTrip(jordanDate(3), '10:00', {
      origin_city: 'Irbid',
      destination_city: 'Amman',
      origin_lat: IRBID[0],
      origin_lng: IRBID[1],
      destination_lat: AMMAN[0],
      destination_lng: AMMAN[1],
    });
    await setRoute(tripReturn, [IRBID, AMMAN]);

    const far = await createTrip(jordanDate(4), '10:00', {
      origin_city: 'Aqaba',
      destination_city: 'Amman',
      origin_lat: AQABA[0],
      origin_lng: AQABA[1],
      destination_lat: AMMAN[0],
      destination_lng: AMMAN[1],
    });
    await setRoute(far, [AQABA, AMMAN]);
  });

  function search(query: string): ReturnType<TestContext['agent']['get']> {
    return ctx.agent
      .get(`/api/trips/search/available?${query}`)
      .set('Authorization', `Bearer ${passengerToken}`);
  }

  it('matches by coordinates even when the city strings differ', async () => {
    const res = await search(
      `origin_city=Nowhere&destination_city=Nowhere` +
        `&origin_lat=${AMMAN[0]}&origin_lng=${AMMAN[1]}` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&include_enroute=false&date=${jordanDate(1)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].id).toBe(tripAmmanIrbid);
    expect(res.body.trips[0].search_match.origin.kind).toBe('origin');
    expect(res.body.trips[0].search_match.destination.kind).toBe('destination');
    expect(res.body.search.widened).toBe(false);
  });

  it('matches a passenger 10 m from the trip origin', async () => {
    const lat = AMMAN[0] + 10 / 111320;
    const res = await search(
      `origin_lat=${lat}&origin_lng=${AMMAN[1]}` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&include_enroute=false&date=${jordanDate(1)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].search_match.origin.distance_m).toBeLessThanOrEqual(20);
  });

  it('returns nothing for a pickup far from every endpoint', async () => {
    const res = await search(
      `origin_lat=${AQABA[0]}&origin_lng=${AQABA[1]}` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&include_enroute=false&date=${jordanDate(1)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toEqual([]);
    expect(res.body.search.widened).toBe(false);
  });

  it('widens the radius once when the tight search is empty', async () => {
    const res = await search(
      `origin_lat=${AMMAN[0]}&origin_lng=${AMMAN[1]}` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&include_enroute=false&date=${jordanDate(2)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].id).toBe(tripWiden);
    expect(res.body.search.widened).toBe(true);
    expect(res.body.search.origin_radius_m).toBe(5000);
  });

  it('matches a pickup in the route corridor', async () => {
    const res = await search(
      `origin_lat=32.1&origin_lng=35.8886` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&date=${jordanDate(1)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].search_match.origin.kind).toBe('enroute');
  });

  it('allows a short hop on a longer route', async () => {
    const res = await search(
      `origin_lat=32.1&origin_lng=35.8886` +
        `&destination_lat=32.35&destination_lng=35.866` +
        `&date=${jordanDate(1)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].search_match.origin.kind).toBe('enroute');
    expect(res.body.trips[0].search_match.destination.kind).toBe('enroute');
  });

  it('swaps coordinates for returning trips', async () => {
    const res = await search(
      `origin_city=Amman&destination_city=Irbid` +
        `&origin_lat=${AMMAN[0]}&origin_lng=${AMMAN[1]}` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&date=${jordanDate(1)}&return_date=${jordanDate(3)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].id).toBe(tripAmmanIrbid);
    expect(res.body.returning_trips).toHaveLength(1);
    expect(res.body.returning_trips[0].id).toBe(tripReturn);
  });

  it('swaps coordinates for returning trips without city strings', async () => {
    const res = await search(
      `origin_lat=${AMMAN[0]}&origin_lng=${AMMAN[1]}` +
        `&destination_lat=${IRBID[0]}&destination_lng=${IRBID[1]}` +
        `&date=${jordanDate(1)}&return_date=${jordanDate(3)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.returning_trips).toHaveLength(1);
    expect(res.body.returning_trips[0].id).toBe(tripReturn);
  });

  it('keeps the case-insensitive city fallback when no coordinates are sent', async () => {
    const res = await search(
      `origin_city=amman&destination_city=IRBID&date=${jordanDate(1)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.trips.map((t: { id: string }) => t.id)).toContain(tripAmmanIrbid);
  });

  it('rejects a latitude without a longitude', async () => {
    const res = await search(`origin_lat=${AMMAN[0]}&date=${jordanDate(1)}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
