// Admin conversations: stats/list/thread/penalties.
// Figma: 10757:13462, 10781:13068, 10785:17149, 10791:31478/31414/31340/30877.
// فتح محادثة (10791:32955) reuses the existing support-ticket rails.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const OUTSIDER_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d83';
const VEHICLE_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
const TRIP_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
const BOOKING_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b01';
const TICKET_ID = '6b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d02';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Admin conversations', () => {
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
    for (const u of [
      { id: ADMIN_ID, fullName: 'Admin', phone: '+962790000001', role: 'admin' as const },
      { id: DRIVER_ID, fullName: 'Omar Khaled', phone: '+962798800001', role: 'driver' as const },
      { id: PASSENGER_ID, fullName: 'Sara Ali', phone: '+962798800002', role: 'passenger' as const },
      { id: OUTSIDER_ID, fullName: 'Stranger', phone: '+962798800003', role: 'passenger' as const },
    ]) {
      await ctx.prisma.user.create({
        data: { ...u, countryCode: 'JO', passwordHash: 'hashed', isVerified: true },
      });
    }
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
        status: 'in_progress',
      },
    });
    await ctx.prisma.booking.create({
      data: {
        id: BOOKING_ID,
        tripId: TRIP_ID,
        passengerId: PASSENGER_ID,
        seatsBooked: 1,
        agreedFare: 12,
        referenceCode: 'BK-4101',
        status: 'confirmed',
      },
    });
    await ctx.prisma.message.create({
      data: { senderId: PASSENGER_ID, bookingId: BOOKING_ID, message: 'Hello, gate pickup?' },
    });
    await ctx.prisma.message.create({
      data: { senderId: DRIVER_ID, bookingId: BOOKING_ID, message: 'Yes, by the main gate.' },
    });
    await ctx.prisma.supportTicket.create({
      data: {
        id: TICKET_ID,
        userId: PASSENGER_ID,
        category: 'trip',
        subject: 'Pickup point question',
        description: 'Need clarification',
        tripId: TRIP_ID,
      },
    });
    await ctx.prisma.message.create({
      data: { senderId: ADMIN_ID, supportTicketId: TICKET_ID, message: 'Hello, how can we help?' },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('GET /api/admin/conversations/stats returns the four cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/conversations/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_conversations: 2,
      trip_conversations: 1,
      admin_conversations: 1,
      active: 2,
    });
  });

  it('GET /api/admin/conversations lists trip + admin families', async () => {
    const trip = await ctx.agent
      .get('/api/admin/conversations?search=Sara')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(trip.status).toBe(200);
    expect(trip.body.data).toHaveLength(1);
    expect(trip.body.data[0]).toMatchObject({
      booking_id: BOOKING_ID,
      trip_status: 'in_progress',
      last_message: 'Yes, by the main gate.',
    });

    const admin = await ctx.agent
      .get('/api/admin/conversations?type=admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(admin.status).toBe(200);
    expect(admin.body.data).toHaveLength(1);
    expect(admin.body.data[0]).toMatchObject({ ticket_id: TICKET_ID });
  });

  it('GET /api/admin/conversations/trip/:id returns thread + parties + actions', async () => {
    const res = await ctx.agent
      .get(`/api/admin/conversations/trip/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.trip).toMatchObject({ id: TRIP_ID, booking_id: BOOKING_ID });
    expect(res.body.driver).toMatchObject({ fullName: 'Omar Khaled' });
    expect(res.body.passenger).toMatchObject({ fullName: 'Sara Ali' });
    expect(res.body.penalty_action).toMatchObject({
      passenger_id: PASSENGER_ID,
      driver_id: DRIVER_ID,
    });
    expect(res.body.thread.data).toHaveLength(2);
    expect(res.body.related_actions).toEqual([]);

    const unknown = await ctx.agent
      .get(`/api/admin/conversations/trip/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(404);
  });

  it('POST penalties targets a party and validates the modal shapes', async () => {
    const outsider = await ctx.agent
      .post(`/api/admin/conversations/trip/${BOOKING_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ target_user_id: OUTSIDER_ID, kind: 'warning', reason: 'misconduct' });
    expect(outsider.status).toBe(403);

    const warn = await ctx.agent
      .post(`/api/admin/conversations/trip/${BOOKING_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ target_user_id: DRIVER_ID, kind: 'warning', reason: 'misconduct' });
    expect(warn.status).toBe(200);
    expect(warn.body.penalty).toMatchObject({ type: 'warning' });

    const noCheck = await ctx.agent
      .post(`/api/admin/conversations/trip/${BOOKING_ID}/penalties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ target_user_id: DRIVER_ID, kind: 'permanent', reason: 'safety' });
    expect([400, 422]).toContain(noCheck.status);

    const thread = await ctx.agent
      .get(`/api/admin/conversations/trip/${BOOKING_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(thread.body.related_actions).toHaveLength(1);
    expect(thread.body.related_actions[0]).toMatchObject({ type: 'warning', user_id: DRIVER_ID });
  });

  it('non-admin role is forbidden', async () => {
    const res = await ctx.agent
      .get('/api/admin/conversations/stats')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});
