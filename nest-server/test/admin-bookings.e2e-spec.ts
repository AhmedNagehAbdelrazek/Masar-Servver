// Admin bookings: stats/list/detail/cancel.
// Figma: 10558:38631, 10563:40148, 10571:42365, 10613:8891/9448/17653, 10571:41682.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
const TRIP_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
const BOOKING_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b01';
const DONE_BOOKING_ID = '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b02';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Admin bookings', () => {
  let ctx: TestContext;
  let adminToken: string;
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
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962790000001',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Omar Khaled',
        phone: '+962798800001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Sara Ali',
        phone: '+962798800002',
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
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: '12-34567',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    await ctx.prisma.trip.create({
      data: {
        id: TRIP_ID,
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date('2026-11-01T12:00:00Z'),
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 10,
        status: 'published',
      },
    });
    await ctx.prisma.booking.create({
      data: {
        id: BOOKING_ID,
        tripId: TRIP_ID,
        passengerId: PASSENGER_ID,
        seatsBooked: 2,
        agreedFare: 12,
        referenceCode: 'BK-2104',
        status: 'confirmed',
      },
    });
    await ctx.prisma.booking.create({
      data: {
        id: DONE_BOOKING_ID,
        tripId: TRIP_ID,
        passengerId: PASSENGER_ID,
        seatsBooked: 1,
        agreedFare: 10,
        referenceCode: 'BK-2105',
        status: 'cancelled',
        cancellationReason: 'cancelled_by_passenger',
        cancelledBy: PASSENGER_ID,
        cancelledAt: new Date('2026-10-20T10:00:00Z'),
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('GET /api/admin/bookings/stats returns the five cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/bookings/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_bookings: 2,
      upcoming: 1,
      in_progress: 0,
      completed: 0,
      cancelled: 1,
    });
  });

  it('GET /api/admin/bookings lists with search + status filter', async () => {
    const search = await ctx.agent
      .get('/api/admin/bookings?search=BK-2104')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(search.status).toBe(200);
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0]).toMatchObject({ booking_no: 'BK-2104', status: 'confirmed' });

    const cancelled = await ctx.agent
      .get('/api/admin/bookings?status=cancelled')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data).toHaveLength(1);
    expect(cancelled.body.data[0]).toMatchObject({ booking_no: 'BK-2105' });
  });

  it('GET /api/admin/bookings/:id returns detail with timeline + trip + parties', async () => {
    const res = await ctx.agent
      .get(`/api/admin/bookings/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.booking).toMatchObject({ booking_no: 'BK-2104', status: 'confirmed' });
    expect(res.body.booking.total_price).toBe(24);
    expect(res.body.trip).toMatchObject({ origin_city: 'Amman', destination_city: 'Irbid' });
    expect(res.body.driver).toMatchObject({ fullName: 'Omar Khaled' });
    expect(res.body.passenger).toMatchObject({ fullName: 'Sara Ali' });
    expect(res.body.passenger_activity).toMatchObject({ total_bookings: 2, cancelled: 1 });
    expect(res.body.timeline.map((e: { event: string }) => e.event)).toContain('created');

    const unknown = await ctx.agent
      .get(`/api/admin/bookings/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(404);
  });

  it('POST /api/admin/bookings/:id/cancel releases seats and notifies', async () => {
    const res = await ctx.agent
      .post(`/api/admin/bookings/${BOOKING_ID}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'policy_violation', notes: 'overbooked stop' });
    expect(res.status).toBe(200);
    expect(res.body.booking).toMatchObject({
      status: 'cancelled',
      cancelled_by: ADMIN_ID,
    });
    expect(res.body.booking.cancellation_reason).toContain('policy_violation');

    const trip = await ctx.prisma.trip.findUnique({ where: { id: TRIP_ID } });
    expect(Number(trip?.availableSeats)).toBe(4);

    const notice = await ctx.prisma.notification.findFirst({
      where: { userId: PASSENGER_ID, type: 'BOOKING_CANCELLED' },
    });
    expect(notice).not.toBeNull();
  });

  it('POST cancel rejects already-cancelled bookings and bad reasons', async () => {
    const done = await ctx.agent
      .post(`/api/admin/bookings/${DONE_BOOKING_ID}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'other' });
    expect(done.status).toBe(409);

    const bad = await ctx.agent
      .post(`/api/admin/bookings/${BOOKING_ID}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'bogus' });
    expect([400, 422]).toContain(bad.status);
  });

  it('non-admin role is forbidden', async () => {
    const res = await ctx.agent
      .get('/api/admin/bookings/stats')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});
