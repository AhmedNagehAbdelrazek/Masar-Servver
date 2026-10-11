import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GeoService } from './geo.service.js';
import { getMapsConfig } from './maps.config.js';
import { RouteService } from './route.service.js';

export interface PickupCheck {
  accepted: boolean;
  distanceM: number;
  detourSeconds: number;
  reason: string | null;
  point: {
    lat: number;
    lng: number;
    label: string | null;
    pickupType: 'stop' | 'custom';
    pickupStopId: string | null;
  } | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Port of Main Server/Services/pickupService.ts. Rejections never throw
// (they return accepted:false); only bad trip/stop references throw.
@Injectable()
export class PickupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routes: RouteService,
    private readonly geo: GeoService,
  ) {}

  assertBookable(trip: { status: string }): void {
    if (!['published', 'full'].includes(trip.status)) {
      throw new ConflictException({ message: 'TRIP_NOT_BOOKABLE', code: 'TRIP_NOT_BOOKABLE' });
    }
  }

  async validatePickup(
    tripId: string,
    input: {
      pickup_type?: string;
      pickup_stop_id?: string | null;
      lat?: number | null;
      lng?: number | null;
      pickup_label?: string | null;
      label?: string | null;
    },
  ): Promise<PickupCheck> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { stops: true },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });

    const type = input.pickup_type ?? (input.pickup_stop_id ? 'stop' : 'custom');
    if (type === 'stop') {
      const stopId = input.pickup_stop_id;
      if (!stopId || !UUID_RE.test(stopId)) {
        throw new UnprocessableEntityException({
          message: 'PICKUP_STOP_ID_MUST_BE_A_VALID_UUID',
          code: 'VALIDATION_ERROR',
        });
      }
      const stop = (trip.stops as unknown as { id: string; stopName: string | null; city: string | null; lat: unknown; lng: unknown; stopLat: unknown; stopLng: unknown }[]).find(
        (s) => s.id === stopId,
      );
      if (!stop) {
        throw new ConflictException({
          message: 'PICKUP_POINT_NOT_ON_TRIP',
          code: 'PICKUP_POINT_NOT_ON_TRIP',
        });
      }
      const lat = stop.lat ?? stop.stopLat;
      const lng = stop.lng ?? stop.stopLng;
      return {
        accepted: true,
        distanceM: 0,
        detourSeconds: 0,
        reason: null,
        point: {
          lat: Number(lat),
          lng: Number(lng),
          label: stop.stopName ?? stop.city,
          pickupType: 'stop',
          pickupStopId: stopId,
        },
      };
    }

    if (input.lat == null || input.lng == null) {
      throw new UnprocessableEntityException({
        message: 'LAT_AND_LNG_ARE_REQUIRED',
        code: 'VALIDATION_ERROR',
      });
    }
    const lat = Number(input.lat);
    const lng = Number(input.lng);
    const label = input.pickup_label ?? input.label ?? null;

    const baseWaypoints = this.routes.buildWaypoints(
      {
        originLat: trip.originLat,
        originLng: trip.originLng,
        destinationLat: trip.destinationLat,
        destinationLng: trip.destinationLng,
        stops: trip.stops as unknown as never,
        bookings: [],
      },
      { includePickups: false },
    );
    let base;
    try {
      base = await this.routes.resolveRoute(baseWaypoints);
    } catch {
      // Routeless legacy trips auto-accept custom pickups.
      return {
        accepted: true,
        distanceM: 0,
        detourSeconds: 0,
        reason: null,
        point: { lat, lng, label, pickupType: 'custom', pickupStopId: null },
      };
    }

    const cfg = getMapsConfig();
    const distanceM = Math.round(
      this.geo.distanceFromRouteM([lat, lng], this.geo.decode(base.polyline)),
    );
    if (distanceM > cfg.pickupMaxDistanceFromRouteM) {
      return {
        accepted: false,
        distanceM,
        detourSeconds: 0,
        reason: 'PICKUP_TOO_FAR_FROM_ROUTE',
        point: { lat, lng, label, pickupType: 'custom', pickupStopId: null },
      };
    }

    // Insert at along-route rank and measure the detour.
    const route = this.geo.decode(base.polyline);
    const ordered = [...baseWaypoints].sort(
      (a, b) =>
        this.geo.alongRouteM([a.lat, a.lng], route) - this.geo.alongRouteM([b.lat, b.lng], route),
    );
    const pointAlong = this.geo.alongRouteM([lat, lng], route);
    let idx = ordered.findIndex(
      (w) => this.geo.alongRouteM([w.lat, w.lng], route) > pointAlong,
    );
    if (idx === -1) idx = ordered.length;
    const rerouted = [...ordered.slice(0, idx), { lat, lng }, ...ordered.slice(idx)];
    let detour = 0;
    try {
      const withRoute = await this.routes.resolveRoute(rerouted);
      detour = Math.max(0, withRoute.durationS - base.durationS);
    } catch {
      detour = 0;
    }
    if (detour > cfg.detourMaxSeconds) {
      return {
        accepted: false,
        distanceM,
        detourSeconds: detour,
        reason: 'PICKUP_DETOUR_TOO_LONG',
        point: { lat, lng, label, pickupType: 'custom', pickupStopId: null },
      };
    }
    return {
      accepted: true,
      distanceM,
      detourSeconds: detour,
      reason: null,
      point: { lat, lng, label, pickupType: 'custom', pickupStopId: null },
    };
  }
}
