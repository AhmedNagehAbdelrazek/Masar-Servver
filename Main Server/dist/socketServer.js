"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketServer = createSocketServer;
exports.getIO = getIO;
exports.emitToUser = emitToUser;
exports.disconnectUserSockets = disconnectUserSockets;
const socket_io_1 = require("socket.io");
const socketAuth_1 = __importDefault(require("./middlewares/socketAuth"));
const realtimeService_1 = __importDefault(require("./Services/realtimeService"));
const realtimeMetrics_1 = __importDefault(require("./Services/realtimeMetrics"));
let ioInstance = null;
function createSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
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
    realtimeService_1.default.setIO(io);
    if (process.env.NODE_ENV !== 'test') {
        try {
            const { createAdapter } = require('@socket.io/redis-adapter');
            const { redis } = require('./config/redis');
            const pubClient = redis.duplicate({ keyPrefix: '' });
            const subClient = redis.duplicate({ keyPrefix: '' });
            io.adapter(createAdapter(pubClient, subClient));
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[socket] Redis adapter unavailable, using single-node:', msg);
        }
    }
    console.log('[socket] Redis adapter', process.env.NODE_ENV !== 'test' ? 'enabled' : 'disabled');
    io.use(socketAuth_1.default);
    io.on('connection_error', () => {
        realtimeMetrics_1.default.recordConnectionFailure();
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (!user)
            return;
        realtimeMetrics_1.default.recordConnection(user.id);
        realtimeMetrics_1.default.recordEvent('connection');
        if (socket.recovered || (socket.handshake.auth && socket.handshake.auth.reconnecting)) {
            realtimeMetrics_1.default.recordReconnect();
            realtimeMetrics_1.default.recordEvent('reconnect');
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
                require(mod)(io, socket);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[socket] failed to register ${mod}:`, msg);
            }
        }
        socket.on('disconnect', () => {
            realtimeMetrics_1.default.recordDisconnection(user.id);
            realtimeMetrics_1.default.recordEvent('disconnection');
        });
    });
    return io;
}
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
    return realtimeService_1.default.getIO();
}
function emitToUser(userId, event, data) {
    return realtimeService_1.default.emitToUser(userId, event, data);
}
exports.default = { createSocketServer, getIO, emitToUser, disconnectUserSockets };
module.exports = { createSocketServer, getIO, emitToUser, disconnectUserSockets };
//# sourceMappingURL=socketServer.js.map