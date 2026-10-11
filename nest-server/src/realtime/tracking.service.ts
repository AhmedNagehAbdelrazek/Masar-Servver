import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { GeoService } from '../modules/maps/geo.service.js';
import { getMapsConfig } from '../modules/maps/maps.config.js';
import { NotificationsService, type NotifyUser } from '../modules/notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RealtimeGateway } from './realtime.gateway.js';

export interface TrackingUser {
  id: string;
  role: string;
}

export interface LocationPayload {
  tripId?: string;
  trip_id?: string;
  lat?: number | string;
  lng?: number | string;
  speed?: number | string | null;
  heading?: number | string | null;
  accuracy?: number | string | null;
  recorded_at?: string | Date | null;
  recordedAt?: string | Date | null;
  occurrence_date?: string | null;
  occurrenceDate?: string | null;
  points?: LocationPayload[];
}

// Port of Main Server/Services/trackingService.ts. Trips open tracking rooms
// only while in_progress (ongoing does NOT); ETA is straight-line haversine
// (never a provider call); proximity alerts fire once per booking.
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly geo: GeoService,
    // forwardRef: NotificationsService <-> RealtimeGateway <-> TrackingService
    // form a cycle; an eager type here evaluates to undefined depending on
    // module evaluation order (broke specs that import TripsModule first).
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtime: RealtimeGateway,
  ) {}

  private async assertDriverOfActiveTrip(
    user: TrackingUser,
    tripId: string | undefined,
  ): Promise<{ id: string; status: string; driverId: string; destinationLat: unknown; destinationLng: unknown }> {
    if (!tripId) {
      throw new UnprocessableEntityException({ message: 'TRIP_ID_IS_REQUIRED', code: 'TRIP_ID_IS_REQUIRED' });
    }
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== user.id) {
      throw new ForbiddenException({
        message: 'ONLY_THE_TRIP_DRIVER_CAN_SHARE_TRACKING',
        code: 'FORBIDDEN',
      });
    }
    if (trip.status !== 'in_progress') {
      throw new ConflictException({
        message: 'TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS',
        code: 'TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS',
      });
    }
    return trip as unknown as {
      id: string;
      status: string;
      driverId: string;
      destinationLat: unknown;
      destinationLng: unknown;
    };
  }

  async isTripActive(tripId: string): Promise<boolean> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { status: true } });
    return trip?.status === 'in_progress';
  }

  async isTripMember(user: TrackingUser, tripId: string): Promise<boolean> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { driverId: true } });
    if (!trip) return false;
    if (trip.driverId === user.id) return true;
    const booking = await this.prisma.booking.findFirst({
      where: { tripId, passengerId: user.id, status: 'confirmed' },
    });
    return booking !== null;
  }

  async updateLocation(
    user: TrackingUser,
    payload: LocationPayload,
  ): Promise<Record<string, unknown>> {
    const tripId = payload.tripId ?? payload.trip_id ?? '';
    if (Array.isArray(payload.points)) {
      const cfg = getMapsConfig();
      const batch = payload.points.slice(0, cfg.trackingBatchMaxPoints);
      const kept: unknown[] = [];
      for (const p of batch) {
        try {
          const stored = await this.ingestPoint(user, { ...p, tripId: (p.tripId ?? p.trip_id ?? tripId) as string });
          if (stored) kept.push(stored);
        } catch {
          // skip invalid points in batch mode
        }
      }
      return { trip_id: tripId, received: batch.length, stored: kept.filter(Boolean).length };
    }
    return (await this.ingestPoint(user, payload)) as unknown as Record<string, unknown>;
  }

  private async ingestPoint(
    user: TrackingUser,
    payload: LocationPayload,
  ): Promise<Record<string, unknown> | null> {
    const tripId = (payload.tripId ?? payload.trip_id ?? '') as string;
    const trip = await this.assertDriverOfActiveTrip(user, tripId);
    if (payload.lat === undefined || payload.lng === undefined) {
      throw new UnprocessableEntityException({ message: 'LAT_AND_LNG_ARE_REQUIRED', code: 'LAT_AND_LNG_ARE_REQUIRED' });
    }
    const lat = Number(payload.lat);
    const lng = Number(payload.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new UnprocessableEntityException({
        message: 'LAT_AND_LNG_MUST_BE_NUMBERS',
        code: 'LAT_AND_LNG_MUST_BE_NUMBERS',
      });
    }
    const recordedRaw = payload.recorded_at ?? payload.recordedAt ?? null;
    if (recordedRaw) {
      const ageMs = Date.now() - new Date(recordedRaw).getTime();
      if (ageMs > getMapsConfig().trackingMaxPointAgeSeconds * 1000) {
        throw new UnprocessableEntityException({
          message: 'LOCATION_POINT_TOO_OLD',
          code: 'LOCATION_POINT_TOO_OLD',
        });
      }
    }
    const speed = payload.speed != null ? Number(payload.speed) : null;
    const heading = payload.heading != null ? Number(payload.heading) : null;
    const occurrenceDate =
      (payload.occurrence_date ?? payload.occurrenceDate ?? null) as string | null;

    const point = await this.prisma.tripLocation.create({
      data: {
        tripId,
        driverId: user.id,
        lat,
        lng,
        speed: Number.isFinite(speed as number) ? (speed as number) : null,
        heading: Number.isFinite(heading as number) ? (heading as number) : null,
        occurrenceDate: occurrenceDate ? new Date(occurrenceDate) : null,
      },
    });

    const out = await this.buildUpdate(tripId, trip, { lat, lng, speed });
    try {
      this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    } catch {
      // best-effort
    }
    try {
      await this.fanOut(tripId, { lat, lng, speed });
    } catch (err) {
      this.logger.warn(`tracking fanout failed: ${(err as Error).message}`);
    }
    void point;
    return out;
  }

  private async upcomingBookings(tripId: string): Promise<
    {
      id: string;
      pickupLat: unknown;
      pickupLng: unknown;
      pickupStatus: string;
      pickupLabel: string | null;
      pickupPlace: string | null;
      passenger: { id: string; fullName: string | null } | null;
    }[]
  > {
    const rows = await this.prisma.booking.findMany({
      where: { tripId, status: 'confirmed' },
      include: { passenger: { select: { id: true, fullName: true } } },
      orderBy: { pickupOrder: 'asc' },
    });
    return rows as unknown as never;
  }

  private async buildUpdate(
    tripId: string,
    trip: { destinationLat: unknown; destinationLng: unknown },
    pos: { lat: number; lng: number; speed: number | null },
  ): Promise<Record<string, unknown>> {
    const upcoming = await this.upcomingBookings(tripId);
    const pending = upcoming.filter((b) => !['picked_up', 'missed'].includes(b.pickupStatus));
    const next = pending[0] ?? null;
    let eta: number | null = null;
    if (next && next.pickupLat != null && next.pickupLng != null && (pos.speed ?? 0) > 0) {
      eta = Math.round(
        (this.geo.haversineKm([pos.lat, pos.lng], [Number(next.pickupLat), Number(next.pickupLng)]) /
          (pos.speed as number)) *
          60,
      );
    } else if (trip.destinationLat != null && trip.destinationLng != null && (pos.speed ?? 0) > 0) {
      eta = Math.round(
        (this.geo.haversineKm(
          [pos.lat, pos.lng],
          [Number(trip.destinationLat), Number(trip.destinationLng)],
        ) /
          (pos.speed as number)) *
          60,
      );
    }
    return {
      trip_id: tripId,
      driver_lat: pos.lat,
      driver_lng: pos.lng,
      eta_minutes: eta,
      status: 'en_route',
      timestamp: new Date().toISOString(),
    };
  }

  private async fanOut(
    tripId: string,
    pos: { lat: number; lng: number; speed: number | null },
  ): Promise<void> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return;
    const upcoming = await this.upcomingBookings(tripId);
    const pending = upcoming.filter((b) => !['picked_up', 'missed'].includes(b.pickupStatus));
    const next = pending[0] ?? null;

    if (next) {
      const distM =
        next.pickupLat != null && next.pickupLng != null
          ? Math.round(
              this.geo.haversineM([pos.lat, pos.lng], [Number(next.pickupLat), Number(next.pickupLng)]),
            )
          : null;
      try {
        this.realtime.emitToUser(trip.driverId, 'tracking:next_pickup', {
          trip_id: tripId,
          booking_id: next.id,
          label: next.pickupLabel ?? next.pickupPlace ?? null,
          distance_m: distM,
          eta_minutes: null,
          remaining_count: pending.length,
        });
      } catch {
        // best-effort
      }
    }

    for (const b of pending) {
      if (b.pickupLat == null || b.pickupLng == null || !b.passenger) continue;
      const distM = Math.round(
        this.geo.haversineM([pos.lat, pos.lng], [Number(b.pickupLat), Number(b.pickupLng)]),
      );
      const eta =
        (pos.speed ?? 0) > 0 ? Math.round(distM / 1000 / (pos.speed as number) * 60) : null;
      try {
        this.realtime.emitToUser(b.passenger.id, 'tracking:update', {
          trip_id: tripId,
          driver_lat: pos.lat,
          driver_lng: pos.lng,
          eta_minutes: eta,
          status: 'en_route',
          timestamp: new Date().toISOString(),
        });
      } catch {
        // best-effort
      }
      await this.proximity(tripId, b as unknown as { id: string; passenger: { id: string } }, distM);
    }
  }

  private async proximity(
    tripId: string,
    booking: { id: string; passenger: { id: string } },
    distM: number,
  ): Promise<void> {
    const cfg = getMapsConfig();
    await this.fireProximity(tripId, booking, 'near', cfg.proximityNearMeters, distM, 'DRIVER_NEARBY', {
      distance_m: distM,
    });
    await this.fireProximity(tripId, booking, 'arrived', cfg.proximityArrivedMeters, distM, 'DRIVER_ARRIVED', {});
  }

  private async fireProximity(
    tripId: string,
    booking: { id: string; passenger: { id: string } },
    kind: string,
    thresholdM: number,
    distM: number,
    template: string,
    vars: Record<string, unknown>,
  ): Promise<void> {
    if (distM > thresholdM) return;
    const key = `proximity:${booking.id}:${kind}`;
    try {
      if (await this.redis.getKey(key)) return;
      await this.redis.setKey(key, '1');
    } catch {
      // Redis offline: still notify (possibly twice)
    }
    try {
      this.realtime.emitToUser(booking.passenger.id, 'tracking:proximity', {
        trip_id: tripId,
        booking_id: booking.id,
        state: kind,
      });
    } catch {
      // best-effort
    }
    try {
      const passenger = await this.prisma.user.findUnique({ where: { id: booking.passenger.id } });
      if (passenger) {
        await this.notifications.sendToUser(
          passenger as unknown as Parameters<NotificationsService['sendToUser']>[0],
          template,
          { channels: ['in_app', 'push'], vars, data: { trip_id: tripId, booking_id: booking.id } },
        );
      }
    } catch (err) {
      this.logger.warn(`proximity notify failed: ${(err as Error).message}`);
    }
  }

  async startTracking(user: TrackingUser, tripId: string): Promise<Record<string, unknown>> {
    await this.assertDriverOfActiveTrip(user, tripId);
    const out = {
      trip_id: tripId,
      driver_lat: null,
      driver_lng: null,
      eta_minutes: null,
      status: 'en_route',
      timestamp: new Date().toISOString(),
    };
    try {
      this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    } catch {
      // best-effort
    }
    return out;
  }

  async stopTracking(user: TrackingUser, tripId: string): Promise<Record<string, unknown>> {
    await this.assertDriverOfActiveTrip(user, tripId);
    const out = {
      trip_id: tripId,
      driver_lat: null,
      driver_lng: null,
      eta_minutes: null,
      status: 'stopped',
      timestamp: new Date().toISOString(),
    };
    try {
      this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    } catch {
      // best-effort
    }
    return out;
  }

  async getLatest(tripId: string): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.tripLocation.findFirst({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return {
      trip_id: tripId,
      driver_lat: Number(row.lat),
      driver_lng: Number(row.lng),
      speed: row.speed != null ? Number(row.speed) : null,
      heading: row.heading != null ? Number(row.heading) : null,
      eta_minutes: null,
      timestamp: row.createdAt,
    };
  }

  async getHistory(
    tripId: string,
    { limit = 50, occurrenceDate }: { limit?: unknown; occurrenceDate?: string } = {},
  ): Promise<Record<string, unknown>[]> {
    const n = Math.min(500, Math.max(1, parseInt(String(limit ?? 50), 10) || 50));
    const rows = await this.prisma.tripLocation.findMany({
      where: {
        tripId,
        ...(occurrenceDate ? { occurrenceDate: new Date(occurrenceDate) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: n,
    });
    return rows.reverse().map((r) => ({
      trip_id: tripId,
      driver_lat: Number(r.lat),
      driver_lng: Number(r.lng),
      speed: r.speed != null ? Number(r.speed) : null,
      heading: r.heading != null ? Number(r.heading) : null,
      timestamp: r.createdAt,
    }));
  }
}
