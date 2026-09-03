"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = send;
// @ts-nocheck
const Models_1 = require("../../../Models");
const realtimeService_1 = __importDefault(require("../../realtimeService"));
const realtimeMetrics_1 = __importDefault(require("../../realtimeMetrics"));
/**
 * In-app channel.
 *
 * Persists a Notification row (persistence-before-broadcast) and pushes
 * `notification:new` plus the refreshed `notification:count` badge to the
 * user's Socket.IO room (`user:{userId}`). Multi-device delivery is handled
 * by broadcasting to the room (all of the user's connected sockets).
 */
async function send(user, message, data = {}) {
    if (!user || !user.id)
        return null;
    const notification = await Models_1.Notification.create({
        userId: user.id,
        type: message.type,
        title: message.title,
        body: message.body,
        data,
        sentVia: ['in_app'],
    });
    const payload = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        reference_id: null,
        reference_type: null,
        created_at: notification.createdat
            ? notification.createdat.toISOString()
            : new Date().toISOString(),
        timestamp: Date.now(),
    };
    realtimeService_1.default.emitToUser(user.id, 'notification:new', payload);
    realtimeMetrics_1.default.recordEvent('notification:new');
    realtimeMetrics_1.default.recordDelivery();
    Models_1.Notification.count({ where: { userId: user.id, isRead: false } })
        .then((unreadCount) => {
        realtimeService_1.default.emitToUser(user.id, 'notification:count', {
            unread_count: unreadCount,
            timestamp: Date.now(),
        });
    })
        .catch(() => { });
    return notification;
}
module.exports = { send };
exports.default = module.exports;
//# sourceMappingURL=inApp.js.map