"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSocketServer = startSocketServer;
exports.connectSocket = connectSocket;
exports.waitFor = waitFor;
exports.emitWithAck = emitWithAck;
exports.connect = connect;
exports.stopSocketServer = stopSocketServer;
const http_1 = __importDefault(require("http"));
const socket_io_client_1 = require("socket.io-client");
const app_1 = __importDefault(require("../../app"));
const socketServer_1 = require("../../socketServer");
let httpServer = null;
let port = null;
/**
 * Boots an HTTP server with the realtime socket server attached on an
 * ephemeral port. Returns the port number.
 */
async function startSocketServer() {
    httpServer = http_1.default.createServer((0, app_1.default)());
    (0, socketServer_1.createSocketServer)(httpServer);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const addr = httpServer.address();
    port = addr.port;
    return port;
}
/**
 * Opens a socket.io-client connection authenticated with the given access
 * JWT. Returns the client socket (caller owns connect/disconnect lifecycle).
 */
function connectSocket(token, opts = {}) {
    const { query = {}, auth = {} } = opts;
    return (0, socket_io_client_1.io)(`http://127.0.0.1:${port}`, {
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
function waitFor(socket, event, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, onEvent);
            reject(new Error(`Timed out waiting for socket event "${event}"`));
        }, timeoutMs);
        function onEvent(payload) {
            clearTimeout(timer);
            socket.off(event, onEvent);
            resolve(payload);
        }
        socket.once(event, onEvent);
    });
}
/**
 * Emits `event` with `payload` and resolves with the ack response (rejects on
 * timeout when the server never acks).
 */
function emitWithAck(socket, event, payload, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timed out waiting for ack of socket event "${event}"`));
        }, timeoutMs);
        socket.emit(event, payload, (response) => {
            clearTimeout(timer);
            resolve(response);
        });
    });
}
/** Waits for the client socket to reach the connected state. */
function connect(socket, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        if (socket.connected)
            return resolve();
        const timer = setTimeout(() => reject(new Error('Socket connect timeout')), timeoutMs);
        socket.once('connect', () => {
            clearTimeout(timer);
            resolve();
        });
        socket.once('connect_error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
async function stopSocketServer() {
    const io = (0, socketServer_1.getIO)();
    try {
        if (io)
            await io.close();
    }
    catch (_err) {
        // already closed
    }
    try {
        if (httpServer)
            await new Promise((resolve) => httpServer.close(() => resolve()));
    }
    catch (_err) {
        // ignore
    }
    httpServer = null;
    port = null;
}
exports.default = {
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
//# sourceMappingURL=socket.js.map