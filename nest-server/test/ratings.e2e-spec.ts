// 1:1 port of Main Server/tests/integration/ratings.test.js and
// tests/contract/ratings.contract.test.js (Wave 1.3, full-stack Wave 8).
// Trips are created via POST /api/trips + seat-lock + POST /api/bookings like
// the other specs (sos, trip-lifecycle); each booking gets a distinct
// departure day so the 2h overlap guard never fires across tests.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const OUTSIDER_ID = '550e8400-e29b-41d4-a716-446655440098';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

let tripSeq = 0;

async function createBooking(
  ctx: TestContext,
  driverToken: string,
  passengerToken: string,
): Promise<{ id: string }> {
  const daysAhead = 5 + tripSeq++;
  const tripRes = await ctx.agent
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${getFutureDate(daysAhead)}T14:00:00+03:00`,
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

  const lock = await ctx.agent
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${passengerToken}`)
    .send({ seat_number: 2 });
  expect(lock.status).toBe(200);

  const bookingRes = await ctx.agent
    .post('/api/bookings')
    .set('Authorization', `Bearer ${passengerToken}`)
    .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '15.50' });
  expect(bookingRes.status).toBe(201);
  return { id: bookingRes.body.booking.id as string };
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('lets passenger rate driver and recompute avg_rating', async () => {
    const booking = await createBooking(ctx, driverToken, passengerToken);

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
    const booking = await createBooking(ctx, driverToken, passengerToken);

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
    const booking = await createBooking(ctx, driverToken, passengerToken);

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
    const booking = await createBooking(ctx, driverToken, passengerToken);
    const res = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: booking.id, stars: 4, late_minutes: -1 });
    expect(res.status).toBe(422);
  });

  it('rejects stars out of range with 422', async () => {
    const booking = await createBooking(ctx, driverToken, passengerToken);
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
    const booking = await createBooking(ctx, driverToken, passengerToken);
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
    const booking = await createBooking(ctx, driverToken, passengerToken);
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
    const booking = await createBooking(ctx, driverToken, passengerToken);
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
    const booking = await createBooking(ctx, driverToken, passengerToken);
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
