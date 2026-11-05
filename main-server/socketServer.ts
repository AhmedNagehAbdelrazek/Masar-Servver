import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import socketAuth from './middlewares/socketAuth';
import realtimeService from './Services/realtimeService';
import realtimeMetrics from './Services/realtimeMetrics';

let ioInstance: Server | null = null;

function createSocketServer(httpServer: HttpServer): Server {
  const io: Server = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });
  ioInstance = io;
  (realtimeService as unknown as { setIO: (io: Server) => void }).setIO(io);

  if (process.env.NODE_ENV !== 'test') {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter') as { createAdapter: (pub: unknown, sub: unknown) => unknown };
      const { redis } = require('./config/redis') as { redis: { duplicate: (opts: unknown) => unknown } };
      const pubClient = redis.duplicate({ keyPrefix: '' });
      const subClient = redis.duplicate({ keyPrefix: '' });
      (io as unknown as { adapter: (a: unknown) => void }).adapter(createAdapter(pubClient, subClient));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[socket] Redis adapter unavailable, using single-node:', msg);
    }
  }
  console.log('[socket] Redis adapter', process.env.NODE_ENV !== 'test' ? 'enabled' : 'disabled');

  io.use(socketAuth as unknown as Parameters<Server['use']>[0]);

  io.on('connection_error', () => {
    (realtimeMetrics as unknown as { recordConnectionFailure: () => void }).recordConnectionFailure();
  });

  io.on('connection', (socket: Socket & { data: { user?: { id: string; role: string }; connectedAt?: number }; recovered?: boolean; handshake: { auth: { reconnecting?: boolean } } }) => {
    const user = socket.data.user;
    if (!user) return;

    (realtimeMetrics as unknown as { recordConnection: (id: string) => void }).recordConnection(user.id);
    (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('connection');
    if (socket.recovered || (socket.handshake.auth && socket.handshake.auth.reconnecting)) {
      (realtimeMetrics as unknown as { recordReconnect: () => void }).recordReconnect();
      (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('reconnect');
    }

    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);
    socket.data.connectedAt = Date.now();

    for (const mod of [
      './sockets/chatSocket',
      './sockets/notificationSocket',
      './sockets/sosSocket',
      './sockets/trackingSocket',
      './sockets/presenceSocket',
      './sockets/enforcementSocket',
      './sockets/adminSocket',
    ]) {
      try {
        (require(mod) as (io: Server, socket: Socket) => void)(io, socket);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[socket] failed to register ${mod}:`, msg);
      }
    }

    socket.on('disconnect', () => {
      (realtimeMetrics as unknown as { recordDisconnection: (id: string) => void }).recordDisconnection(user.id);
      (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('disconnection');
    });
  });

  return io;
}

function disconnectUserSockets(userId: string): void {
  if (!ioInstance || !userId) return;
  const sockets = ioInstance.sockets.sockets as Map<string, Socket & { data: { user?: { id: string } } }>;
  for (const [, socket] of sockets) {
    if (socket.data.user && socket.data.user.id === userId) {
      try {
        socket.emit('force_disconnect', { reason: 'SESSION_TERMINATED' });
      } catch (_err: unknown) {
        // ignore
      }
      socket.disconnect(true);
    }
  }
}

function getIO(): ReturnType<typeof realtimeService.getIO> {
  return (realtimeService as unknown as { getIO: () => ReturnType<typeof realtimeService.getIO> }).getIO();
}

function emitToUser(userId: string, event: string, data: unknown): unknown {
  return (realtimeService as unknown as { emitToUser: (id: string, e: string, d: unknown) => unknown }).emitToUser(userId, event, data);
}

export { createSocketServer, getIO, emitToUser, disconnectUserSockets };
export default { createSocketServer, getIO, emitToUser, disconnectUserSockets };
module.exports = { createSocketServer, getIO, emitToUser, disconnectUserSockets };
