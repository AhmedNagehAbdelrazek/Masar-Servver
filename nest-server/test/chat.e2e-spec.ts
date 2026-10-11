// Booking chat (driver <-> passenger) + support ticket chat over Socket.IO,
// with REST history fallback. 1:1 port of
// Main Server/tests/integration/bookingChat.test.js (Wave 6.1).
// Sockets need a live port: the app listens on an ephemeral port per file.
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'b2000000-0000-4000-8000-000000000001';
const PASSENGER1_ID = 'b2000000-0000-4000-8000-000000000002';
const PASSENGER2_ID = 'b2000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'b2000000-0000-4000-8000-000000000010';

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

function futureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

describe('Booking chat (driver <-> passenger)', () => {
  let ctx: TestContext;
  let port: number;
  let driverToken: string;
  let passenger1Token: string;
  let passenger2Token: string;
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
        fullName: 'Chat Driver',
        phone: '+962795557001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER1_ID,
        fullName: 'Chat Passenger 1',
        phone: '+962795557002',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER2_ID,
        fullName: 'Chat Passenger 2',
        phone: '+962795557003',
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
        plateNumber: 'CHT-101',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });

    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });

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
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
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
        departure_time: `${futureDate(1)}T15:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '20.00',
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
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ seat_number: 2 });

    const bookingRes = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({
        trip_id: tripId,
        seat_numbers: [2],
        agreed_fare: '20.00',
      });
    expect(bookingRes.status).toBe(201);
    bookingId = (bookingRes.body.booking as Record<string, unknown>).id as string;
  });

  it('delivers a booking message between the two chat parties in realtime', async () => {
    const driverSocket = await connectSocket(port, driverToken);
    const passengerSocket = await connectSocket(port, passenger1Token);
    try {
      const joinDriver = await emitAck(driverSocket, 'chat:join', { booking_id: bookingId });
      expect(joinDriver.status).toBe('ok');
      expect((joinDriver.data as Record<string, unknown>).room).toBe(`booking:${bookingId}`);

      const joinPassenger = await emitAck(passengerSocket, 'chat:join', { booking_id: bookingId });
      expect(joinPassenger.status).toBe('ok');

      const receivePromise = waitFor(driverSocket, 'chat:receive');
      const sendAck = await emitAck(passengerSocket, 'chat:send', {
        booking_id: bookingId,
        message: 'See you at the pickup point',
      });
      expect(sendAck.status).toBe('ok');
      expect((sendAck.data as Record<string, unknown>).id).toBeDefined();

      const received = await receivePromise;
      expect(received.booking_id).toBe(bookingId);
      expect(received.support_ticket_id).toBeNull();
      expect(received.message).toBe('See you at the pickup point');
      expect(received.sender_id).toBe(PASSENGER1_ID);
    } finally {
      driverSocket.disconnect();
      passengerSocket.disconnect();
    }
  });

  it('rejects users without a booking on the trip', async () => {
    const outsiderSocket = await connectSocket(port, passenger2Token);
    try {
      const joinAck = await emitAck(outsiderSocket, 'chat:join', { booking_id: bookingId });
      expect(joinAck.status).toBe('error');
      expect(joinAck.code).toBe('FORBIDDEN');

      const sendAck = await emitAck(outsiderSocket, 'chat:send', {
        booking_id: bookingId,
        message: 'hello?',
      });
      expect(sendAck.status).toBe('error');
      expect(sendAck.code).toBe('FORBIDDEN');
    } finally {
      outsiderSocket.disconnect();
    }

    const res = await ctx.agent
      .get(`/api/chat/bookings/${bookingId}/messages`)
      .set('Authorization', `Bearer ${passenger2Token}`);
    expect(res.status).toBe(403);
  });

  it('requires a confirmed booking to participate', async () => {
    await ctx.prisma.booking.update({ where: { id: bookingId }, data: { status: 'pending' } });

    const passengerSocket = await connectSocket(port, passenger1Token);
    try {
      const sendAck = await emitAck(passengerSocket, 'chat:send', {
        booking_id: bookingId,
        message: 'still valid?',
      });
      expect(sendAck.status).toBe('error');
      expect(sendAck.code).toBe('FORBIDDEN');
    } finally {
      passengerSocket.disconnect();
    }
  });

  it('closes the live chat once the trip completes but keeps history readable', async () => {
    const passengerSocket = await connectSocket(port, passenger1Token);
    const driverSocket = await connectSocket(port, driverToken);
    try {
      await emitAck(passengerSocket, 'chat:join', { booking_id: bookingId });
      await emitAck(driverSocket, 'chat:join', { booking_id: bookingId });
      await emitAck(passengerSocket, 'chat:send', {
        booking_id: bookingId,
        message: 'before completion',
      });

      await ctx.prisma.trip.update({ where: { id: tripId }, data: { status: 'completed' } });

      const sendAck = await emitAck(passengerSocket, 'chat:send', {
        booking_id: bookingId,
        message: 'too late?',
      });
      expect(sendAck.status).toBe('error');
      expect(sendAck.code).toBe('FORBIDDEN');

      const joinAck = await emitAck(passengerSocket, 'chat:join', { booking_id: bookingId });
      expect(joinAck.status).toBe('error');
      expect(joinAck.code).toBe('FORBIDDEN');

      const history = await ctx.agent
        .get(`/api/chat/bookings/${bookingId}/messages`)
        .set('Authorization', `Bearer ${passenger1Token}`);
      expect(history.status).toBe(200);
      expect(history.body.data).toHaveLength(1);
      expect(history.body.data[0].message).toBe('before completion');
      expect(history.body.data[0].booking_id).toBe(bookingId);
    } finally {
      passengerSocket.disconnect();
      driverSocket.disconnect();
    }
  });

  it('closes the live chat once the trip is cancelled', async () => {
    await ctx.prisma.trip.update({ where: { id: tripId }, data: { status: 'cancelled' } });

    const driverSocket = await connectSocket(port, driverToken);
    try {
      const joinAck = await emitAck(driverSocket, 'chat:join', { booking_id: bookingId });
      expect(joinAck.status).toBe('error');
      expect(joinAck.code).toBe('FORBIDDEN');
    } finally {
      driverSocket.disconnect();
    }
  });

  it('broadcasts read receipts to the booking room', async () => {
    const driverSocket = await connectSocket(port, driverToken);
    const passengerSocket = await connectSocket(port, passenger1Token);
    try {
      await emitAck(driverSocket, 'chat:join', { booking_id: bookingId });
      await emitAck(passengerSocket, 'chat:join', { booking_id: bookingId });

      await emitAck(passengerSocket, 'chat:send', {
        booking_id: bookingId,
        message: 'please confirm',
      });

      const ackPromise = waitFor(passengerSocket, 'chat:read_ack');
      const readAck = await emitAck(driverSocket, 'chat:read', { booking_id: bookingId });
      expect(readAck.status).toBe('ok');

      const receipt = await ackPromise;
      expect(receipt.booking_id).toBe(bookingId);
      expect(receipt.read_by).toBe(DRIVER_ID);

      const unread = await ctx.prisma.message.findMany({
        where: { bookingId, senderId: PASSENGER1_ID },
      });
      expect(unread).toHaveLength(1);
      expect(unread[0].isRead).toBe(true);
    } finally {
      driverSocket.disconnect();
      passengerSocket.disconnect();
    }
  });

  it('returns paginated history for both chat parties only', async () => {
    await ctx.prisma.message.create({
      data: {
        senderId: PASSENGER1_ID,
        bookingId,
        message: 'hi driver',
        messageType: 'text',
      },
    });
    await ctx.prisma.message.create({
      data: {
        senderId: DRIVER_ID,
        bookingId,
        message: 'hello passenger',
        messageType: 'text',
      },
    });

    for (const token of [passenger1Token, driverToken]) {
      const res = await ctx.agent
        .get(`/api/chat/bookings/${bookingId}/messages`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      const messages = (res.body.data as Array<Record<string, unknown>>).map((m) => m.message);
      expect(messages).toContain('hi driver');
      expect(messages).toContain('hello passenger');
    }
  });
});

describe('Support ticket chat (user <-> support team)', () => {
  let ctx: TestContext;
  let port: number;
  let driverToken: string;
  let passenger1Token: string;

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
        fullName: 'Chat Driver',
        phone: '+962795557001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER1_ID,
        fullName: 'Chat Passenger 1',
        phone: '+962795557002',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
  });

  async function createTicket(token: string): Promise<string> {
    const res = await ctx.agent
      .post('/api/support-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'general',
        subject: 'Need help with my account',
        description: 'I cannot access my bookings.',
      });
    expect(res.status).toBe(201);
    const ticket = res.body.support_ticket as Record<string, unknown>;
    return ticket.id as string;
  }

  it('lets both passengers and drivers open support chats regardless of trips', async () => {
    const passengerTicketId = await createTicket(passenger1Token);
    const driverTicketId = await createTicket(driverToken);
    expect(passengerTicketId).toBeDefined();
    expect(driverTicketId).toBeDefined();

    const passengerHistory = await ctx.agent
      .get(`/api/chat/tickets/${passengerTicketId}/messages`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(passengerHistory.status).toBe(200);
    expect(passengerHistory.body.data).toEqual([]);

    const driverHistory = await ctx.agent
      .get(`/api/chat/tickets/${driverTicketId}/messages`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverHistory.status).toBe(200);

    const passengerSocket = await connectSocket(port, passenger1Token);
    try {
      const sendAck = await emitAck(passengerSocket, 'chat:send', {
        support_ticket_id: passengerTicketId,
        message: 'any update?',
      });
      expect(sendAck.status).toBe('ok');

      const history = await ctx.agent
        .get(`/api/chat/tickets/${passengerTicketId}/messages`)
        .set('Authorization', `Bearer ${passenger1Token}`);
      expect(history.status).toBe(200);
      expect(history.body.data).toHaveLength(1);
      expect(history.body.data[0].support_ticket_id).toBe(passengerTicketId);
    } finally {
      passengerSocket.disconnect();
    }
  });

  it('keeps support chat independent of the trip lifecycle', async () => {
    const ticketId = await createTicket(passenger1Token);

    const passengerSocket = await connectSocket(port, passenger1Token);
    try {
      const sendAck = await emitAck(passengerSocket, 'chat:send', {
        support_ticket_id: ticketId,
        message: 'trip cancelled, need a refund',
      });
      expect(sendAck.status).toBe('ok');
    } finally {
      passengerSocket.disconnect();
    }
  });
});
