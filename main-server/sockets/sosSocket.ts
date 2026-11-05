import { Server, Socket } from 'socket.io';
import sosService from '../Services/sosService';
import realtimeMetrics from '../Services/realtimeMetrics';
import { checkRateLimit } from '../Services/socketRateLimiter';
import { ok, errorFromApiError, rateLimited } from '../utils/socketAck';

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

interface SosPayload {
  trip_id?: string;
  lat?: number;
  lng?: number;
  urgency?: string;
}

const sosSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user as { id: string; role: string };
  if (!user) return;

  socket.on('sos:trigger', async (payload: SosPayload, ack?: (r: unknown) => void) => {
    try {
      const active = await (sosService as unknown as { findActiveForUser: (id: string) => Promise<{ id: string } | null> }).findActiveForUser(user.id);
      if (active) {
        if (ack) ack(ok({ sos_event_id: active.id, reused: true }));
        return;
      }

      const rl = await checkRateLimit('sos', 'sos', user.id) as { allowed: boolean };
      if (!rl.allowed) {
        (realtimeMetrics as unknown as { recordRateLimited: () => void }).recordRateLimited();
        if (ack) ack(rateLimited());
        return;
      }

      const result = await (sosService as unknown as { trigger: (u: unknown, o: unknown) => Promise<unknown> }).trigger(user, {
        tripId: payload ? payload.trip_id : undefined,
        lat: payload ? payload.lat : undefined,
        lng: payload ? payload.lng : undefined,
        urgency: payload ? payload.urgency : undefined,
      });
      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });
};

export default sosSocket;
module.exports = sosSocket;
