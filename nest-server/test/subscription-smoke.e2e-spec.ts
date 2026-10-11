// 1:1 port of Main Server/tests/integration/subscriptionSmoke.test.js (Wave 5.2).
// DEVIATION (verified): Express fails its own file — GET /api/payment-methods
// without auth returns 401, but the test expects 200. The port authenticates.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = 'f0000000-0000-4000-8000-0000000000f1';
const DRIVER_ID = 'f0000000-0000-4000-8000-0000000000f2';
const PASSENGER_ID = 'f0000000-0000-4000-8000-0000000000f3';
const VEHICLE_ID = 'f0000000-0000-4000-8000-0000000000f0';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

describe('End-to-end smoke: plan → subscribe → approve → gate → commission', () => {
  let ctx: TestContext;
  let adminToken: string;
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
        id: ADMIN_ID,
        fullName: 'Smoke Admin',
        phone: '+9627900000f1',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Smoke Driver',
        phone: '+9627900000f2',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Smoke Passenger',
        phone: '+9627900000f3',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: DRIVER_ID, nationalID: 'N9998887' } });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'SMOKE-1',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('walks the full driver subscription flow through the API', async () => {
    const screenshot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: 'smoke-screenshot-hash',
        url: 'https://res.cloudinary.com/x/screenshot.jpg',
        filename: 'smoke-screenshot.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
    });

    const methodRes = await ctx.agent
      .post('/api/admin/payment-methods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bank of Jordan',
        account_number: 'JO94BOJX0000000000',
        type: 'bank_account',
        email: 'payments@boj.com',
      });
    expect(methodRes.status).toBe(201);

    const planRes = await ctx.agent
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Basic',
        period_days: 30,
        percentage_cut: '8.00',
        cost: '100.00',
        status: 'popular',
        features: ['no booking fees'],
        is_free: false,
      });
    expect(planRes.status).toBe(201);
    const plan = planRes.body.plan as { id: string };

    const plansRes = await ctx.agent.get('/api/plans').set('Authorization', `Bearer ${driverToken}`);
    expect(plansRes.status).toBe(200);
    expect(
      (plansRes.body.plans as { id: string; name: string }[]).find((p) => p.id === plan.id)?.name,
    ).toBe('Basic');

    const methodsRes = await ctx.agent
      .get('/api/payment-methods')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(methodsRes.status).toBe(200);
    const method = methodsRes.body.methods[0] as { id: string };

    const submitRes = await ctx.agent
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: plan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.status).toBe('pending_approval');
    const subscriptionId = submitRes.body.subscription_id as string;

    const pendingRes = await ctx.agent
      .get('/api/admin/subscriptions/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.pending).toHaveLength(1);
    expect(pendingRes.body.pending[0].driver.national_id_masked).toBe('****8887');

    const approveRes = await ctx.agent
      .post(`/api/admin/subscriptions/${subscriptionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.balance_added).toBe(100);

    const currentRes = await ctx.agent
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(currentRes.body.subscription.plan.name).toBe('Basic');
    expect(currentRes.body.total_balance).toBe(100);
    expect(currentRes.body.is_in_debt).toBe(false);

    const publishRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: `${getFutureDate(1)}T14:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: 20.0,
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(publishRes.status).toBe(201);
    const tripId = publishRes.body.trip_id as string;

    // Startable departure (within the 1h window).
    await ctx.prisma.trip.update({
      where: { id: tripId },
      data: { departureTime: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const startRes = await ctx.agent
      .post(`/api/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.status).toBe('in_progress');

    await ctx.prisma.booking.create({
      data: {
        tripId,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 20,
        referenceCode: `S${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1e6).toString(36)}`,
        status: 'confirmed',
      },
    });

    const completeRes = await ctx.agent
      .post(`/api/trips/${tripId}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.commission).toBe(1.6);
    expect(completeRes.body.plan_name).toBe('Basic');
    expect(completeRes.body.balance_after).toBe(98.4);
    expect(completeRes.body.is_in_debt).toBe(false);
  });
});
