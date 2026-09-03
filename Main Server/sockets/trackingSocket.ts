import { Server, Socket } from 'socket.io';
import trackingService from '../Services/trackingService';
import realtimeService from '../Services/realtimeService';
import realtimeMetrics from '../Services/realtimeMetrics';
import { checkRateLimit } from '../Services/socketRateLimiter';
import { ApiErrors } from '../utils/ApiError';
import { ok, errorFromApiError, rateLimited } from '../utils/socketAck';

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

interface TrackingPayload {
  trip_id?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  heading?: number;
}

const trackingSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user as { id: string; role: string };
  if (!user) return;

  socket.on('tracking:join', async (payload: TrackingPayload, ack?: (r: unknown) => void) => {
    try {
      const tripId: string | undefined = payload ? payload.trip_id : undefined;
      const member: boolean = await (realtimeService as unknown as { isTripMember: (u: unknown, id: string | undefined) => Promise<boolean> }).isTripMember(user, tripId);
      if (!member) throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP');
      socket.join(`trip:${tripId}`);
      if (ack) ack(ok({ room: `trip:${tripId}` }));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('tracking:start', async (payload: TrackingPayload, ack?: (r: unknown) => void) => {
    try {
      const result: unknown = await (trackingService as unknown as { startTracking: (u: unknown, id: string | undefined) => Promise<unknown> }).startTracking(user, payload ? payload.trip_id : undefined);
      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('tracking:location', async (payload: TrackingPayload, ack?: (r: unknown) => void) => {
    try {
      const rl = await checkRateLimit('tracking', 'location', user.id) as { allowed: boolean };
      if (!rl.allowed) {
        (realtimeMetrics as unknown as { recordRateLimited: () => void }).recordRateLimited();
        if (ack) ack(rateLimited());
        return;
      }
      const result: unknown = await (trackingService as unknown as { updateLocation: (u: unknown, o: unknown) => Promise<unknown> }).updateLocation(user, {
        tripId: payload ? payload.trip_id : undefined,
        lat: payload ? payload.lat : undefined,
        lng: payload ? payload.lng : undefined,
        speed: payload ? payload.speed : undefined,
        heading: payload ? payload.heading : undefined,
      });
      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('tracking:stop', async (payload: TrackingPayload, ack?: (r: unknown) => void) => {
    try {
      const result: unknown = await (trackingService as unknown as { stopTracking: (u: unknown, id: string | undefined) => Promise<unknown> }).stopTracking(user, payload ? payload.trip_id : undefined);
      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });
};

export default trackingSocket;
module.exports = trackingSocket;
