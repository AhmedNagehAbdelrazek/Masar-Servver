// Admin complaint dossier: stats/list/detail/penalties.
// Figma: 10678:13079, 10681:11590/19490, 10683:11753/11689/11615,
// 10698:23006, 10699:24545/25044.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
const TRIP_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
const BOOKING_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b01';
const COMPLAINT_ID = '5b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4c01';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Admin complaint dossier', () => {
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
        avgRating: 4.8,
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
        departureTime: new Date('2026-10-28T16:30:00Z'),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 12,
        status: 'completed',
      },
    });
    await ctx.prisma.booking.create({
      data: {
        id: BOOKING_ID,
        tripId: TRIP_ID,
        passengerId: PASSENGER_ID,
        seatsBooked: 1,
        agreedFare: 12,
        referenceCode: 'BK-3101',
        status: 'completed',
      },
    });
    await ctx.prisma.complaint.create({
      data: {
        id: COMPLAINT_ID,
        bookingId: BOOKING_ID,
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'lateness',
        description: 'Driver missed the pickup point',
        evidenceUrls: [],
        status: 'reviewing',
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('GET /api/admin/complaints/stats returns the five cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/complaints/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_complaints: 1,
      open: 0,
      reviewing: 1,
      resolved: 0,
      dismissed: 0,
    });
  });

  it('GET /api/admin/complaints lists with search + roles + trip link', async () => {
    const res = await ctx.agent
      .get('/api/admin/complaints?search=Sara')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: COMPLAINT_ID,
      reporter_role: 'passenger',
      accused_role: 'driver',
      trip_id: TRIP_ID,
    });
  });

  it('GET /api/admin/complaints/:id returns the dossier', async () => {
    const res = await ctx.agent
      .get(`/api/admin/complaints/${COMPLAINT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.complaint).toMatchObject({ id: COMPLAINT_ID, status: 'reviewing' });
    expect(res.body.reporter).toMatchObject({ fullName: 'Sara Ali' });
    expect(res.body.accused).toMatchObject({ fullName: 'Omar Khaled', ratings_count: 0 });
    expect(res.body.trip).toMatchObject({ id: TRIP_ID, status: 'completed' });
    expect(res.body.penalty_action).toMatchObject({ accused_id: DRIVER_ID });
    expect(res.body.review_result).toBeNull();
    expect(res.body.log.map((e: { event: string }) => e.event)).toEqual(
      expect.arrayContaining(['filed', 'reviewing']),
    );

    const unknown = await ctx.agent
      .get(`/api/admin/complaints/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(404);
  });

  it('POST penalties issues warning/temp/ban against the accused', async () => {
    const warn = await ctx.agent
      .post(`/api/admin/complaints/${COMPLAINT_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kind: 'warning', reason: 'lateness' });
    expect(warn.status).toBe(200);
    expect(warn.body.penalty).toMatchObject({ type: 'warning' });

    const temp = await ctx.agent
      .post(`/api/admin/complaints/${COMPLAINT_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kind: 'temporary', reason: 'misconduct', duration: '1d' });
    expect(temp.status).toBe(200);
    expect(temp.body.penalty).toMatchObject({ type: 'suspension' });

    const noDays = await ctx.agent
      .post(`/api/admin/complaints/${COMPLAINT_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kind: 'temporary', reason: 'misconduct', duration: 'custom' });
    expect([400, 422]).toContain(noDays.status);

    const noCheck = await ctx.agent
      .post(`/api/admin/complaints/${COMPLAINT_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kind: 'permanent', reason: 'safety', confirmReviewedLog: false });
    expect([400, 422]).toContain(noCheck.status);

    const ban = await ctx.agent
      .post(`/api/admin/complaints/${COMPLAINT_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kind: 'permanent', reason: 'safety', confirmReviewedLog: true });
    expect(ban.status).toBe(200);
    expect(ban.body.penalty).toMatchObject({ type: 'ban' });

    const linked = await ctx.prisma.penalty.findMany({ where: { complaintId: COMPLAINT_ID } });
    expect(linked).toHaveLength(3);
  });

  it('resolve shows the review result with the action taken', async () => {
    await ctx.agent
      .post(`/api/admin/complaints/${COMPLAINT_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kind: 'warning', reason: 'lateness' });

    const resolve = await ctx.agent
      .put(`/api/admin/complaints/${COMPLAINT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved', resolution: 'Warned the driver' });
    expect(resolve.status).toBe(200);

    const detail = await ctx.agent
      .get(`/api/admin/complaints/${COMPLAINT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.review_result.action).toMatchObject({ type: 'warning' });
    expect(detail.body.review_result.reviewed_by).toMatchObject({ id: ADMIN_ID });
  });

  it('non-admin role is forbidden', async () => {
    const res = await ctx.agent
      .get('/api/admin/complaints/stats')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});
