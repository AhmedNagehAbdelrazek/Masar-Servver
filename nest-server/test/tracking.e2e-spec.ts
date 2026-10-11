// Live tracking over Socket.IO: join rules, ingest + broadcast, batch/age
// caps, once-only proximity alerts. 1:1 port of
// Main Server/tests/integration/trackingLive.test.js (Wave 5.5).
// Sockets need a live port: the app listens on an ephemeral port per file.
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'c1000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'c1000000-0000-4000-8000-000000000002';
const STRANGER_ID = 'c1000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'c1000000-0000-4000-8000-000000000010';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitAck(socket: Socket, event: string, payload: unknown): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout for ${event}`)), 10000);
    socket.emit(event, payload, (res: unknown) => {
      clearTimeout(timer);
      resolve(res as Record<string, unknown>);
    });
  });
}

function connectSocket(port: number, token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
    const timer = setTimeout(() => reject(new Error('connect timeout')), 10000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('Live tracking', () => {
  let ctx: TestContext;
  let port: number;
  let driverToken: string;
  let passengerToken: string;
  let strangerToken: string;
  let tripId: string;
  let bookingId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await ctx.app.listen(0);
    port = (ctx.app.getHttpServer().address() as AddressInfo).port;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Live Driver',
        phone: '+962795559041',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Live Passenger',
        phone: '+962795559042',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: STRANGER_ID,
        fullName: 'Stranger',
        phone: '+962795559043',
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
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'TRK-1',
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
    strangerToken = generateAccessToken({ id: STRANGER_ID, role: 'passenger' });

    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        origin_lat: 31.9539,
        origin_lng: 35.9106,
        destination_city: 'Irbid',
        destination_lat: 32.5568,
        destination_lng: 35.8469,
        departure_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(tripRes.status).toBe(201);
    tripId = tripRes.body.trip_id as string;

    await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
    const bookingRes = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        trip_id: tripId,
        seat_numbers: [2],
        agreed_fare: '15.00',
        pickup: { name: 'Pickup Point', lat: 31.96, lng: 35.905 },
      });
    expect(bookingRes.status).toBe(201);
    bookingId = (bookingRes.body.booking as Record<string, unknown>).id as string;

    const start = await ctx.agent
      .post(`/api/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(start.status).toBe(200);
  });

  it('lets driver and confirmed passenger join, refuses strangers and stale trips', async () => {
    const driver = await connectSocket(port, driverToken);
    const passenger = await connectSocket(port, passengerToken);
    const stranger = await connectSocket(port, strangerToken);
    try {
      expect((await emitAck(driver, 'tracking:join', { trip_id: tripId })).status).toBe('ok');
      expect((await emitAck(passenger, 'tracking:join', { trip_id: tripId })).status).toBe('ok');
      const denied = await emitAck(stranger, 'tracking:join', { trip_id: tripId });
      expect(denied.status).toBe('error');

      // Non-active trips refuse even members.
      await ctx.prisma.trip.update({ where: { id: tripId }, data: { status: 'completed' } });
      const stale = await emitAck(driver, 'tracking:join', { trip_id: tripId });
      expect(stale.status).toBe('error');
    } finally {
      driver.disconnect();
      passenger.disconnect();
      stranger.disconnect();
    }
  });

  it('persists a point and broadcasts a personal ETA to the passenger', async () => {
    const driver = await connectSocket(port, driverToken);
    const passenger = await connectSocket(port, passengerToken);
    try {
      expect((await emitAck(passenger, 'tracking:join', { trip_id: tripId })).status).toBe('ok');
      const updates: Record<string, unknown>[] = [];
      passenger.on('tracking:update', (data) => {
        updates.push(data as Record<string, unknown>);
      });

      const ack = await emitAck(driver, 'tracking:location', {
        trip_id: tripId,
        lat: 31.955,
        lng: 35.908,
        speed: 10,
      });
      expect(ack.status).toBe('ok');

      const rows = await ctx.prisma.tripLocation.findMany({ where: { tripId } });
      expect(rows.length).toBe(1);

      await sleep(500);
      expect(updates.length).toBeGreaterThan(0);
      expect(typeof updates[0]?.eta_minutes).toBe('number');
      void bookingId;
    } finally {
      driver.disconnect();
      passenger.disconnect();
    }
  });

  it('ingests batches and rejects stale single points', async () => {
    const driver = await connectSocket(port, driverToken);
    try {
      const fresh = new Date(Date.now() - 60 * 1000).toISOString();
      const batch = await emitAck(driver, 'tracking:location', {
        trip_id: tripId,
        points: [
          { lat: 31.955, lng: 35.908, speed: 10, recorded_at: fresh },
          { lat: 31.956, lng: 35.909, speed: 10, recorded_at: fresh },
        ],
      });
      expect(batch.status).toBe('ok');
      expect((batch.data as Record<string, unknown>).stored).toBe(2);

      await sleep(2100); // location rate limit: 1 per 2s
      const stale = await emitAck(driver, 'tracking:location', {
        trip_id: tripId,
        lat: 31.955,
        lng: 35.908,
        recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      });
      expect(stale.status).toBe('error');
      expect(stale.code).toBe('LOCATION_POINT_TOO_OLD');
    } finally {
      driver.disconnect();
    }
  });

  it('fires proximity alerts once per booking', async () => {
    const driver = await connectSocket(port, driverToken);
    const passenger = await connectSocket(port, passengerToken);
    try {
      expect((await emitAck(passenger, 'tracking:join', { trip_id: tripId })).status).toBe('ok');
      const proximity: Record<string, unknown>[] = [];
      passenger.on('tracking:proximity', (data) => {
        proximity.push(data as Record<string, unknown>);
      });

      // Right at the pickup point (31.96, 35.905).
      expect(
        (
          await emitAck(driver, 'tracking:location', {
            trip_id: tripId,
            lat: 31.96,
            lng: 35.905,
            speed: 5,
          })
        ).status,
      ).toBe('ok');
      await sleep(500);

      const states = proximity.map((p) => p.state);
      expect(states).toContain('near');
      expect(states).toContain('arrived');

      const driverNotes = await ctx.prisma.notification.count({
        where: { userId: PASSENGER_ID, type: 'DRIVER_NEARBY' },
      });
      const arrivedNotes = await ctx.prisma.notification.count({
        where: { userId: PASSENGER_ID, type: 'DRIVER_ARRIVED' },
      });
      expect(driverNotes).toBeLessThanOrEqual(1);
      expect(arrivedNotes).toBeLessThanOrEqual(1);

      // Repeat ingest: no duplicate alerts.
      await sleep(2100);
      await emitAck(driver, 'tracking:location', {
        trip_id: tripId,
        lat: 31.96,
        lng: 35.905,
        speed: 5,
      });
      await sleep(500);
      expect(
        await ctx.prisma.notification.count({ where: { userId: PASSENGER_ID, type: 'DRIVER_NEARBY' } }),
      ).toBe(driverNotes);
      expect(
        await ctx.prisma.notification.count({ where: { userId: PASSENGER_ID, type: 'DRIVER_ARRIVED' } }),
      ).toBe(arrivedNotes);
    } finally {
      driver.disconnect();
      passenger.disconnect();
    }
  });

  it('rejects non-driver location with 403', async () => {
    const passenger = await connectSocket(port, passengerToken);
    try {
      const res = await emitAck(passenger, 'tracking:location', {
        trip_id: tripId,
        lat: 31.955,
        lng: 35.908,
      });
      expect(res.status).toBe('error');
    } finally {
      passenger.disconnect();
    }
  });
});
