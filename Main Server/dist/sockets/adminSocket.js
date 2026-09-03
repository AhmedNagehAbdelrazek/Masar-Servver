"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const ApiError_1 = require("../utils/ApiError");
const socketAck_1 = require("../utils/socketAck");
const auditService_1 = __importDefault(require("../Services/auditService"));
const realtimeMetrics_1 = __importDefault(require("../Services/realtimeMetrics"));
const notificationService_1 = __importDefault(require("../Services/notificationService"));
const AGENT_ROLES = [constants_1.ROLES.ADMIN, constants_1.ROLES.SUPPORT, constants_1.ROLES.MODERATOR];
const adminSocket = (io, socket) => {
    const user = socket.data.user;
    if (!user || !AGENT_ROLES.includes(user.role))
        return;
    socket.on('admin:ticket_assign', async (payload, ack) => {
        try {
            const ticket = await Models_1.SupportTicket.findByPk(payload && payload.support_ticket_id ? String(payload.support_ticket_id) : '');
            if (!ticket)
                throw ApiError_1.ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');
            if (!payload || !payload.agent_id)
                throw ApiError_1.ApiErrors.validation('AGENT_ID_IS_REQUIRED');
            await ticket.update({ assignedTo: payload.agent_id });
            socket.join(`support:${ticket.id}`);
            auditService_1.default.track({
                action: 'admin.ticket_assign',
                resourceType: 'support_ticket',
                resourceId: ticket.id,
                resourceLabel: 'ticket_assign',
                actorId: user.id,
                payload: { agentId: payload.agent_id },
            });
            realtimeMetrics_1.default.recordEvent('admin:ticket_assign');
            if (ack)
                ack((0, socketAck_1.ok)({ support_ticket_id: ticket.id, assigned_to: payload.agent_id }));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('admin:ticket_resolve', async (payload, ack) => {
        try {
            const ticket = await Models_1.SupportTicket.findByPk(payload && payload.support_ticket_id ? String(payload.support_ticket_id) : '');
            if (!ticket)
                throw ApiError_1.ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');
            await ticket.update({
                status: constants_1.TICKET_STATUS.RESOLVED,
                resolutionNotes: (payload && payload.solution) || ticket.resolutionNotes,
            });
            const owner = await Models_1.User.findByPk(ticket.userId, {
                attributes: ['id', 'fullName', 'locale'],
            });
            if (owner) {
                await notificationService_1.default.sendToUser(owner, 'TICKET_RESOLVED', {
                    vars: { ticket: ticket.subject || 'support ticket' },
                });
            }
            auditService_1.default.track({
                action: 'admin.ticket_resolve',
                resourceType: 'support_ticket',
                resourceId: ticket.id,
                resourceLabel: 'ticket_resolve',
                actorId: user.id,
            });
            realtimeMetrics_1.default.recordEvent('admin:ticket_resolve');
            if (ack)
                ack((0, socketAck_1.ok)({ support_ticket_id: ticket.id, status: constants_1.TICKET_STATUS.RESOLVED }));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
};
exports.default = adminSocket;
module.exports = adminSocket;
//# sourceMappingURL=adminSocket.js.map