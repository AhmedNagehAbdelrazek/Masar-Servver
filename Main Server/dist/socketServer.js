"use strict";
const { Server } = require('socket.io');
const socketAuth = require('./middlewares/socketAuth');
const realtimeService = require('./Services/realtimeService');
const realtimeMetrics = require('./Services/realtimeMetrics');
let ioInstance = null;
/**
 * Creates the Socket.IO server, wires JWT auth, the Redis pub/sub adapter
 * (for multi-instance scale-out) and registers all realtime socket modules.
 *
 * Every connection must authenticate with an `access` JWT
 * (socket.handshake.auth.token). Unauthenticated sockets are rejected at the
 * handshake before any event handlers run.
 */
function createSocketServer(httpServer) {
    const io = new Server(httpServer, {
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
    realtimeService.setIO(io);
    // Redis pub/sub adapter for multi-instance delivery. Skipped in test where
    // the redis client is mocked and has no pub/sub methods.
    if (process.env.NODE_ENV !== 'test') {
        try {
            const { createAdapter } = require('@socket.io/redis-adapter');
            const { redis } = require('./config/redis');
            const pubClient = redis.duplicate({ keyPrefix: '' });
            const subClient = redis.duplicate({ keyPrefix: '' });
            io.adapter(createAdapter(pubClient, subClient));
        }
        catch (err) {
            console.warn('[socket] Redis adapter unavailable, using single-node:', err.message);
        }
    }
    console.log("[socket] Redis adapter", process.env.NODE_ENV !== 'test' ? 'enabled' : 'disabled');
    io.use(socketAuth);
    io.on('connection_error', () => {
        realtimeMetrics.recordConnectionFailure();
    });
    io.on('connection', (socket) => {
        const { user } = socket.data;
        if (!user)
            return;
        realtimeMetrics.recordConnection(user.id);
        realtimeMetrics.recordEvent('connection');
        if (socket.recovered || (socket.handshake.auth && socket.handshake.auth.reconnecting)) {
            realtimeMetrics.recordReconnect();
            realtimeMetrics.recordEvent('reconnect');
        }
        socket.join(`user:${user.id}`);
        socket.join(`role:${user.role}`);
        socket.data.connectedAt = Date.now();
        // Register per-connection socket modules (lazy require so a broken module
        // cannot take the whole connection down).
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
                require(mod)(io, socket);
            }
            catch (err) {
                console.error(`[socket] failed to register ${mod}:`, err.message);
            }
        }
        socket.on('disconnect', () => {
            realtimeMetrics.recordDisconnection(user.id);
            realtimeMetrics.recordEvent('disconnection');
        });
    });
    return io;
}
/**
 * Force-disconnects every socket belonging to the given user. Used on logout
 * and when an enforcement action (suspension/ban) takes effect.
 */
function disconnectUserSockets(userId) {
    if (!ioInstance || !userId)
        return;
    const sockets = ioInstance.sockets.sockets;
    for (const [, socket] of sockets) {
        if (socket.data.user && socket.data.user.id === userId) {
            try {
                socket.emit('force_disconnect', { reason: 'SESSION_TERMINATED' });
            }
            catch (_err) {
                // ignore
            }
            socket.disconnect(true);
        }
    }
}
function getIO() {
    return realtimeService.getIO();
}
function emitToUser(userId, event, data) {
    return realtimeService.emitToUser(userId, event, data);
}
module.exports = { createSocketServer, getIO, emitToUser, disconnectUserSockets };
//# sourceMappingURL=socketServer.js.map