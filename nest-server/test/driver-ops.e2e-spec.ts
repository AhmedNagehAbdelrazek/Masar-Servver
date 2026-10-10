// 1:1 port of Main Server/tests/integration/penalties.test.js,
// integration/earningsStats.test.js, integration/dashboard.test.js and
// contract/penalties + earningsStats (Wave 3.3).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const DRIVER_PHONE = '+962791111111';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const PASSENGER_PHONE = '+962792222222';
const OTHER_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440003';
const OTHER_DRIVER_PHONE = '+962793333333';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const OTHER_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440011';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

function futureDate(days: number): Date {
  return new Date(Date.now() + days * 24 * 3600 * 1000);
}

async function seedUser(
  ctx: TestContext,
  id: string,
  phone: string,
  role: 'driver' | 'passenger',
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id,
      fullName: role === 'driver' ? 'Test Driver' : 'Test Passenger',
      phone,
      countryCode: 'JO',
      role,
      passwordHash: 'hashed',
      isVerified: true,
      ...overrides,
    },
  });
}

describe('GET /api/driver/penalties', () => {
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
    await seedUser(ctx, DRIVER_ID, DRIVER_PHONE, 'driver', { status: 'suspended' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('lists active and expired penalties with enforcement_state', async () => {
    const now = new Date();
    await ctx.prisma.penalty.create({
      data: {
        userId: DRIVER_ID,
        type: 'suspension',
        reason: 'Two no-show incidents',
        startsAt: new Date(now.getTime() - 2 * 86400000),
        endsAt: futureDate(5),
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
    });
    await ctx.prisma.penalty.create({
      data: {
        userId: DRIVER_ID,
        type: 'warning',
        reason: 'Minor lateness',
        startsAt: new Date(now.getTime() - 30 * 86400000),
        endsAt: null,
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
    });

    const res = await ctx.agent
      .get('/api/driver/penalties')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].type).toBeDefined();
    expect(res.body.data[0].reason).toBeDefined();
    expect(res.body.data[0].starts_at).toBeDefined();
    expect(res.body.data[0].enforcement_state).toBe('suspended');
    expect(res.body.pagination.total).toBe(2);
  });

  it('filters to active penalties only', async () => {
    const now = new Date();
    await ctx.prisma.penalty.create({
      data: {
        userId: DRIVER_ID,
        type: 'suspension',
        reason: 'Active suspension',
        startsAt: new Date(now.getTime() - 2 * 86400000),
        endsAt: futureDate(5),
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
    });
    await ctx.prisma.penalty.create({
      data: {
        userId: DRIVER_ID,
        type: 'warning',
        reason: 'Expired warning',
        startsAt: new Date(now.getTime() - 30 * 86400000),
        endsAt: new Date(now.getTime() - 10 * 86400000),
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
    });

    const res = await ctx.agent
      .get('/api/driver/penalties?active=true')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].reason).toBe('Active suspension');
  });

  it('returns empty list with zero total', async () => {
    const res = await ctx.agent
      .get('/api/driver/penalties')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it('rejects passenger role with 403', async () => {
    await seedUser(ctx, PASSENGER_ID, PASSENGER_PHONE, 'passenger');
    const passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    const res = await ctx.agent
      .get('/api/driver/penalties')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns suspension shape with pagination (contract)', async () => {
    const now = new Date();
    await ctx.prisma.penalty.create({
      data: {
        userId: DRIVER_ID,
        type: 'suspension',
        reason: 'Test',
        startsAt: new Date(now.getTime() - 2 * 86400000),
        endsAt: futureDate(5),
        issuedBy: DRIVER_ID,
      },
    });

    const res = await ctx.agent
      .get('/api/driver/penalties')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].type).toBe('suspension');
    expect(res.body.data[0].enforcement_state).toBe('suspended');
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1, total_pages: 1 });
  });

  it('rejects invalid active filter with 422', async () => {
    const res = await ctx.agent
      .get('/api/driver/penalties?active=maybe')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/driver/earnings + /stats', () => {
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
    await seedUser(ctx, DRIVER_ID, DRIVER_PHONE, 'driver', { avgRating: 4.8 });
    await seedUser(ctx, OTHER_DRIVER_ID, OTHER_DRIVER_PHONE, 'driver', {
      fullName: 'Other Driver',
      avgRating: 3,
    });
    await seedUser(ctx, PASSENGER_ID, PASSENGER_PHONE, 'passenger', { fullName: 'Lina Haddad' });
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
    await ctx.prisma.vehicle.create({
      data: {
        id: OTHER_VEHICLE_ID,
        driverId: OTHER_DRIVER_ID,
        manufacturer: 'Hyundai',
        model: 'Elantra',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'TEST-456',
        color: 'Black',
        seats: 4,
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  async function seedTrip(driverId: string, status: string): Promise<{ id: string }> {
    return ctx.prisma.trip.create({
      data: {
        driverId,
        vehicleId: driverId === DRIVER_ID ? VEHICLE_ID : OTHER_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 3600 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 10,
        status: status as 'completed' | 'cancelled' | 'published',
      },
    });
  }

  async function seedBooking(
    tripId: string,
    status: string,
    fare: number,
    createdAt = new Date(),
  ): Promise<void> {
    await ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: fare,
        status: status as 'completed' | 'cancelled',
        referenceCode: makeRef(),
        createdAt,
      },
    });
  }

  it('returns zeros for a new driver (week)', async () => {
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { avgRating: 0 } });
    const res = await ctx.agent
      .get('/api/driver/earnings?period=week')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.period).toBe('week');
    expect(res.body.currency).toBe('JOD');
    expect(res.body.total).toBe(0);
    expect(res.body.breakdown).toEqual([]);
  });

  it('aggregates own completed trips only (month)', async () => {
    const mine = await seedTrip(DRIVER_ID, 'completed');
    const others = await seedTrip(OTHER_DRIVER_ID, 'completed');
    await seedBooking(mine.id, 'completed', 85);
    await seedBooking(mine.id, 'completed', 85);
    await seedBooking(others.id, 'completed', 999);

    const res = await ctx.agent
      .get('/api/driver/earnings?period=month')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(170);
    expect(res.body.breakdown.length).toBe(1);
    expect(res.body.breakdown[0].earnings).toBe(170);
    expect(res.body.breakdown[0].trips).toBe(1);
  });

  it('excludes non-completed bookings', async () => {
    const mine = await seedTrip(DRIVER_ID, 'completed');
    await seedBooking(mine.id, 'completed', 50);
    await seedBooking(mine.id, 'cancelled', 200);

    const res = await ctx.agent
      .get('/api/driver/earnings?period=month')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(50);
  });

  it('rejects invalid period with 422', async () => {
    const res = await ctx.agent
      .get('/api/driver/earnings?period=year')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns zero stats for a new driver', async () => {
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { avgRating: 0 } });
    const res = await ctx.agent
      .get('/api/driver/stats')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.total_trips).toBe(0);
    expect(res.body.stats.total_bookings).toBe(0);
    expect(res.body.stats.no_show_rate).toBe(0);
    expect(res.body.stats.avg_rating).toBe(0);
    expect(res.body.stats.total_earnings).toBe(0);
  });

  it('reflects trips, bookings and no-show rate', async () => {
    await ctx.prisma.driverProfile.create({
      data: { driverId: DRIVER_ID, responseRate: 98, idVerified: true },
    });
    const completed = await seedTrip(DRIVER_ID, 'completed');
    await seedTrip(DRIVER_ID, 'cancelled');
    await seedTrip(DRIVER_ID, 'published');
    await seedBooking(completed.id, 'completed', 85);
    await ctx.prisma.booking.create({
      data: {
        tripId: completed.id,
        passengerId: PASSENGER_ID,
        seatNumber: 3,
        seatsBooked: 1,
        agreedFare: 85,
        status: 'no_show',
        referenceCode: makeRef(),
      },
    });

    const res = await ctx.agent
      .get('/api/driver/stats')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.total_trips).toBe(3);
    expect(res.body.stats.completed_trips).toBe(1);
    expect(res.body.stats.cancelled_trips).toBe(1);
    expect(res.body.stats.total_bookings).toBe(2);
    expect(res.body.stats.no_show_rate).toBe(50);
    expect(res.body.stats.response_rate).toBe(98);
    expect(res.body.stats.avg_rating).toBe(4.8);
    expect(res.body.stats.total_earnings).toBe(85);
    expect(typeof res.body.stats.completed_trips).toBe('number');
    expect(typeof res.body.stats.cancelled_trips).toBe('number');
  });
});

describe('GET /api/driver/dashboard', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;

  const DASH_DRIVER_ID = '6ba7b810-9dad-41d4-80b4-00c04fd43001';
  const DASH_PASSENGER_ID = '6ba7b810-9dad-41d4-80b4-00c04fd43002';
  const DASH_VEHICLE_ID = '6ba7b810-9dad-41d4-80b4-00c04fd43010';

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
        id: DASH_DRIVER_ID,
        fullName: 'Dashboard Driver',
        phone: '+962793333333',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DASH_PASSENGER_ID,
        fullName: 'Dashboard Passenger',
        phone: '+962794444444',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: DASH_VEHICLE_ID,
        driverId: DASH_DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'DB-123',
        color: 'White',
        seats: 4,
      },
    });
    driverToken = generateAccessToken({ id: DASH_DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: DASH_PASSENGER_ID, role: 'passenger' });
  });

  it('returns dashboard with correct structure', async () => {
    const res = await ctx.agent
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.account).toBeDefined();
    expect(res.body.account.driver_id).toBe(DASH_DRIVER_ID);
    expect(res.body.account.full_name).toBe('Dashboard Driver');
    expect(res.body.account.phone).toBe('+962793333333');
    expect(typeof res.body.account.rating).toBe('number');
    expect(typeof res.body.account.total_trips_completed).toBe('number');
    expect(typeof res.body.account.verified).toBe('boolean');
    expect(res.body.schedule).toBeDefined();
    expect(Array.isArray(res.body.schedule.today)).toBe(true);
    expect(Array.isArray(res.body.schedule.upcoming)).toBe(true);
    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary.today_trips_count).toBe('number');
    expect(typeof res.body.summary.total_completed_trips).toBe('number');
    expect(typeof res.body.summary.monthly_earnings).toBe('number');
    expect(typeof res.body.summary.avg_passenger_rating).toBe('number');
    expect(res.body.reservation_history).toBeDefined();
    expect(Array.isArray(res.body.reservation_history.recent)).toBe(true);
    expect(res.body.reservation_history.pagination).toBeDefined();
  });

  it("includes today's trips in schedule", async () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DASH_DRIVER_ID,
        vehicleId: DASH_VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: today,
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15,
        status: 'published',
      },
    });
    await ctx.prisma.tripSeat.createMany({
      data: [
        { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
        { tripId: trip.id, seatNumber: 2, seatType: 'available' },
        { tripId: trip.id, seatNumber: 3, seatType: 'available' },
        { tripId: trip.id, seatNumber: 4, seatType: 'available' },
      ],
    });

    const res = await ctx.agent
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.schedule.today.length).toBe(1);
    expect(res.body.schedule.today[0].trip_id).toBe(trip.id);
    expect(res.body.summary.today_trips_count).toBe(1);
  });

  it('caches dashboard response', async () => {
    const res1 = await ctx.agent
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res1.status).toBe(200);
    expect(await ctx.redis.exists(`driver_dashboard:${DASH_DRIVER_ID}`)).toBe(1);
  });

  it('rejects without auth token', async () => {
    const res = await ctx.agent.get('/api/driver/dashboard');
    expect(res.status).toBe(401);
  });

  it('rejects passenger role', async () => {
    const res = await ctx.agent
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns empty schedule when no trips', async () => {
    const res = await ctx.agent
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.schedule.today.length).toBe(0);
    expect(res.body.schedule.upcoming.length).toBe(0);
    expect(res.body.summary.today_trips_count).toBe(0);
    expect(res.body.summary.total_completed_trips).toBe(0);
    expect(res.body.summary.monthly_earnings).toBe(0);
  });
});
