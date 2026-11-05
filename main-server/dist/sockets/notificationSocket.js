"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notificationService_1 = __importDefault(require("../Services/notificationService"));
const realtimeMetrics_1 = __importDefault(require("../Services/realtimeMetrics"));
const socketAck_1 = require("../utils/socketAck");
const notificationSocket = (io, socket) => {
    const user = socket.data.user;
    if (!user)
        return;
    const pushCount = async () => {
        const count = await notificationService_1.default.countUnread(user.id);
        socket.emit('notification:count', { unread_count: count, timestamp: Date.now() });
        return count;
    };
    pushCount().catch(() => { return undefined; });
    socket.on('notification:read', async (payload, ack) => {
        try {
            const result = await notificationService_1.default.markRead(user.id, payload && payload.notification_id);
            await pushCount();
            realtimeMetrics_1.default.recordEvent('notification:read');
            if (ack)
                ack((0, socketAck_1.ok)({ notification_id: result.id }));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('notification:read_all', async (_payload, ack) => {
        try {
            const result = await notificationService_1.default.markAllRead(user.id);
            await pushCount();
            realtimeMetrics_1.default.recordEvent('notification:read_all');
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
};
exports.default = notificationSocket;
module.exports = notificationSocket;
//# sourceMappingURL=notificationSocket.js.map