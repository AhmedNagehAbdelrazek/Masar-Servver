// Admin ride-requests: stats/list/detail.
// Figma: 10631:10466, 10632:19244/11486, 10643:10725, 10654:10335/11518, 10673:11331.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
const TRIP_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
const REQUEST_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4c01';
const DONE_REQUEST_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4c02';
const OFFER_ID = '4b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d01';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Admin ride-requests', () => {
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
        departureTime: new Date('2026-10-29T16:30:00Z'),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 12,
        status: 'published',
      },
    });
    await ctx.prisma.rideRequest.create({
      data: {
        id: REQUEST_ID,
        passengerId: PASSENGER_ID,
        originPlace: 'Amman',
        originCity: 'Amman',
        destinationPlace: 'Jerash',
        destinationCity: 'Jerash',
        seatsNeeded: 2,
        attributesPreferred: {
          recurring: true,
          gender: 'male',
          timeFrom: '12:30',
          timeTo: '18:30',
          preferredTime: '16:30',
          slots: [
            { date: '2026-10-28', preferred: true },
            { date: '2026-10-31', preferred: false },
            { date: '2026-11-03', preferred: false },
          ],
        },
        status: 'offered',
        expiresAt: new Date('2026-11-10T00:00:00Z'),
      },
    });
    await ctx.prisma.requestOffer.create({
      data: {
        id: OFFER_ID,
        requestId: REQUEST_ID,
        driverId: DRIVER_ID,
        tripId: TRIP_ID,
        offeredFare: 12,
        status: 'sent',
      },
    });
    await ctx.prisma.rideRequest.create({
      data: {
        id: DONE_REQUEST_ID,
        passengerId: PASSENGER_ID,
        originPlace: 'Amman',
        originCity: 'Amman',
        destinationPlace: 'Irbid',
        destinationCity: 'Irbid',
        seatsNeeded: 1,
        status: 'cancelled',
        note: 'No longer needed',
        expiresAt: new Date('2026-11-10T00:00:00Z'),
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('GET /api/admin/ride-requests/stats returns the cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/ride-requests/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_requests: 2,
      searching: 0,
      matched: 1,
      completed: 0,
      cancelled: 1,
      expired: 0,
    });
  });

  it('GET /api/admin/ride-requests lists with search + status filter', async () => {
    const search = await ctx.agent
      .get('/api/admin/ride-requests?search=Sara')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(search.status).toBe(200);
    expect(search.body.data).toHaveLength(2);
    expect(search.body.pagination).toMatchObject({ total: 2 });

    const cancelled = await ctx.agent
      .get('/api/admin/ride-requests?status=cancelled')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data).toHaveLength(1);
    expect(cancelled.body.data[0]).toMatchObject({ id: DONE_REQUEST_ID });
  });

  it('GET /api/admin/ride-requests/:id returns slots + match + log', async () => {
    const res = await ctx.agent
      .get(`/api/admin/ride-requests/${REQUEST_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.request).toMatchObject({
      id: REQUEST_ID,
      seats_needed: 2,
      recurring: true,
      status: 'offered',
    });
    expect(res.body.slots).toHaveLength(3);
    expect(res.body.match.trip).toMatchObject({ id: TRIP_ID });
    expect(res.body.match.driver).toMatchObject({ fullName: 'Omar Khaled' });
    expect(res.body.passenger).toMatchObject({ fullName: 'Sara Ali' });
    expect(res.body.log.map((e: { event: string }) => e.event)).toContain('matched');

    const cancelled = await ctx.agent
      .get(`/api/admin/ride-requests/${DONE_REQUEST_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.cancellation).toMatchObject({ reason: 'No longer needed' });
    expect(cancelled.body.match).toBeNull();

    const unknown = await ctx.agent
      .get(`/api/admin/ride-requests/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(404);
  });

  it('non-admin role is forbidden', async () => {
    const res = await ctx.agent
      .get('/api/admin/ride-requests/stats')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});
