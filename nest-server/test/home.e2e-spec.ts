// 1:1 port of Main Server/tests/integration/homeScreen.test.js,
// integration/passengerHome.test.js, contract/homeScreen + home (Wave 4.2).
// Trip/booking fixtures use direct Prisma rows (POST /api/trips + seat-lock
// + POST /api/bookings arrive with Wave 5); payload assertions are identical.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { jordanStartOfToday } from '../src/common/utils/jordan-time.js';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'e5100000-0000-4000-8000-000000000051';
const DRIVER2_ID = 'e5100000-0000-4000-8000-000000000052';
const PASSENGER_ID = 'e5100000-0000-4000-8000-000000000053';
const VEHICLE_ID = 'e5100000-0000-4000-8000-000000000060';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

function future(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

describe('GET /api/driver/home', () => {
  let ctx: TestContext;
  let driverToken: string;

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
        fullName: 'Driver 51',
        phone: '+962795511101',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 4.5,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER2_ID,
        fullName: 'Driver 52',
        phone: '+962795511102',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Passenger One',
        phone: '+962795511103',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, totalTrips: 10 } });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Hyundai',
        model: 'Elantra',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: 'HM-51',
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
        planName: 'Basic',
        planPeriodDays: 30,
        planPercentageCut: 8,
        planCost: 100,
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

  async function createTrip(
    departure: Date,
    status = 'published',
    driverId = DRIVER_ID,
    vehicleId = VEHICLE_ID,
  ): Promise<{ id: string }> {
    return ctx.prisma.trip.create({
      data: {
        driverId,
        vehicleId,
        originCity: 'Amman',
        originArea: 'Abdoun',
        destinationCity: 'Irbid',
        destinationArea: 'Downtown',
        departureTime: departure,
        totalSeats: 4,
        availableSeats: 1,
        farePerSeat: 5,
        status: status as 'published' | 'completed',
      },
    });
  }

  async function addBooking(
    tripId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<{ id: string }> {
    return ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        status: 'confirmed',
        referenceCode: makeRef(),
        ...overrides,
      },
    });
  }

  it('returns full payload with can_start true', async () => {
    const trip = await createTrip(future(30));
    const booking = await addBooking(trip.id);

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver.full_name).toBe('Driver 51');
    expect(res.body.driver.rating).toBe(4.5);
    expect(res.body.driver.total_trips_completed).toBe(10);
    expect(res.body.driver.gender).toBe('male');
    expect(res.body.driver.vehicle_seats_number).toBe(4);
    expect(res.body.subscription.tier).toBe('basic');
    expect(res.body.subscription.price).toBe(100);
    expect(res.body.subscription.days_remaining).toBeGreaterThan(0);
    expect(res.body.subscription.free_trips).toBeNull();
    expect(res.body.next_trip.trip_id).toBe(trip.id);
    expect(res.body.next_trip.can_start).toBe(true);
    expect(res.body.next_trip.passengers).toEqual([
      expect.objectContaining({
        booking_id: booking.id,
        passenger_id: PASSENGER_ID,
        passenger_name: 'Passenger One',
        passenger_phone: '+962795511103',
        seats_booked: 1,
        seat_numbers: [2],
        agreed_fare: 5,
        status: 'confirmed',
        pickup: expect.objectContaining({ status: 'pending' }),
        created_at: expect.any(String),
      }),
    ]);
    expect(res.body.next_trip.booked_seats_count).toBe(1);
    expect(res.body.summary.reserved_seats_for_next_trip).toBe(1);
    expect(res.body.recent_bookings.length).toBe(1);
    expect(res.body.recent_bookings[0].seat_numbers).toEqual([2]);
  });

  it('includes all next-trip details (locations, stops, route, instructions and pickup)', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        originArea: 'Abdoun',
        originAddress: '13 Abdoun St',
        originLat: 31.95,
        originLng: 35.87,
        destinationCity: 'Irbid',
        destinationArea: 'Downtown',
        destinationAddress: '1 University St',
        destinationLat: 32.55,
        destinationLng: 35.85,
        departureTime: future(90),
        arrivalTime: future(180),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 5,
        currency: 'JOD',
        genderPreference: 'all',
        driverInstructions: ['no smoking'],
        additionalInstructions: 'Be on time',
        routePolyline: 'encoded-polyline',
        routeDistanceM: 80000,
        routeDurationS: 5400,
        routeStatus: 'ready',
        routeVersion: 3,
        routeComputedAt: new Date(),
      },
    });
    await ctx.prisma.tripStop.createMany({
      data: [
        { tripId: trip.id, stopOrder: 1, stopName: 'Sweileh', city: 'Amman', lat: 31.96, lng: 35.88, stopType: 'pickup' },
        { tripId: trip.id, stopOrder: 2, stopName: 'Jerash', city: 'Jerash', lat: 32.28, lng: 35.9, stopType: 'dropoff' },
      ],
    });
    await ctx.prisma.tripAttribute.createMany({
      data: [
        { tripId: trip.id, attrKey: 'wifi', attrValue: 'true' },
        { tripId: trip.id, attrKey: 'music', attrValue: 'false' },
      ],
    });
    const booking = await addBooking(trip.id, {
      pickupType: 'custom',
      pickupPlace: 'Sweileh circle',
      pickupLabel: 'Sweileh',
      pickupCity: 'Amman',
      pickupArea: 'Sweileh',
      pickupLat: 31.96,
      pickupLng: 35.88,
      pickupOrder: 1,
      pickupStatus: 'pending',
      detourSeconds: 120,
    });

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    const next = res.body.next_trip;
    expect(next.trip_id).toBe(trip.id);
    expect(next.origin_address).toBe('13 Abdoun St');
    expect(next.origin_lat).toBe(31.95);
    expect(next.origin_lng).toBe(35.87);
    expect(next.destination_address).toBe('1 University St');
    expect(next.destination_lat).toBe(32.55);
    expect(next.destination_lng).toBe(35.85);
    expect(next.arrival_time).toBeTruthy();
    expect(next.is_recurring).toBe(false);
    expect(next.gender_preference).toBe('all');
    expect(next.attributes).toEqual(
      expect.arrayContaining([
        { key: 'wifi', value: true },
        { key: 'music', value: false },
      ]),
    );
    expect(next.stops).toHaveLength(2);
    expect(next.stops[0]).toMatchObject({
      stop_order: 1,
      stop_name: 'Sweileh',
      city: 'Amman',
      lat: 31.96,
      lng: 35.88,
      stop_type: 'pickup',
    });
    expect(next.waypoints[0]).toEqual({ stop_name: 'Sweileh', stop_lat: 31.96, stop_lng: 35.88 });
    expect(next.instructions).toEqual(['no smoking']);
    expect(next.additional_instructions).toBe('Be on time');
    expect(next.created_at).toBeTruthy();
    expect(next.route).toMatchObject({
      status: 'ready',
      version: 3,
      polyline: 'encoded-polyline',
      distance_m: 80000,
      duration_s: 5400,
    });
    expect(next.vehicle).toMatchObject({
      vehicle_id: VEHICLE_ID,
      vehicle_type: 'sedan',
      make_model: 'Hyundai Elantra',
    });
    expect(next.passengers[0]).toMatchObject({
      booking_id: booking.id,
      passenger_id: PASSENGER_ID,
      passenger_phone: '+962795511103',
      agreed_fare: 5,
      status: 'confirmed',
      pickup: {
        type: 'custom',
        place: 'Sweileh circle',
        label: 'Sweileh',
        city: 'Amman',
        area: 'Sweileh',
        lat: 31.96,
        lng: 35.88,
        order: 1,
        status: 'pending',
        detour_seconds: 120,
      },
    });
  });

  it('returns can_start false when more than an hour away', async () => {
    const trip = await createTrip(future(120));

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.next_trip.trip_id).toBe(trip.id);
    expect(res.body.next_trip.can_start).toBe(false);
  });

  it('counts the Jordan today window in summary', async () => {
    const midnightPlus1 = new Date(jordanStartOfToday().getTime() + 1000);
    await createTrip(midnightPlus1, 'completed');
    await createTrip(future(30));

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.completed_trips_today).toBe(1);
    expect(res.body.summary.trips_today).toBe(2);
  });

  it('renders empty seat_numbers for null seat', async () => {
    const trip = await createTrip(future(30));
    await addBooking(trip.id, { seatNumber: null });

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.next_trip.passengers[0].seat_numbers).toEqual([]);
    expect(res.body.recent_bookings[0].seat_numbers).toEqual([]);
  });

  it('picks the earliest upcoming trip and never caches', async () => {
    const later = await createTrip(future(120));

    const first = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(first.body.next_trip.trip_id).toBe(later.id);
    expect(await ctx.redis.exists(`driver_home:${DRIVER_ID}`)).toBe(0);

    const earlier = await createTrip(future(30));
    const second = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(second.body.next_trip.trip_id).toBe(earlier.id);
  });

  it('rejects unverified and suspended drivers with 403', async () => {
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { isVerified: false } });
    const unverified = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(unverified.status).toBe(403);

    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { isVerified: true, status: 'suspended' },
    });
    const suspended = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(suspended.status).toBe(403);
  });

  it('surfaces free-trips counters for trips-offer plans', async () => {
    await ctx.prisma.driverSubscription.deleteMany({ where: { driverId: DRIVER_ID } });
    const starter = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Starter',
        periodDays: 30,
        percentageCut: 0,
        cost: 0,
        features: [],
        isFree: true,
        freeOffer: { type: 'trips', value: 5 },
        isActive: true,
      },
    });
    const now = new Date();
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER_ID,
        planId: starter.id,
        planName: 'Starter',
        planPeriodDays: 30,
        planPercentageCut: 0,
        planCost: 0,
        balance: 0,
        paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
        freeOffer: { type: 'trips', value: 5 },
        freeTripsUsed: 2,
      },
    });

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.tier).toBe('starter');
    expect(res.body.subscription.price).toBe(0);
    expect(res.body.subscription.free_trips).toEqual({ max: 5, used: 2, remaining: 3 });
  });

  it('matches the home contract shape', async () => {
    const trip = await createTrip(future(30));
    const booking = await addBooking(trip.id);

    const res = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.driver.id).toBe('string');
    expect(typeof res.body.driver.full_name).toBe('string');
    expect(typeof res.body.driver.rating).toBe('number');
    expect(typeof res.body.driver.total_trips_completed).toBe('number');
    expect(res.body.driver.gender).toBe('male');
    expect(res.body.driver.vehicle_seats_number).toBe(4);
    expect(typeof res.body.subscription.tier).toBe('string');
    expect(typeof res.body.subscription.price).toBe('number');
    expect(res.body.subscription.currency).toBe('JOD');
    expect(typeof res.body.subscription.days_remaining).toBe('number');
    expect(res.body.next_trip.trip_id).toBe(trip.id);
    expect(typeof res.body.next_trip.origin_city).toBe('string');
    expect(typeof res.body.next_trip.fare_per_seat).toBe('number');
    expect(typeof res.body.next_trip.total_seats).toBe('number');
    expect(typeof res.body.next_trip.available_seats).toBe('number');
    expect(typeof res.body.next_trip.booked_seats_count).toBe('number');
    expect(typeof res.body.next_trip.vehicle.make_model).toBe('string');
    expect(res.body.next_trip.can_start).toBe(true);
    expect(res.body.next_trip.passengers).toHaveLength(1);
    expect(res.body.next_trip.passengers[0].booking_id).toBe(booking.id);
    expect(res.body.next_trip.passengers[0].seat_numbers).toEqual([2]);
    expect(typeof res.body.summary.completed_trips_today).toBe('number');
    expect(res.body.summary.reserved_seats_for_next_trip).toBe(1);
    expect(typeof res.body.summary.trips_today).toBe('number');
    expect(res.body.recent_bookings).toHaveLength(1);
    const recent = res.body.recent_bookings[0] as Record<string, unknown>;
    expect(typeof recent.booking_id).toBe('string');
    expect(typeof (recent.trip as Record<string, unknown>).trip_id).toBe('string');
    expect(recent.passenger_name).toBe('Passenger One');
    expect(recent.seats_booked).toBe(1);
    expect(recent.seat_numbers).toEqual([2]);
    expect(typeof recent.agreed_fare).toBe('number');
    expect(typeof recent.status).toBe('string');
    expect(typeof recent.created_at).toBe('string');
  });

  it('returns free-tier defaults with no subscription', async () => {
    await ctx.prisma.driverSubscription.deleteMany({ where: { driverId: DRIVER_ID } });
    const empty = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(empty.status).toBe(200);
    expect(empty.body.next_trip).toBeNull();
    expect(empty.body.recent_bookings).toEqual([]);
    // Vehicle seat count is available even without an upcoming trip.
    expect(empty.body.driver.vehicle_seats_number).toBe(4);
    expect(empty.body.subscription.tier).toBe('free');
    expect(empty.body.subscription.price).toBe(0);
    expect(empty.body.subscription.currency).toBe('JOD');
    expect(empty.body.subscription.expires_at).toBeNull();
    expect(empty.body.subscription.days_remaining).toBe(0);
    expect(empty.body.subscription.free_trips).toBeNull();
    expect(empty.body.summary.reserved_seats_for_next_trip).toBe(0);
  });

  it('requires auth and driver role', async () => {
    expect((await ctx.agent.get('/api/driver/home')).status).toBe(401);
    const passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    expect(
      (await ctx.agent.get('/api/driver/home').set('Authorization', `Bearer ${passengerToken}`)).status,
    ).toBe(403);
  });
});

describe('GET /api/profile/passenger/home', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let passenger2Token: string;

  const HOME_DRIVER_ID = 'f8000000-0000-4000-8000-000000000001';
  const HOME_PASS1_ID = 'f8000000-0000-4000-8000-000000000002';
  const HOME_PASS2_ID = 'f8000000-0000-4000-8000-000000000003';
  const HOME_VEHICLE_ID = 'f8000000-0000-4000-8000-000000000010';

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
        id: HOME_DRIVER_ID,
        fullName: 'Home Driver',
        phone: '+962795511201',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 4.5,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: HOME_PASS1_ID,
        fullName: 'Home Passenger 1',
        phone: '+962795511202',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
        avatarUrl: 'http://example.com/p.png',
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: HOME_PASS2_ID,
        fullName: 'Home Passenger 2',
        phone: '+962795511203',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: HOME_VEHICLE_ID,
        driverId: HOME_DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'HOM-101',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    passengerToken = generateAccessToken({ id: HOME_PASS1_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: HOME_PASS2_ID, role: 'passenger' });
  });

  async function makeBooking(passengerId: string): Promise<{ id: string; tripId: string }> {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: HOME_DRIVER_ID,
        vehicleId: HOME_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 3600 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        status: 'published',
      },
    });
    const booking = await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId,
        seatNumber: 2,
        seatNumbers: [2],
        seatsBooked: 1,
        agreedFare: 15,
        status: 'confirmed',
        referenceCode: makeRef(),
      },
    });
    return { id: booking.id, tripId: trip.id };
  }

  it('returns empty sections for a fresh passenger', async () => {
    const res = await ctx.agent
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger.id).toBe(HOME_PASS2_ID);
    expect(res.body.next_booking).toBeNull();
    expect(res.body.last_searched_trips).toEqual([]);
    expect(res.body.last_trips).toEqual([]);
  });

  it('returns next booking, searches and profile', async () => {
    const booking = await makeBooking(HOME_PASS1_ID);
    await ctx.prisma.recentSearch.create({
      data: {
        passengerId: HOME_PASS1_ID,
        originCity: 'Amman',
        destinationCity: 'Zarqa',
        searchedOn: new Date(),
      },
    });

    const res = await ctx.agent
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger).toMatchObject({
      id: HOME_PASS1_ID,
      full_name: 'Home Passenger 1',
      profile_picture_url: 'http://example.com/p.png',
    });
    expect(res.body.next_booking.booking_id).toBe(booking.id);
    expect(res.body.next_booking.status).toBe('confirmed');
    expect(res.body.next_booking.trip.origin.city).toBe('Amman');
    expect(res.body.next_booking.driver.full_name).toBe('Home Driver');
    expect(res.body.next_booking.vehicle).toMatchObject({ type: 'sedan', plate: 'HOM-101' });
    expect(res.body.last_searched_trips[0]).toMatchObject({
      origin_city: 'Amman',
      destination_city: 'Zarqa',
    });
    expect(res.body.last_trips).toEqual([]);
  });

  it('includes all next-trip details (locations, stops, route and pickup)', async () => {
    const booking = await makeBooking(HOME_PASS1_ID);
    await ctx.prisma.trip.update({
      where: { id: booking.tripId },
      data: {
        originArea: 'Abdoun',
        originAddress: '13 Abdoun St',
        originLat: 31.95,
        originLng: 35.87,
        destinationArea: 'Downtown',
        destinationAddress: '1 University St',
        destinationLat: 32.55,
        destinationLng: 35.85,
        arrivalTime: new Date(Date.now() + 25 * 3600 * 1000),
        genderPreference: 'all',
        driverInstructions: ['no smoking'],
        additionalInstructions: 'Be on time',
        routePolyline: 'encoded-polyline',
        routeDistanceM: 80000,
        routeDurationS: 5400,
        routeStatus: 'ready',
        routeVersion: 2,
        routeComputedAt: new Date(),
      },
    });
    await ctx.prisma.tripStop.createMany({
      data: [
        { tripId: booking.tripId, stopOrder: 1, stopName: 'Sweileh', city: 'Amman', lat: 31.96, lng: 35.88, stopType: 'pickup' },
      ],
    });
    await ctx.prisma.tripAttribute.createMany({
      data: [{ tripId: booking.tripId, attrKey: 'wifi', attrValue: 'true' }],
    });
    await ctx.prisma.booking.update({
      where: { id: booking.id },
      data: {
        pickupType: 'custom',
        pickupPlace: 'Sweileh circle',
        pickupLabel: 'Sweileh',
        pickupCity: 'Amman',
        pickupArea: 'Sweileh',
        pickupLat: 31.96,
        pickupLng: 35.88,
        pickupOrder: 1,
        pickupStatus: 'pending',
        detourSeconds: 90,
      },
    });

    const res = await ctx.agent
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    const next = res.body.next_booking;
    expect(next.booking_id).toBe(booking.id);
    expect(next.seat_numbers).toEqual([2]);
    expect(next.pickup).toMatchObject({
      type: 'custom',
      place: 'Sweileh circle',
      label: 'Sweileh',
      city: 'Amman',
      area: 'Sweileh',
      lat: 31.96,
      lng: 35.88,
      order: 1,
      status: 'pending',
      detour_seconds: 90,
    });
    expect(next.created_at).toBeTruthy();
    expect(next.driver).toMatchObject({
      id: HOME_DRIVER_ID,
      full_name: 'Home Driver',
      phone: '+962795511201',
    });
    expect(next.vehicle).toMatchObject({
      vehicle_id: HOME_VEHICLE_ID,
      type: 'sedan',
      make_model: 'Toyota Camry',
      year: 2022,
      plate: 'HOM-101',
      color: 'White',
      seats: 4,
      total_seats: 4,
    });
    expect(next.trip.origin).toMatchObject({
      city: 'Amman',
      area: 'Abdoun',
      address: '13 Abdoun St',
    });
    expect(next.trip.origin.lat).toBeCloseTo(31.95, 5);
    expect(next.trip.origin.lng).toBeCloseTo(35.87, 5);
    expect(next.trip.destination).toMatchObject({
      city: 'Irbid',
      area: 'Downtown',
      address: '1 University St',
    });
    expect(next.trip.arrival_time).toBeTruthy();
    expect(next.trip.fare_per_seat).toBe(15);
    expect(next.trip.total_profit).toBe(0);
    expect(next.trip.currency).toBe('JOD');
    expect(next.trip.total_seats).toBe(4);
    expect(next.trip.available_seats).toBe(3);
    expect(next.trip.status).toBe('published');
    expect(next.trip.is_recurring).toBe(false);
    expect(next.trip.gender_preference).toBe('all');
    expect(next.trip.attributes).toEqual([{ key: 'wifi', value: true }]);
    expect(next.trip.stops).toHaveLength(1);
    expect(next.trip.stops[0]).toMatchObject({
      stop_order: 1,
      stop_name: 'Sweileh',
      city: 'Amman',
      lat: 31.96,
      lng: 35.88,
      stop_type: 'pickup',
    });
    expect(next.trip.waypoints[0]).toEqual({ stop_name: 'Sweileh', stop_lat: 31.96, stop_lng: 35.88 });
    expect(next.trip.instructions).toEqual(['no smoking']);
    expect(next.trip.additional_instructions).toBe('Be on time');
    expect(next.trip.created_at).toBeTruthy();
    expect(next.trip.route).toMatchObject({
      status: 'ready',
      version: 2,
      polyline: 'encoded-polyline',
      distance_m: 80000,
      duration_s: 5400,
    });
  });

  it('moves departed bookings to last_trips with full trip details', async () => {
    const booking = await makeBooking(HOME_PASS1_ID);
    await ctx.prisma.trip.update({
      where: { id: booking.tripId },
      data: {
        departureTime: new Date(Date.now() - 3600 * 1000),
        originArea: 'Abdoun',
        originAddress: '13 Abdoun St',
        destinationArea: 'Downtown',
        destinationAddress: '1 University St',
        status: 'completed',
        driverInstructions: ['no smoking'],
        additionalInstructions: 'Be on time',
        routePolyline: 'encoded-polyline',
        routeDistanceM: 80000,
        routeDurationS: 5400,
        routeStatus: 'ready',
        routeVersion: 3,
      },
    });
    await ctx.prisma.tripStop.create({
      data: {
        tripId: booking.tripId,
        stopOrder: 1,
        stopName: 'Sweileh',
        city: 'Amman',
        lat: 31.96,
        lng: 35.88,
        stopType: 'pickup',
      },
    });
    await ctx.prisma.tripAttribute.create({
      data: { tripId: booking.tripId, attrKey: 'wifi', attrValue: 'true' },
    });
    await ctx.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'completed', paymentStatus: 'paid_cash' },
    });

    const res = await ctx.agent
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.next_booking).toBeNull();
    expect(res.body.last_trips).toHaveLength(1);
    const last = res.body.last_trips[0];
    expect(last.booking_id).toBe(booking.id);
    expect(last.trip_cost).toBe(15);
    expect(last.currency).toBe('JOD');
    expect(last.reference_code).toMatch(/^MSR-/);
    expect(last.payment_status).toBe('paid_cash');
    expect(last.seat_numbers).toEqual([2]);
    expect(last.trip.origin).toMatchObject({ city: 'Amman', area: 'Abdoun', address: '13 Abdoun St' });
    expect(last.trip.destination).toMatchObject({
      city: 'Irbid',
      area: 'Downtown',
      address: '1 University St',
    });
    expect(last.trip.fare_per_seat).toBe(15);
    expect(last.trip.total_seats).toBe(4);
    expect(last.trip.available_seats).toBe(3);
    expect(last.trip.status).toBe('completed');
    expect(last.trip.attributes).toEqual([{ key: 'wifi', value: true }]);
    expect(last.trip.stops).toHaveLength(1);
    expect(last.trip.waypoints[0]).toEqual({
      stop_name: 'Sweileh',
      stop_lat: 31.96,
      stop_lng: 35.88,
    });
    expect(last.trip.instructions).toEqual(['no smoking']);
    expect(last.trip.additional_instructions).toBe('Be on time');
    expect(last.trip.route).toMatchObject({
      status: 'ready',
      version: 3,
      polyline: 'encoded-polyline',
      distance_m: 80000,
      duration_s: 5400,
    });
    expect(last.driver).toMatchObject({ id: HOME_DRIVER_ID, full_name: 'Home Driver' });
    expect(last.vehicle).toMatchObject({
      vehicle_id: HOME_VEHICLE_ID,
      type: 'sedan',
      make_model: 'Toyota Camry',
      plate: 'HOM-101',
    });
  });
});
