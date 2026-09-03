"use strict";
const notificationService = require('../Services/notificationService');
const realtimeMetrics = require('../Services/realtimeMetrics');
const { ok, errorFromApiError } = require('../utils/socketAck');
/**
 * Real-time notifications + unread badge (Requirement 5). On connect the
 * server pushes the current unread count so reconnecting devices sync
 * immediately; mark-read flows re-emit `notification:count`.
 */
module.exports = (io, socket) => {
    const user = socket.data.user;
    if (!user)
        return;
    const pushCount = async () => {
        const count = await notificationService.countUnread(user.id);
        socket.emit('notification:count', { unread_count: count, timestamp: Date.now() });
        return count;
    };
    pushCount().catch(() => { });
    socket.on('notification:read', async (payload, ack) => {
        try {
            const result = await notificationService.markRead(user.id, payload && payload.notification_id);
            await pushCount();
            realtimeMetrics.recordEvent('notification:read');
            if (ack)
                ack(ok({ notification_id: result.id }));
        }
        catch (err) {
            if (ack)
                ack(errorFromApiError(err));
        }
    });
    socket.on('notification:read_all', async (payload, ack) => {
        try {
            const result = await notificationService.markAllRead(user.id);
            await pushCount();
            realtimeMetrics.recordEvent('notification:read_all');
            if (ack)
                ack(ok(result));
        }
        catch (err) {
            if (ack)
                ack(errorFromApiError(err));
        }
    });
};
//# sourceMappingURL=notificationSocket.js.map