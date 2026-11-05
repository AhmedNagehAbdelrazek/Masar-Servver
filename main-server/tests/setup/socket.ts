import http from 'http';
import { io as ioc } from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import createApp from '../../app';
import { createSocketServer, getIO } from '../../socketServer';

let httpServer: http.Server | null = null;
let port: number | null = null;

/**
 * Boots an HTTP server with the realtime socket server attached on an
 * ephemeral port. Returns the port number.
 */
export async function startSocketServer(): Promise<number> {
  httpServer = http.createServer(createApp() as unknown as http.RequestListener);
  createSocketServer(httpServer as unknown as Parameters<typeof createSocketServer>[0]);
  await new Promise<void>((resolve) => httpServer!.listen(0, resolve));
  const addr: unknown = httpServer.address();
  port = (addr as { port: number }).port;
  return port;
}

interface ConnectOpts {
  query?: Record<string, unknown>;
  auth?: Record<string, unknown>;
}

/**
 * Opens a socket.io-client connection authenticated with the given access
 * JWT. Returns the client socket (caller owns connect/disconnect lifecycle).
 */
export function connectSocket(token: string, opts: ConnectOpts = {}): ClientSocket {
  const { query = {}, auth = {} } = opts;
  return ioc(`http://127.0.0.1:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 3000,
    auth: { token, ...auth },
    query,
  });
}

/**
 * Resolves with the payload of the next occurrence of `event` (or rejects on
 * timeout). Use for server-initiated emissions.
 */
export function waitFor<T = unknown>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 3000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer: NodeJS.Timeout = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for socket event "${event}"`));
    }, timeoutMs);
    function onEvent(payload: T): void {
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(payload);
    }
    socket.once(event, onEvent as (...args: unknown[]) => void);
  });
}

/**
 * Emits `event` with `payload` and resolves with the ack response (rejects on
 * timeout when the server never acks).
 */
export function emitWithAck<T = unknown>(
  socket: ClientSocket,
  event: string,
  payload: unknown,
  timeoutMs = 3000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer: NodeJS.Timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ack of socket event "${event}"`));
    }, timeoutMs);
    socket.emit(event, payload, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

/** Waits for the client socket to reach the connected state. */
export function connect(socket: ClientSocket, timeoutMs = 3000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (socket.connected) return resolve();
    const timer: NodeJS.Timeout = setTimeout(() => reject(new Error('Socket connect timeout')), timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err: Error) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function stopSocketServer(): Promise<void> {
  const io: unknown = getIO();
  try {
    if (io) await (io as { close: () => Promise<void> }).close();
  } catch (_err: unknown) {
    // already closed
  }
  try {
    if (httpServer) await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
  } catch (_err: unknown) {
    // ignore
  }
  httpServer = null;
  port = null;
}

export default {
  startSocketServer,
  stopSocketServer,
  connectSocket,
  connect,
  waitFor,
  emitWithAck,
};
module.exports = {
  startSocketServer,
  stopSocketServer,
  connectSocket,
  connect,
  waitFor,
  emitWithAck,
};
