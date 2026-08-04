const messageService = require('../Services/messageService');
const realtimeService = require('../Services/realtimeService');
const realtimeMetrics = require('../Services/realtimeMetrics');
const presenceService = require('../Services/presenceService');
const { checkRateLimit } = require('../Services/socketRateLimiter');
const { ApiErrors } = require('../utils/ApiError');
const { ok, errorFromApiError, rateLimited } = require('../utils/socketAck');

const TYPING_THROTTLE_MS = 1500;

/**
 * Trip + support chat (Requirements 1–3). Rooms: `trip:{tripId}` and
 * `support:{supportTicketId}`. Membership is validated both on join and on
 * every send (defense-in-depth).
 */
module.exports = (io, socket) => {
  const user = socket.data.user;
  const typingLast = new Map();

  socket.on('chat:join', async (payload, ack) => {
    try {
      const { trip_id, support_ticket_id } = payload || {};
      if (trip_id) {
        const member = await realtimeService.isTripMember(user, trip_id);
        if (!member) throw ApiErrors.forbidden('You are not a member of this trip');
        socket.join(`trip:${trip_id}`);
        presenceService
          .getStatus(user.id)
          .then((status) => {
            socket.to(`trip:${trip_id}`).emit('presence:status', {
              user_id: user.id,
              status,
              last_seen: new Date().toISOString(),
              timestamp: Date.now(),
            });
          })
          .catch(() => {});
        return ack ? ack(ok({ room: `trip:${trip_id}` })) : undefined;
      }
      if (support_ticket_id) {
        const member = await realtimeService.isTicketMember(user, support_ticket_id);
        if (!member) throw ApiErrors.forbidden('You are not a member of this support ticket');
        socket.join(`support:${support_ticket_id}`);
        return ack ? ack(ok({ room: `support:${support_ticket_id}` })) : undefined;
      }
      throw ApiErrors.validation('Provide trip_id or support_ticket_id');
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });

  socket.on('chat:leave', (payload, ack) => {
    const { trip_id, support_ticket_id } = payload || {};
    if (trip_id) socket.leave(`trip:${trip_id}`);
    if (support_ticket_id) socket.leave(`support:${support_ticket_id}`);
    if (ack) ack(ok({ left: true }));
  });

  socket.on('chat:send', async (payload, ack) => {
    try {
      const rl = await checkRateLimit('chat', 'chat', user.id);
      if (!rl.allowed) {
        realtimeMetrics.recordRateLimited();
        return ack ? ack(rateLimited()) : undefined;
      }

      const { trip_id, support_ticket_id, message, message_type } = payload || {};
      const result = trip_id
        ? await messageService.sendTripMessage(user, {
            tripId: trip_id,
            message,
            messageType: message_type,
          })
        : support_ticket_id
          ? await messageService.sendSupportMessage(user, {
              supportTicketId: support_ticket_id,
              message,
            })
          : (() => {
              throw ApiErrors.validation('Provide trip_id or support_ticket_id');
            })();

      return ack ? ack(ok(result)) : undefined;
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });

  socket.on('chat:typing', (payload, ack) => {
    const { trip_id, support_ticket_id, is_typing } = payload || {};
    const room = trip_id ? `trip:${trip_id}` : support_ticket_id ? `support:${support_ticket_id}` : null;
    if (!room) {
      if (ack) ack(errorFromApiError(ApiErrors.validation('Provide trip_id or support_ticket_id')));
      return;
    }

    const now = Date.now();
    const last = typingLast.get(user.id) || 0;
    typingLast.set(user.id, now);
    if (now - last < TYPING_THROTTLE_MS) {
      if (ack) ack(ok({ throttled: true }));
      return;
    }

    socket.to(room).emit('chat:typing', {
      sender_id: user.id,
      is_typing: !!is_typing,
      timestamp: now,
    });
    realtimeMetrics.recordEvent('chat:typing');
    if (ack) ack(ok({ throttled: false }));
  });

  socket.on('chat:read', async (payload, ack) => {
    try {
      const rl = await checkRateLimit('chat', 'read', user.id);
      if (!rl.allowed) {
        realtimeMetrics.recordRateLimited();
        return ack ? ack(rateLimited()) : undefined;
      }
      const result = await messageService.markRead(user, {
        messageId: payload ? payload.message_id : undefined,
        tripId: payload ? payload.trip_id : undefined,
        supportTicketId: payload ? payload.support_ticket_id : undefined,
      });
      return ack ? ack(ok(result)) : undefined;
    } catch (err) {
      if (ack) ack(errorFromApiError(err));
    }
  });
};
