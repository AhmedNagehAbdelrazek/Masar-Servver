// 1:1 port of Main Server/tests/integration/ratings.test.js and
// tests/contract/ratings.contract.test.js (Wave 1.3). One deliberate deviation:
// trips are created directly via Prisma instead of POST /api/trips (Wave 5),
// since that endpoint is not ported yet. These tests re-run against the full
// stack in Wave 8.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const OUTSIDER_ID = '550e8400-e29b-41d4-a716-446655440098';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

async function createBooking(ctx: TestContext): Promise<{ id: string }> {
  const departure = new Date();
  departure.setDate(departure.getDate() + 5);
  const trip = await ctx.prisma.trip.create({
    data: {
      driverId: DRIVER_ID,
      vehicleId: VEHICLE_ID,
      originCity: 'Amman',
      destinationCity: 'Irbid',
      departureTime: departure,
      totalSeats: 4,
      availableSeats: 3,
      farePerSeat: 15.5,
      status: 'published',
    },
  });
  return ctx.prisma.booking.create({
    data: {
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: 2,
      seatsBooked: 1,
      agreedFare: 15.5,
      status: 'confirmed',
      referenceCode: makeRef(),
    },
  });
}

describe('US3 - Ratings', () => {
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
        fullName: 'Omar Khaled',
        phone: '+962791111111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 0,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Lina Haddad',
        phone: '+962792222222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 0,
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
        plateNumber: 'TEST-123',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('lets passenger rate driver and recompute avg_rating', async () => {
    const booking = await createBooking(ctx);

    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        booking_id: booking.id,
        stars: 5,
        was_late: false,
        review: 'Smooth ride, on time',
        tags: ['punctual', 'clean_car'],
      });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBeDefined();
    expect(res.body.rating.stars).toBe(5);
    expect(res.body.rating.review).toBe('Smooth ride, on time');
    expect(res.body.rating.tags).toEqual(['punctual', 'clean_car']);
    expect(res.body.rating.booking_id).toBe(booking.id);
    expect(res.body.already_rated).toBe(false);

    const driver = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(parseFloat(String(driver?.avgRating ?? 0))).toBe(5);
  });

  it('is idempotent — second rating returns existing with already_rated true', async () => {
    const booking = await createBooking(ctx);

    await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 5 });

    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 1 });

    expect(res.status).toBe(200);
    expect(res.body.already_rated).toBe(true);
    expect(res.body.rating.stars).toBe(5);

    const count = await ctx.prisma.rating.count({ where: { bookingId: booking.id } });
    expect(count).toBe(1);
  });

  it('lets driver rate passenger', async () => {
    const booking = await createBooking(ctx);

    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ booking_id: booking.id, stars: 4 });

    expect(res.status).toBe(200);
    expect(res.body.rating.stars).toBe(4);

    const rating = await ctx.prisma.rating.findFirst({ where: { bookingId: booking.id } });
    expect(rating?.rateeId).toBe(PASSENGER_ID);
    expect(rating?.raterId).toBe(DRIVER_ID);
  });

  it('rejects negative late_minutes with 422', async () => {
    const booking = await createBooking(ctx);
    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 4, late_minutes: -1 });
    expect(res.status).toBe(422);
  });

  it('rejects stars out of range with 422', async () => {
    const booking = await createBooking(ctx);
    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 6 });
    expect(res.status).toBe(422);
  });

  it('returns 404 for unknown booking', async () => {
    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: '550e8400-e29b-41d4-a716-446655440099', stars: 4 });
    expect(res.status).toBe(404);
  });

  it('rejects a third party who is not part of the booking with 403', async () => {
    const booking = await createBooking(ctx);
    await ctx.prisma.user.create({
      data: {
        id: OUTSIDER_ID,
        fullName: 'Outsider',
        phone: '+962799999999',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 0,
      },
    });
    const outsiderToken = generateAccessToken({ id: OUTSIDER_ID, role: 'passenger' });

    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ booking_id: booking.id, stars: 5 });

    expect(res.status).toBe(403);
    const count = await ctx.prisma.rating.count({ where: { bookingId: booking.id } });
    expect(count).toBe(0);
  });

  it('GET /api/driver/ratings lists ratings received with rater_name and pagination', async () => {
    const booking = await createBooking(ctx);
    await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 5 });

    const res = await ctx.agent
      .get('/api/driver/ratings')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].stars).toBe(5);
    expect(res.body.data[0].rater_name).toBe('Lina Haddad');
    expect(res.body.data[0].booking_id).toBe(booking.id);
    expect(res.body.pagination.total).toBe(1);
  });

  it('contract: rating envelope shape', async () => {
    const booking = await createBooking(ctx);
    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 5, was_late: false, late_minutes: 0 });

    expect(res.status).toBe(200);
    expect(res.body.rating.id).toBeDefined();
    expect(res.body.rating.booking_id).toBe(booking.id);
    expect(res.body.rating.stars).toBe(5);
    expect(res.body.rating.was_late).toBe(false);
    expect(res.body.rating.late_minutes).toBe(0);
    expect(res.body.rating.created_at).toBeDefined();
    expect(res.body.already_rated).toBe(false);
  });

  it('contract: GET /api/driver/ratings returns paginated received list', async () => {
    const booking = await createBooking(ctx);
    await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 5 });

    const res = await ctx.agent
      .get('/api/driver/ratings')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].rater_name).toBe('Lina Haddad');
    expect(res.body.data[0].booking_id).toBe(booking.id);
    expect(res.body.pagination.total_pages).toBe(1);
  });
});
