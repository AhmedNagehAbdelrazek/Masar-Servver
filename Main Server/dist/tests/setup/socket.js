"use strict";
const http = require('http');
const { io: ioc } = require('socket.io-client');
const createApp = require('../../app');
const { createSocketServer, getIO } = require('../../socketServer');
let httpServer;
let port;
/**
 * Boots an HTTP server with the realtime socket server attached on an
 * ephemeral port. Returns the port number.
 */
async function startSocketServer() {
    httpServer = http.createServer(createApp());
    createSocketServer(httpServer);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;
    return port;
}
/**
 * Opens a socket.io-client connection authenticated with the given access
 * JWT. Returns the client socket (caller owns connect/disconnect lifecycle).
 */
function connectSocket(token, opts = {}) {
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
    const io = getIO();
    try {
        if (io)
            await io.close();
    }
    catch (_err) {
        // already closed
    }
    try {
        if (httpServer)
            await new Promise((resolve) => httpServer.close(resolve));
    }
    catch (_err) {
        // ignore
    }
    httpServer = null;
    port = null;
}
module.exports = {
    startSocketServer,
    stopSocketServer,
    connectSocket,
    connect,
    waitFor,
    emitWithAck,
};
//# sourceMappingURL=socket.js.map