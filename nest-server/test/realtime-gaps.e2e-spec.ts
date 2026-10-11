// Socket.IO parity gaps: notification read/read_all + count-on-connect,
// presence ISO shape, force_disconnect emission, realtime metrics snapshot,
// expired-token handshake code, admin ticket role gating, enforcement:ack.
// Ports Main Server sockets/notificationSocket.ts, enforcementSocket.ts,
// adminSocket.ts, presenceSocket.ts and socketServer.ts semantics.
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';
import { RealtimeGateway } from '../src/realtime/realtime.gateway.js';

const OWNER_ID = 'e7000000-0000-4000-8000-000000000001';
const ADMIN_ID = 'e7000000-0000-4000-8000-000000000002';
const SUPPORT_ID = 'e7000000-0000-4000-8000-000000000003';
const MODERATOR_ID = 'e7000000-0000-4000-8000-000000000004';
const AGENT_ID = 'e7000000-0000-4000-8000-000000000005';
const WATCHER_ID = 'e7000000-0000-4000-8000-000000000006';

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key-for-nest-tests';

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

// Listeners attach synchronously at construction so the connect-time
// `notification:count` push cannot race the test.
function connectWithCount(port: number, token: string): Promise<{ socket: Socket; count: Record<string, unknown> }> {
  const socket = io(`http://127.0.0.1:${port}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
  const connected = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('connect timeout')), 10000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
  const count = waitFor(socket, 'notification:count');
  return connected.then(() => count.then((c) => ({ socket, count: c })));
}

function connectExpectError(port: number, token: string): Promise<Error> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
    const timer = setTimeout(() => reject(new Error('connect_error timeout')), 10000);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.disconnect();
      reject(new Error('expected connect_error but connected'));
    });
    socket.on('connect_error', (err: Error) => {
      clearTimeout(timer);
      socket.disconnect();
      resolve(err);
    });
  });
}

describe('realtime parity gaps', () => {
  let ctx: TestContext;
  let port: number;
  let ownerToken: string;
  let adminToken: string;
  let supportToken: string;
  let moderatorToken: string;

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
    const users: Array<{ id: string; phone: string; role: 'passenger' | 'admin' | 'support' | 'moderator' }> = [
      { id: OWNER_ID, phone: '+962797000001', role: 'passenger' },
      { id: ADMIN_ID, phone: '+962797000002', role: 'admin' },
      { id: SUPPORT_ID, phone: '+962797000003', role: 'support' },
      { id: MODERATOR_ID, phone: '+962797000004', role: 'moderator' },
      { id: AGENT_ID, phone: '+962797000005', role: 'support' },
      { id: WATCHER_ID, phone: '+962797000006', role: 'passenger' },
    ];
    for (const u of users) {
      await ctx.prisma.user.create({
        data: {
          id: u.id,
          fullName: `Gap ${u.role} ${u.id.slice(-4)}`,
          phone: u.phone,
          countryCode: 'JO',
          role: u.role,
          passwordHash: 'hashed',
          isVerified: true,
        },
      });
    }
    ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    supportToken = generateAccessToken({ id: SUPPORT_ID, role: 'support' });
    moderatorToken = generateAccessToken({ id: MODERATOR_ID, role: 'moderator' });
  });

  async function seedNotification(userId: string): Promise<{ id: string }> {
    return ctx.prisma.notification.create({
      data: {
        userId,
        type: 'TRIP_CANCELLED',
        title: 'Trip cancelled',
        body: 'Your trip was cancelled.',
        data: {},
        isRead: false,
        sentVia: ['in_app'],
      },
    });
  }

  async function seedTicket(): Promise<{ id: string }> {
    return ctx.prisma.supportTicket.create({
      data: {
        userId: OWNER_ID,
        category: 'general',
        subject: 'Need help',
        description: 'Please help with my account.',
        status: 'open',
      },
    });
  }

  it('pushes notification:count on every successful connection', async () => {
    await seedNotification(OWNER_ID);
    await seedNotification(OWNER_ID);
    const { socket, count } = await connectWithCount(port, ownerToken);
    try {
      expect(count.unread_count).toBe(2);
      expect(typeof count.timestamp).toBe('number');
    } finally {
      socket.disconnect();
    }
  });

  it('notification:read marks one notification and refreshes the count', async () => {
    const first = await seedNotification(OWNER_ID);
    await seedNotification(OWNER_ID);
    const socket = await connectSocket(port, ownerToken);
    try {
      // Drain the connect-time badge so the next push is the post-read one.
      const initial = await waitFor(socket, 'notification:count');
      expect(initial.unread_count).toBe(2);

      const refreshed = waitFor(socket, 'notification:count');
      const ack = await emitAck(socket, 'notification:read', { notification_id: first.id });
      expect(ack.status).toBe('ok');
      expect((ack.data as Record<string, unknown>).notification_id).toBe(first.id);

      const count = await refreshed;
      expect(count.unread_count).toBe(1);

      const persisted = await ctx.prisma.notification.findUnique({ where: { id: first.id } });
      expect(persisted?.isRead).toBe(true);
    } finally {
      socket.disconnect();
    }
  });

  it('notification:read rejects unknown ids with NOTIFICATION_NOT_FOUND', async () => {
    const socket = await connectSocket(port, ownerToken);
    try {
      const ack = await emitAck(socket, 'notification:read', {
        notification_id: 'e7000000-0000-4000-8000-00000000ffff',
      });
      expect(ack.status).toBe('error');
      expect(ack.code).toBe('NOTIFICATION_NOT_FOUND');
    } finally {
      socket.disconnect();
    }
  });

  it('notification:read_all marks everything and pushes count 0', async () => {
    await seedNotification(OWNER_ID);
    await seedNotification(OWNER_ID);
    const socket = await connectSocket(port, ownerToken);
    try {
      // Drain the connect-time badge so the next push is the post-read one.
      const initial = await waitFor(socket, 'notification:count');
      expect(initial.unread_count).toBe(2);

      const refreshed = waitFor(socket, 'notification:count');
      const ack = await emitAck(socket, 'notification:read_all', {});
      expect(ack.status).toBe('ok');
      expect((ack.data as Record<string, unknown>).marked).toBe(2);

      const count = await refreshed;
      expect(count.unread_count).toBe(0);

      const remaining = await ctx.prisma.notification.count({ where: { userId: OWNER_ID, isRead: false } });
      expect(remaining).toBe(0);
    } finally {
      socket.disconnect();
    }
  });

  it('emits presence:status with last_seen as an ISO string', async () => {
    const watcherToken = generateAccessToken({ id: WATCHER_ID, role: 'passenger' });
    const watcher = await connectSocket(port, watcherToken);
    try {
      const status = waitFor(watcher, 'presence:status');
      const owner = await connectSocket(port, ownerToken);
      try {
        const payload = await status;
        expect(payload.user_id).toBe(OWNER_ID);
        expect(payload.status).toBe('online');
        expect(typeof payload.last_seen).toBe('string');
        expect(Number.isNaN(Date.parse(payload.last_seen as string))).toBe(false);
      } finally {
        owner.disconnect();
      }
    } finally {
      watcher.disconnect();
    }
  });

  it('emits force_disconnect with SESSION_TERMINATED before disconnecting', async () => {
    const socket = await connectSocket(port, ownerToken);
    try {
      const forced = waitFor(socket, 'force_disconnect');
      const gateway = ctx.app.get(RealtimeGateway);
      await gateway.disconnectUserSockets(OWNER_ID);
      const payload = await forced;
      expect(payload.reason).toBe('SESSION_TERMINATED');
    } finally {
      socket.disconnect();
    }
  });

  it('acknowledges enforcement:ack minimally', async () => {
    const socket = await connectSocket(port, ownerToken);
    try {
      const ack = await emitAck(socket, 'enforcement:ack', {});
      expect(ack.status).toBe('ok');
    } finally {
      socket.disconnect();
    }
  });

  it('serves the Express-shaped realtime metrics snapshot', async () => {
    const socket = await connectSocket(port, ownerToken);
    try {
      const res = await ctx.agent.get('/api/health/realtime');
      expect(res.status).toBe(200);
      const body = res.body as Record<string, unknown>;
      expect(typeof body.active_connections).toBe('number');
      expect(typeof body.active_users).toBe('number');
      expect(typeof body.events_delivered_total).toBe('number');
      expect(typeof body.events_delivered_1s).toBe('number');
      expect(typeof body.delivery_p99_ms).toBe('number');
      expect(typeof body.delivery_p95_ms).toBe('number');
      expect(typeof body.reconnects_total).toBe('number');
      expect(typeof body.reconnect_rate_1m).toBe('number');
      expect(typeof body.rate_limited_total).toBe('number');
      expect(typeof body.failures_total).toBe('number');
      const alerting = body.alerting as Record<string, unknown>;
      expect(typeof alerting.failure_alert_active).toBe('boolean');
      expect(alerting.last_alerted_at === null || typeof alerting.last_alerted_at === 'string').toBe(true);
      expect(body.active_users as number).toBeGreaterThanOrEqual(1);
    } finally {
      socket.disconnect();
    }
  });

  it('rejects expired handshake tokens with the TOKEN_EXPIRED code', async () => {
    const expired = sign(
      { id: OWNER_ID, role: 'passenger', type: 'access', exp: Math.floor(Date.now() / 1000) - 10 },
      JWT_SECRET,
    );
    const err = await connectExpectError(port, expired);
    expect(err.message).toBe('TOKEN_EXPIRED');
  });

  it('gates admin:ticket_assign to staff roles', async () => {
    const ticket = await seedTicket();

    const passengerSocket = await connectSocket(port, ownerToken);
    try {
      const denied = await emitAck(passengerSocket, 'admin:ticket_assign', {
        support_ticket_id: ticket.id,
        agent_id: AGENT_ID,
      });
      expect(denied.status).toBe('error');
      expect(denied.code).toBe('FORBIDDEN');
    } finally {
      passengerSocket.disconnect();
    }

    const adminSocket = await connectSocket(port, adminToken);
    try {
      const ack = await emitAck(adminSocket, 'admin:ticket_assign', {
        support_ticket_id: ticket.id,
        agent_id: AGENT_ID,
      });
      expect(ack.status).toBe('ok');
      expect(ack.data).toMatchObject({ support_ticket_id: ticket.id, assigned_to: AGENT_ID });

      const persisted = await ctx.prisma.supportTicket.findUnique({ where: { id: ticket.id } });
      expect(persisted?.assignedTo).toBe(AGENT_ID);
    } finally {
      adminSocket.disconnect();
    }
  });

  it('admin:ticket_assign validates agent_id and ticket existence', async () => {
    const adminSocket = await connectSocket(port, adminToken);
    try {
      const ticket = await seedTicket();
      const missingAgent = await emitAck(adminSocket, 'admin:ticket_assign', {
        support_ticket_id: ticket.id,
      });
      expect(missingAgent.status).toBe('error');
      expect(missingAgent.code).toBe('VALIDATION_FAILED');

      const missingTicket = await emitAck(adminSocket, 'admin:ticket_assign', {
        support_ticket_id: 'e7000000-0000-4000-8000-00000000ffff',
        agent_id: AGENT_ID,
      });
      expect(missingTicket.status).toBe('error');
      expect(missingTicket.code).toBe('SUPPORT_TICKET_NOT_FOUND');
    } finally {
      adminSocket.disconnect();
    }
  });

  it('admin:ticket_resolve resolves, stores the solution, and notifies the owner', async () => {
    const ticket = await seedTicket();

    const passengerSocket = await connectSocket(port, ownerToken);
    try {
      const denied = await emitAck(passengerSocket, 'admin:ticket_resolve', {
        support_ticket_id: ticket.id,
        solution: 'done',
      });
      expect(denied.status).toBe('error');
      expect(denied.code).toBe('FORBIDDEN');
    } finally {
      passengerSocket.disconnect();
    }

    const supportSocket = await connectSocket(port, supportToken);
    try {
      const ack = await emitAck(supportSocket, 'admin:ticket_resolve', {
        support_ticket_id: ticket.id,
        solution: 'Fixed your account.',
      });
      expect(ack.status).toBe('ok');
      expect(ack.data).toMatchObject({ support_ticket_id: ticket.id, status: 'resolved' });

      const persisted = await ctx.prisma.supportTicket.findUnique({ where: { id: ticket.id } });
      expect(persisted?.status).toBe('resolved');
      expect(persisted?.resolutionNotes).toBe('Fixed your account.');

      const notice = await ctx.prisma.notification.findFirst({
        where: { userId: OWNER_ID, type: 'TICKET_RESOLVED' },
      });
      expect(notice).not.toBeNull();
    } finally {
      supportSocket.disconnect();
    }
  });

  it('lets moderators resolve tickets', async () => {
    const ticket = await seedTicket();
    const moderatorSocket = await connectSocket(port, moderatorToken);
    try {
      const ack = await emitAck(moderatorSocket, 'admin:ticket_resolve', {
        support_ticket_id: ticket.id,
      });
      expect(ack.status).toBe('ok');
      const persisted = await ctx.prisma.supportTicket.findUnique({ where: { id: ticket.id } });
      expect(persisted?.status).toBe('resolved');
    } finally {
      moderatorSocket.disconnect();
    }
  });
});
