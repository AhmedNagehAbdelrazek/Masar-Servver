const { SupportTicket, User } = require('../Models');
const { ROLES, TICKET_STATUS } = require('../config/constants');
const { ApiErrors } = require('../utils/ApiError');
const { ok, errorFromApiError } = require('../utils/socketAck');
const auditService = require('../Services/auditService');
const realtimeMetrics = require('../Services/realtimeMetrics');
const notificationService = require('../Services/notificationService');

const AGENT_ROLES = [ROLES.ADMIN, ROLES.SUPPORT, ROLES.MODERATOR];

/**
 * Admin/support live dashboard (Requirement 9). Agents join `support:{id}`
 * rooms on assignment; `role:admin` broadcasts (ticket_new, complaint_new,
 * sos_alert, driver_online) originate from the domain services.
 */
module.exports = (io, socket) => {
  const user = socket.data.user;
  if (!user || !AGENT_ROLES.includes(user.role)) return;

  socket.on('admin:ticket_assign', async (payload, ack) => {
    try {
      const ticket = await SupportTicket.findByPk(payload && payload.support_ticket_id);
      if (!ticket) throw ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');
      if (!payload || !payload.agent_id) throw ApiErrors.validation('AGENT_ID_IS_REQUIRED');

      await ticket.update({ assignedTo: payload.agent_id });
      socket.join(`support:${ticket.id}`);

      auditService.track({
        action: 'admin.ticket_assign',
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        resourceLabel: 'ticket_assign',
        actorId: user.id,
        payload: { agentId: payload.agent_id },
      });
      realtimeMetrics.recordEvent('admin:ticket_assign');

      if (ack) ack(ok({ support_ticket_id: ticket.id, assigned_to: payload.agent_id }));
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });

  socket.on('admin:ticket_resolve', async (payload, ack) => {
    try {
      const ticket = await SupportTicket.findByPk(payload && payload.support_ticket_id);
      if (!ticket) throw ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');

      await ticket.update({
        status: TICKET_STATUS.RESOLVED,
        resolutionNotes: (payload && payload.solution) || ticket.resolutionNotes,
      });

      const owner = await User.findByPk(ticket.userId, {
        attributes: ['id', 'fullName', 'locale'],
      });
      if (owner) {
        await notificationService.sendToUser(owner, 'TICKET_RESOLVED', {
          vars: { ticket: ticket.subject || 'support ticket' },
        });
      }

      auditService.track({
        action: 'admin.ticket_resolve',
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        resourceLabel: 'ticket_resolve',
        actorId: user.id,
      });
      realtimeMetrics.recordEvent('admin:ticket_resolve');

      if (ack) ack(ok({ support_ticket_id: ticket.id, status: TICKET_STATUS.RESOLVED }));
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });
};
