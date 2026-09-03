"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRead = exports.listNotifications = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const pagination_1 = require("../utils/pagination");
const notificationService = __importStar(require("../Services/notificationService"));
const auditService = __importStar(require("../Services/auditService"));
const listNotifications = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { page, limit } = (0, pagination_1.parsePagination)(req.query);
    let unread = null;
    const { unread: unreadQuery } = req.query;
    if (unreadQuery === 'true')
        unread = true;
    else if (unreadQuery === 'false')
        unread = false;
    const { rows, count } = await notificationService.listForUser(String(authReq.user?.id), { unread, page, limit });
    const data = rows.map((n) => ({
        id: n['id'],
        type: n['type'],
        title: n['title'],
        body: n['body'],
        data: n['data'],
        is_read: n['isRead'],
        created_at: n['createdat'] || n['createdAt'],
    }));
    (0, httpResponse_1.successResponse)(res, { data, pagination: (0, pagination_1.buildPagination)(count, page, limit) });
});
exports.listNotifications = listNotifications;
const markRead = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { notification_id } = req.params;
    const notification = await notificationService.markRead(String(authReq.user?.id), notification_id);
    auditService.markResource(res, { type: 'notification', id: notification['id'] });
    (0, httpResponse_1.successResponse)(res, { notification: { id: notification['id'], is_read: notification['isRead'] } });
});
exports.markRead = markRead;
exports.default = { listNotifications, markRead };
//# sourceMappingURL=notificationController.js.map