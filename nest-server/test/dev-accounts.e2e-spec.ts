import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';
import {
  DEV_ACCOUNT_PASSWORD,
  DEV_DRIVER_PHONE,
  DEV_PASSENGER_PHONE,
} from '../src/config/dev-accounts.js';

const ADMIN_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const DRIVER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae8';
const PASSENGER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae9';
const OTHER_ID = '7c9e6679-7425-40de-944b-e07fc1f90aea';
const VEHICLE_ID = '7c9e6679-7425-40de-944b-e07fc1f90aeb';
const TRIP_ID = '7c9e6679-7425-40de-944b-e07fc1f90aec';
const BOOKING_ID = '7c9e6679-7425-40de-944b-e07fc1f90aed';
const RATING_ID = '7c9e6679-7425-40de-944b-e07fc1f90aee';
const MESSAGE_ID = '7c9e6679-7425-40de-944b-e07fc1f90aef';
const NOTIFICATION_ID = '7c9e6679-7425-40de-944b-e07fc1f90af0';

describe('Developer accounts', () => {
  let ctx: TestContext;
  let adminToken: string;
  let otherToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const passwordHash = await bcrypt.hash(DEV_ACCOUNT_PASSWORD, 4);

    await ctx.prisma.user.create({
      data: {
        id: ADMIN_ID,
        fullName: 'Admin',
        phone: '+962799900001',
        countryCode: 'JO',
        role: 'admin',
        passwordHash,
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Developer Driver',
        phone: DEV_DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash,
        isVerified: true,
        verificationStatus: 'approved',
        status: 'active',
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Developer Passenger',
        phone: DEV_PASSENGER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash,
        isVerified: true,
        status: 'active',
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: OTHER_ID,
        fullName: 'Regular Passenger',
        phone: '+962799900002',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash,
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
        modelYear: 2024,
        plateNumber: 'DEV-0001',
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
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 10,
        status: 'published',
      },
    });
    await ctx.prisma.booking.create({
      data: {
        id: BOOKING_ID,
        tripId: TRIP_ID,
        passengerId: OTHER_ID,
        seatsBooked: 1,
        agreedFare: 10,
        referenceCode: 'DEVBOOK001',
        status: 'confirmed',
        paymentStatus: 'pending',
      },
    });
    await ctx.prisma.rating.create({
      data: {
        id: RATING_ID,
        bookingId: BOOKING_ID,
        raterId: OTHER_ID,
        rateeId: DRIVER_ID,
        stars: 5,
      },
    });
    await ctx.prisma.message.create({
      data: {
        id: MESSAGE_ID,
        senderId: DRIVER_ID,
        receiverId: OTHER_ID,
        bookingId: BOOKING_ID,
        message: 'See you at the pickup point.',
        messageType: 'text',
        isRead: false,
      },
    });
    await ctx.prisma.notification.create({
      data: {
        id: NOTIFICATION_ID,
        userId: DRIVER_ID,
        type: 'TRIP_REMINDER',
        title: 'Trip reminder',
        body: 'Your trip departs soon.',
      },
    });

    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });
  });

  it('uses the fixed OTP for both developer phones', async () => {
    for (const phone of [DEV_DRIVER_PHONE, DEV_PASSENGER_PHONE]) {
      const sent = await ctx.agent.post('/api/auth/forgot-password').send({ phone });
      expect(sent.status).toBe(200);
      expect(await ctx.redis.get(`otp_reset:${phone}`)).toBe('000000');

      const verified = await ctx.agent
        .post('/api/auth/forgot-password/verify-otp')
        .send({ phone, otp: '000000' });
      expect(verified.status).toBe(200);
      expect(verified.body.reset_token).toBeDefined();
    }
  });

  it('logs in with the known password for both roles', async () => {
    const driverLogin = await ctx.agent.post('/api/auth/login').send({
      phone: DEV_DRIVER_PHONE,
      password: DEV_ACCOUNT_PASSWORD,
      role: 'driver',
    });
    expect(driverLogin.status).toBe(200);
    expect(driverLogin.body.user.role).toBe('driver');

    const passengerLogin = await ctx.agent.post('/api/auth/login').send({
      phone: DEV_PASSENGER_PHONE,
      password: DEV_ACCOUNT_PASSWORD,
      role: 'passenger',
    });
    expect(passengerLogin.status).toBe(200);
    expect(passengerLogin.body.user.role).toBe('passenger');
  });

  it('lets an admin permanently delete a developer driver and all history', async () => {
    const res = await ctx.agent
      .delete(`/api/admin/users/${DRIVER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
    expect(res.body.user).toMatchObject({ id: DRIVER_ID, phone: DEV_DRIVER_PHONE });
    expect(res.body.deleted_records.users).toBe(1);
    expect(res.body.deleted_records.trips).toBe(1);
    expect(res.body.deleted_records.bookings).toBe(1);
    expect(res.body.deleted_records.vehicles).toBe(1);

    expect(await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } })).toBeNull();
    expect(await ctx.prisma.vehicle.findUnique({ where: { id: VEHICLE_ID } })).toBeNull();
    expect(await ctx.prisma.trip.findUnique({ where: { id: TRIP_ID } })).toBeNull();
    expect(await ctx.prisma.booking.findUnique({ where: { id: BOOKING_ID } })).toBeNull();
    expect(await ctx.prisma.rating.findUnique({ where: { id: RATING_ID } })).toBeNull();
    expect(await ctx.prisma.message.findUnique({ where: { id: MESSAGE_ID } })).toBeNull();
    expect(
      await ctx.prisma.notification.findUnique({ where: { id: NOTIFICATION_ID } }),
    ).toBeNull();

    // The regular passenger is not part of the developer account and remains.
    expect(await ctx.prisma.user.findUnique({ where: { id: OTHER_ID } })).not.toBeNull();
  });

  it('rejects deletion of a non-developer account', async () => {
    const res = await ctx.agent
      .delete(`/api/admin/users/${OTHER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('NOT_A_DEVELOPER_ACCOUNT');
    expect(await ctx.prisma.user.findUnique({ where: { id: OTHER_ID } })).not.toBeNull();
  });

  it('rejects deletion by a non-admin caller', async () => {
    const res = await ctx.agent
      .delete(`/api/admin/users/${PASSENGER_ID}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(await ctx.prisma.user.findUnique({ where: { id: PASSENGER_ID } })).not.toBeNull();
  });

  it('rejects deletion of a missing user', async () => {
    const res = await ctx.agent
      .delete('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
