"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trackingService_1 = __importDefault(require("../Services/trackingService"));
const realtimeService_1 = __importDefault(require("../Services/realtimeService"));
const realtimeMetrics_1 = __importDefault(require("../Services/realtimeMetrics"));
const socketRateLimiter_1 = require("../Services/socketRateLimiter");
const ApiError_1 = require("../utils/ApiError");
const socketAck_1 = require("../utils/socketAck");
const trackingSocket = (io, socket) => {
    const user = socket.data.user;
    if (!user)
        return;
    socket.on('tracking:join', async (payload, ack) => {
        try {
            const tripId = payload ? payload.trip_id : undefined;
            const member = await realtimeService_1.default.isTripMember(user, tripId);
            if (!member)
                throw ApiError_1.ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP');
            socket.join(`trip:${tripId}`);
            if (ack)
                ack((0, socketAck_1.ok)({ room: `trip:${tripId}` }));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('tracking:start', async (payload, ack) => {
        try {
            const result = await trackingService_1.default.startTracking(user, payload ? payload.trip_id : undefined);
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('tracking:location', async (payload, ack) => {
        try {
            const rl = await (0, socketRateLimiter_1.checkRateLimit)('tracking', 'location', user.id);
            if (!rl.allowed) {
                realtimeMetrics_1.default.recordRateLimited();
                if (ack)
                    ack((0, socketAck_1.rateLimited)());
                return;
            }
            const result = await trackingService_1.default.updateLocation(user, {
                tripId: payload ? payload.trip_id : undefined,
                lat: payload ? payload.lat : undefined,
                lng: payload ? payload.lng : undefined,
                speed: payload ? payload.speed : undefined,
                heading: payload ? payload.heading : undefined,
            });
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('tracking:stop', async (payload, ack) => {
        try {
            const result = await trackingService_1.default.stopTracking(user, payload ? payload.trip_id : undefined);
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
};
exports.default = trackingSocket;
module.exports = trackingSocket;
//# sourceMappingURL=trackingSocket.js.map