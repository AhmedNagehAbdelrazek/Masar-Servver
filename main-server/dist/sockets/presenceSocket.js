"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const presenceService_1 = __importDefault(require("../Services/presenceService"));
const socketAck_1 = require("../utils/socketAck");
const presenceSocket = (io, socket) => {
    const user = socket.data.user;
    if (!user)
        return;
    presenceService_1.default.markOnline(user.id, user.role).catch(() => { return undefined; });
    socket.on('presence:heartbeat', async (_payload, ack) => {
        try {
            await presenceService_1.default.markOnline(user.id, user.role);
            if (ack)
                ack((0, socketAck_1.ok)({ status: 'online' }));
        }
        catch (_err) {
            if (ack)
                ack((0, socketAck_1.ok)({ status: 'online' }));
        }
    });
    socket.on('disconnect', () => {
        presenceService_1.default.scheduleOffline(user.id, user.role);
    });
};
exports.default = presenceSocket;
module.exports = presenceSocket;
//# sourceMappingURL=presenceSocket.js.map