"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sosService_1 = __importDefault(require("../Services/sosService"));
const realtimeMetrics_1 = __importDefault(require("../Services/realtimeMetrics"));
const socketRateLimiter_1 = require("../Services/socketRateLimiter");
const socketAck_1 = require("../utils/socketAck");
const sosSocket = (io, socket) => {
    const user = socket.data.user;
    if (!user)
        return;
    socket.on('sos:trigger', async (payload, ack) => {
        try {
            const active = await sosService_1.default.findActiveForUser(user.id);
            if (active) {
                if (ack)
                    ack((0, socketAck_1.ok)({ sos_event_id: active.id, reused: true }));
                return;
            }
            const rl = await (0, socketRateLimiter_1.checkRateLimit)('sos', 'sos', user.id);
            if (!rl.allowed) {
                realtimeMetrics_1.default.recordRateLimited();
                if (ack)
                    ack((0, socketAck_1.rateLimited)());
                return;
            }
            const result = await sosService_1.default.trigger(user, {
                tripId: payload ? payload.trip_id : undefined,
                lat: payload ? payload.lat : undefined,
                lng: payload ? payload.lng : undefined,
                urgency: payload ? payload.urgency : undefined,
            });
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
};
exports.default = sosSocket;
module.exports = sosSocket;
//# sourceMappingURL=sosSocket.js.map