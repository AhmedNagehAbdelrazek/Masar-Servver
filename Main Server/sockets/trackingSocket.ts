import { Server, Socket } from 'socket.io';
import trackingService from '../Services/trackingService';
import realtimeService from '../Services/realtimeService';
import realtimeMetrics from '../Services/realtimeMetrics';
import { checkRateLimit } from '../Services/socketRateLimiter';
import { ApiErrors } from '../utils/ApiError';
import { TRIP_STATUS } from '../config/constants';
import { Trip } from '../Models';
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
  accuracy?: number;
  recorded_at?: string;
  occurrence_date?: string;
  points?: Array<Record<string, unknown>>;
}

const trackingSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user as { id: string; role: string };
  if (!user) return;

  socket.on('tracking:join', async (payload: TrackingPayload, ack?: (r: unknown) => void) => {
    try {
      const tripId: string | undefined = payload ? payload.trip_id : undefined;
      const member: boolean = await (realtimeService as unknown as { isTripMember: (u: unknown, id: string | undefined) => Promise<boolean> }).isTripMember(user, tripId);
      if (!member) throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP');
      // spec 013 (O6/X2): live rooms exist for in_progress trips only — even
      // members are refused once the trip completes or is cancelled.
      const trip = await Trip.findByPk(tripId as string, { attributes: ['status'] });
      if (!trip || trip.status !== TRIP_STATUS.IN_PROGRESS) {
        throw ApiErrors.conflict('TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS');
      }
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
        accuracy: payload ? payload.accuracy : undefined,
        recorded_at: payload ? payload.recorded_at : undefined,
        occurrence_date: payload ? payload.occurrence_date : undefined,
        points: payload ? payload.points : undefined,
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
