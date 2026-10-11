// SOS emergency flow: socket trigger (+ dedupe), user ack/resolved events,
// admin list/ack/resolve. No dedicated Express integration test exists for
// this surface; coverage mirrors Services/sosService.ts + sockets/sosSocket.ts
// semantics (Wave 6.2).
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'd6000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'd6000000-0000-4000-8000-000000000002';
const STRANGER_ID = 'd6000000-0000-4000-8000-000000000003';
const ADMIN_ID = 'd6000000-0000-4000-8000-000000000004';
const VEHICLE_ID = 'd6000000-0000-4000-8000-000000000010';

function emitAck(socket: Socket, event: string, payload: unknown): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout for ${event}`)), 10000);
    socket.emit(event, payload, (res: unknown) => {
      clearTimeout(timer);
      resolve(res as Record<string, unknown>);
    });
  });
}

function waitFor(socket: Socket, event: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`event timeout for ${event}`)), 10000);
    socket.once(event, (data: unknown) => {
      clearTimeout(timer);
      resolve(data as Record<string, unknown>);
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

describe('SOS emergency flow', () => {
  let ctx: TestContext;
  let port: number;
  let driverToken: string;
  let passengerToken: string;
  let strangerToken: string;
  let adminToken: string;
  let tripId: string;

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
    const users = [
      { id: DRIVER_ID, fullName: 'SOS Driver', phone: '+962795596001', role: 'driver' },
      { id: PASSENGER_ID, fullName: 'SOS Passenger', phone: '+962795596002', role: 'passenger' },
      { id: STRANGER_ID, fullName: 'SOS Stranger', phone: '+962795596003', role: 'passenger' },
      { id: ADMIN_ID, fullName: 'SOS Admin', phone: '+962795596004', role: 'admin' },
    ];
    for (const u of users) {
      await ctx.prisma.user.create({
        data: {
          id: u.id,
          fullName: u.fullName,
          phone: u.phone,
          countryCode: 'JO',
          role: u.role as 'driver' | 'passenger' | 'admin',
          passwordHash: 'hashed',
          isVerified: true,
        },
      });
    }
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'SOS-1',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });

    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    strangerToken = generateAccessToken({ id: STRANGER_ID, role: 'passenger' });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });

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

    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
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
      .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '15.00' });
    expect(bookingRes.status).toBe(201);

    const start = await ctx.agent
      .post(`/api/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(start.status).toBe(200);
  });

  it('triggers an SOS, acks the user, and reuses the active event', async () => {
    const passenger = await connectSocket(port, passengerToken);
    try {
      const ackPromise = waitFor(passenger, 'sos:ack');
      const ack = await emitAck(passenger, 'sos:trigger', {
        trip_id: tripId,
        lat: 31.96,
        lng: 35.905,
      });
      expect(ack.status).toBe('ok');
      expect((ack.data as Record<string, unknown>).reused).toBe(false);
      const sosEventId = (ack.data as Record<string, unknown>).sos_event_id as string;
      expect(sosEventId).toBeDefined();

      const userAck = await ackPromise;
      expect(userAck.sos_event_id).toBe(sosEventId);
      expect(userAck.status).toBe('received');

      const repeat = await emitAck(passenger, 'sos:trigger', {
        trip_id: tripId,
        lat: 31.96,
        lng: 35.905,
      });
      expect(repeat.status).toBe('ok');
      expect((repeat.data as Record<string, unknown>).reused).toBe(true);
      expect((repeat.data as Record<string, unknown>).sos_event_id).toBe(sosEventId);

      const count = await ctx.prisma.sosEvent.count({ where: { userId: PASSENGER_ID } });
      expect(count).toBe(1);
    } finally {
      passenger.disconnect();
    }
  });

  it('refuses SOS from non-participants', async () => {
    const stranger = await connectSocket(port, strangerToken);
    try {
      const denied = await emitAck(stranger, 'sos:trigger', {
        trip_id: tripId,
        lat: 31.96,
        lng: 35.905,
      });
      expect(denied.status).toBe('error');
      expect(denied.code).toBe('FORBIDDEN');
    } finally {
      stranger.disconnect();
    }
  });

  it('runs the admin list/ack/resolve lifecycle with user notification', async () => {
    const passenger = await connectSocket(port, passengerToken);
    try {
      const trigger = await emitAck(passenger, 'sos:trigger', {
        trip_id: tripId,
        lat: 31.96,
        lng: 35.905,
        urgency: 'critical',
      });
      expect(trigger.status).toBe('ok');
      const sosEventId = (trigger.data as Record<string, unknown>).sos_event_id as string;

      const list = await ctx.agent
        .get('/api/admin/sos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0].id).toBe(sosEventId);
      expect(list.body.data[0].status).toBe('pending');
      expect(list.body.data[0].urgency).toBe('critical');
      expect(list.body.data[0].user_name).toBe('SOS Passenger');

      const ackRes = await ctx.agent
        .post(`/api/admin/sos/${sosEventId}/ack`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(ackRes.status).toBe(200);
      expect(ackRes.body.sos_event.status).toBe('acknowledged');

      const resolvedPromise = waitFor(passenger, 'sos:resolved');
      const resolveRes = await ctx.agent
        .post(`/api/admin/sos/${sosEventId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolution_note: 'Driver contacted, all good.' });
      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.sos_event.status).toBe('resolved');

      const resolvedEvt = await resolvedPromise;
      expect(resolvedEvt.sos_event_id).toBe(sosEventId);

      const again = await ctx.agent
        .post(`/api/admin/sos/${sosEventId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolution_note: 'again' });
      expect(again.status).toBe(409);

      const filtered = await ctx.agent
        .get('/api/admin/sos?status=resolved')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(filtered.status).toBe(200);
      expect(filtered.body.data).toHaveLength(1);
    } finally {
      passenger.disconnect();
    }
  });

  it('restricts SOS admin routes to admins', async () => {
    const list = await ctx.agent
      .get('/api/admin/sos')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(list.status).toBe(403);
  });
});
