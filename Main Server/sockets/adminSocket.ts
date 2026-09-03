import { Server, Socket } from 'socket.io';
import { SupportTicket, User } from '../Models';
import { ROLES, TICKET_STATUS } from '../config/constants';
import { ApiErrors } from '../utils/ApiError';
import { ok, errorFromApiError } from '../utils/socketAck';
import auditService from '../Services/auditService';
import realtimeMetrics from '../Services/realtimeMetrics';
import notificationService from '../Services/notificationService';

const AGENT_ROLES: string[] = [ROLES.ADMIN, ROLES.SUPPORT, ROLES.MODERATOR];

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

interface TicketAssignPayload {
  support_ticket_id?: string;
  agent_id?: string;
}

interface TicketResolvePayload {
  support_ticket_id?: string;
  solution?: string;
}

const adminSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user;
  if (!user || !AGENT_ROLES.includes(user.role)) return;

  socket.on('admin:ticket_assign', async (payload: TicketAssignPayload, ack?: (r: unknown) => void) => {
    try {
      const ticket = await (SupportTicket as unknown as { findByPk: (id: string) => Promise<{ id: string; update: (d: Record<string, unknown>) => Promise<void> } | null> }).findByPk(payload && payload.support_ticket_id ? String(payload.support_ticket_id) : '');
      if (!ticket) throw ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');
      if (!payload || !payload.agent_id) throw ApiErrors.validation('AGENT_ID_IS_REQUIRED');

      await ticket.update({ assignedTo: payload.agent_id });
      socket.join(`support:${ticket.id}`);

      (auditService as unknown as { track: (p: Record<string, unknown>) => void }).track({
        action: 'admin.ticket_assign',
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        resourceLabel: 'ticket_assign',
        actorId: user.id,
        payload: { agentId: payload.agent_id },
      });
      (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('admin:ticket_assign');

      if (ack) ack(ok({ support_ticket_id: ticket.id, assigned_to: payload.agent_id }));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('admin:ticket_resolve', async (payload: TicketResolvePayload, ack?: (r: unknown) => void) => {
    try {
      const ticket = await (SupportTicket as unknown as { findByPk: (id: string) => Promise<{ id: string; userId: string; subject: string | null; resolutionNotes: string | null; update: (d: Record<string, unknown>) => Promise<void> } | null> }).findByPk(payload && payload.support_ticket_id ? String(payload.support_ticket_id) : '');
      if (!ticket) throw ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');

      await ticket.update({
        status: TICKET_STATUS.RESOLVED,
        resolutionNotes: (payload && payload.solution) || ticket.resolutionNotes,
      });

      const owner = await (User as unknown as { findByPk: (id: string, opts: unknown) => Promise<{ id: string; fullName: string; locale: string } | null> }).findByPk(ticket.userId, {
        attributes: ['id', 'fullName', 'locale'],
      });
      if (owner) {
        await (notificationService as unknown as { sendToUser: (u: unknown, t: string, o: unknown) => Promise<void> }).sendToUser(owner, 'TICKET_RESOLVED', {
          vars: { ticket: ticket.subject || 'support ticket' },
        });
      }

      (auditService as unknown as { track: (p: Record<string, unknown>) => void }).track({
        action: 'admin.ticket_resolve',
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        resourceLabel: 'ticket_resolve',
        actorId: user.id,
      });
      (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('admin:ticket_resolve');

      if (ack) ack(ok({ support_ticket_id: ticket.id, status: TICKET_STATUS.RESOLVED }));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });
};

export default adminSocket;
module.exports = adminSocket;
