import { Server, Socket } from 'socket.io';
import messageService from '../Services/messageService';
import realtimeService from '../Services/realtimeService';
import realtimeMetrics from '../Services/realtimeMetrics';
import presenceService from '../Services/presenceService';
import { checkRateLimit } from '../Services/socketRateLimiter';
import { ApiErrors } from '../utils/ApiError';
import { ok, errorFromApiError, rateLimited } from '../utils/socketAck';

const TYPING_THROTTLE_MS = 1500;

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

interface JoinPayload {
  booking_id?: string;
  support_ticket_id?: string;
}

interface SendPayload {
  booking_id?: string;
  support_ticket_id?: string;
  message?: string;
  message_type?: string;
}

interface TypingPayload {
  booking_id?: string;
  support_ticket_id?: string;
  is_typing?: boolean;
}

interface ReadPayload {
  message_id?: string;
  booking_id?: string;
  support_ticket_id?: string;
}

const chatSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user as { id: string; role: string };
  const typingLast = new Map<string, number>();

  socket.on('chat:join', async (payload: JoinPayload, ack?: (r: unknown) => void) => {
    try {
      const { booking_id, support_ticket_id } = payload || {};
      if (booking_id) {
        await (messageService as unknown as { assertBookingChatOpen: (u: unknown, id: string) => Promise<void> }).assertBookingChatOpen(user, booking_id);
        socket.join(`booking:${booking_id}`);
        (presenceService as unknown as { getStatus: (id: string) => Promise<string> }).getStatus(user.id)
          .then((status: string) => {
            socket.to(`booking:${booking_id}`).emit('presence:status', {
              user_id: user.id,
              status,
              last_seen: new Date().toISOString(),
              timestamp: Date.now(),
            });
          })
          .catch(() => { return undefined; });
        if (ack) ack(ok({ room: `booking:${booking_id}` }));
        return;
      }
      if (support_ticket_id) {
        const member = await (realtimeService as unknown as { isTicketMember: (u: unknown, id: string) => Promise<boolean> }).isTicketMember(user, support_ticket_id);
        if (!member) throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        socket.join(`support:${support_ticket_id}`);
        if (ack) ack(ok({ room: `support:${support_ticket_id}` }));
        return;
      }
      throw ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('chat:leave', (payload: JoinPayload, ack?: (r: unknown) => void) => {
    const { booking_id, support_ticket_id } = payload || {};
    if (booking_id) socket.leave(`booking:${booking_id}`);
    if (support_ticket_id) socket.leave(`support:${support_ticket_id}`);
    if (ack) ack(ok({ left: true }));
  });

  socket.on('chat:send', async (payload: SendPayload, ack?: (r: unknown) => void) => {
    try {
      const rl = await checkRateLimit('chat', 'chat', user.id) as { allowed: boolean };
      if (!rl.allowed) {
        (realtimeMetrics as unknown as { recordRateLimited: () => void }).recordRateLimited();
        if (ack) ack(rateLimited());
        return;
      }

      const { booking_id, support_ticket_id, message, message_type } = payload || {};
      let result: unknown;
      if (booking_id) {
        result = await (messageService as unknown as { sendBookingMessage: (u: unknown, o: unknown) => Promise<unknown> }).sendBookingMessage(user, {
          bookingId: booking_id,
          message,
          messageType: message_type,
        });
      } else if (support_ticket_id) {
        result = await (messageService as unknown as { sendSupportMessage: (u: unknown, o: unknown) => Promise<unknown> }).sendSupportMessage(user, {
          supportTicketId: support_ticket_id,
          message,
        });
      } else {
        throw ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
      }

      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('chat:typing', async (payload: TypingPayload, ack?: (r: unknown) => void) => {
    const { booking_id, support_ticket_id, is_typing } = payload || {};
    let room: string | null = null;
    try {
      if (booking_id) {
        await (messageService as unknown as { assertBookingChatOpen: (u: unknown, id: string) => Promise<void> }).assertBookingChatOpen(user, booking_id);
        room = `booking:${booking_id}`;
      } else if (support_ticket_id) {
        const member = await (realtimeService as unknown as { isTicketMember: (u: unknown, id: string) => Promise<boolean> }).isTicketMember(user, support_ticket_id);
        if (!member) throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        room = `support:${support_ticket_id}`;
      } else {
        throw ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
      }
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
      return;
    }

    const now: number = Date.now();
    const last: number = typingLast.get(user.id) || 0;
    typingLast.set(user.id, now);
    if (now - last < TYPING_THROTTLE_MS) {
      if (ack) ack(ok({ throttled: true }));
      return;
    }

    socket.to(room as string).emit('chat:typing', {
      sender_id: user.id,
      is_typing: Boolean(is_typing),
      timestamp: now,
    });
    (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('chat:typing');
    if (ack) ack(ok({ throttled: false }));
  });

  socket.on('chat:read', async (payload: ReadPayload, ack?: (r: unknown) => void) => {
    try {
      const rl = await checkRateLimit('chat', 'read', user.id) as { allowed: boolean };
      if (!rl.allowed) {
        (realtimeMetrics as unknown as { recordRateLimited: () => void }).recordRateLimited();
        if (ack) ack(rateLimited());
        return;
      }
      const result = await (messageService as unknown as { markRead: (u: unknown, o: unknown) => Promise<unknown> }).markRead(user, {
        messageId: payload ? payload.message_id : undefined,
        bookingId: payload ? payload.booking_id : undefined,
        supportTicketId: payload ? payload.support_ticket_id : undefined,
      });
      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });
};

export default chatSocket;
module.exports = chatSocket;
