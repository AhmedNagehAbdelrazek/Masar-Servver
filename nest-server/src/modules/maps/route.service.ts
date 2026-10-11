import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { GeoService, type LatLng } from './geo.service.js';
import { MapsClient, type RoutePoint } from './maps.client.js';
import { getMapsConfig } from './maps.config.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';

export interface ResolvedRoute {
  polyline: string;
  distanceM: number;
  durationS: number;
  cached: boolean;
}

const WAYPOINT_LIMIT = 25;
const NAV_LINK_WAYPOINT_LIMIT = 9;

// Port of Main Server/Services/routeService.ts.
@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly maps: MapsClient,
    private readonly geo: GeoService,
  ) {}

  private fail(code: string, message: string): never {
    throw new UnprocessableEntityException({ message, code });
  }

  async resolveRoute(
    waypoints: RoutePoint[],
    { languageCode = 'ar' }: { languageCode?: string } = {},
  ): Promise<ResolvedRoute> {
    if (waypoints.length < 2) {
      this.fail('ORIGIN_DESTINATION_REQUIRED', 'ORIGIN_DESTINATION_REQUIRED');
    }
    const [origin, destination] = [waypoints[0], waypoints[waypoints.length - 1]] as [RoutePoint, RoutePoint];
    if (this.geo.haversineM([origin.lat, origin.lng], [destination.lat, destination.lng]) < 1000) {
      this.fail('ORIGIN_DESTINATION_TOO_CLOSE', 'ORIGIN_DESTINATION_TOO_CLOSE');
    }
    if (waypoints.length > WAYPOINT_LIMIT) {
      this.fail('TOO_MANY_WAYPOINTS', 'TOO_MANY_WAYPOINTS');
    }
    const hash = this.maps.routeHash(waypoints);
    const key = `route:${hash}`;
    try {
      const cached = await this.redis.getKey(key);
      if (cached) return { ...(JSON.parse(cached) as Omit<ResolvedRoute, 'cached'>), cached: true };
    } catch (err) {
      this.logger.warn(`route cache read failed: ${(err as Error).message}`);
    }
    const computed = await this.maps.computeRoutes({
      origin,
      destination,
      intermediates: waypoints.slice(1, -1),
      languageCode,
    });
    try {
      const ttl = getMapsConfig().routeCacheTtlSeconds;
      await this.redis.setKey(
        key,
        JSON.stringify({ polyline: computed.polyline, distanceM: computed.distanceM, durationS: computed.durationS }),
        ttl,
      );
    } catch (err) {
      this.logger.warn(`route cache write failed: ${(err as Error).message}`);
    }
    return { ...computed, cached: false };
  }

  buildWaypoints(
    trip: {
      originLat: unknown;
      originLng: unknown;
      destinationLat: unknown;
      destinationLng: unknown;
      stops?: { stopOrder: number; lat: unknown; lng: unknown; stopLat: unknown; stopLng: unknown }[];
      bookings?: {
        pickupLat: unknown;
        pickupLng: unknown;
        pickupOrder: number | null;
        status: string;
      }[];
    },
    { includePickups = true }: { includePickups?: boolean } = {},
  ): RoutePoint[] {
    const points: RoutePoint[] = [];
    if (trip.originLat != null && trip.originLng != null) {
      points.push({ lat: Number(trip.originLat), lng: Number(trip.originLng) });
    }
    for (const s of [...(trip.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder)) {
      const lat = s.lat ?? s.stopLat;
      const lng = s.lng ?? s.stopLng;
      if (lat != null && lng != null) points.push({ lat: Number(lat), lng: Number(lng) });
    }
    if (includePickups) {
      const pickups = (trip.bookings ?? []).filter(
        (b) => b.pickupLat != null && b.pickupLng != null && b.status === 'confirmed',
      );
      const route = this.geoDecodeSafe(points);
      pickups.sort((a, b) => {
        const pa: LatLng = [Number(a.pickupLat), Number(a.pickupLng)];
        const pb: LatLng = [Number(b.pickupLat), Number(b.pickupLng)];
        if (route.length >= 2) {
          return this.geo.alongRouteM(pa, route) - this.geo.alongRouteM(pb, route);
        }
        const o = points[0];
        if (!o) return 0;
        return (
          this.geo.haversineM([o.lat, o.lng], pa) - this.geo.haversineM([o.lat, o.lng], pb)
        );
      });
      for (const p of pickups) {
        points.push({ lat: Number(p.pickupLat), lng: Number(p.pickupLng) });
      }
    }
    if (trip.destinationLat != null && trip.destinationLng != null) {
      points.push({ lat: Number(trip.destinationLat), lng: Number(trip.destinationLng) });
    }
    return points;
  }

  private geoDecodeSafe(points: RoutePoint[]): LatLng[] {
    return points.map((p) => [p.lat, p.lng] as LatLng);
  }

  buildNavigationLinks(waypoints: RoutePoint[]): { navigation_url: string; legs: string[] } {
    const legs: string[] = [];
    for (let i = 0; i < waypoints.length; i += NAV_LINK_WAYPOINT_LIMIT) {
      const chunk = waypoints.slice(i, i + NAV_LINK_WAYPOINT_LIMIT + 1);
      if (chunk.length < 2) continue;
      const origin = chunk[0] as RoutePoint;
      const destination = chunk[chunk.length - 1] as RoutePoint;
      const middle = chunk
        .slice(1, -1)
        .map((p) => `${p.lat},${p.lng}`)
        .join('|');
      let url =
        `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}` +
        `&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      if (middle) url += `&waypoints=${middle}`;
      legs.push(url);
    }
    return { navigation_url: legs[0] ?? '', legs };
  }

  async computeTripRoute(tripId: string): Promise<{ ok: boolean; routeVersion?: number; code?: string }> {
    try {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: { stops: true, bookings: true },
      });
      if (!trip) return { ok: false, code: 'TRIP_NOT_FOUND' };
      const waypoints = this.buildWaypoints({
        originLat: trip.originLat,
        originLng: trip.originLng,
        destinationLat: trip.destinationLat,
        destinationLng: trip.destinationLng,
        stops: trip.stops as unknown as never,
        bookings: trip.bookings as unknown as never,
      });
      const resolved = await this.resolveRoute(waypoints);
      const updated = await this.prisma.trip.update({
        where: { id: tripId },
        data: {
          routePolyline: resolved.polyline,
          routeDistanceM: Math.round(resolved.distanceM),
          routeDurationS: Math.round(resolved.durationS),
          routeStatus: 'ready',
          routeComputedAt: new Date(),
          routeVersion: { increment: 1 },
        },
      });
      await this.rankPickups(tripId, resolved.polyline);
      return { ok: true, routeVersion: updated.routeVersion };
    } catch (err) {
      try {
        await this.prisma.trip.update({ where: { id: tripId }, data: { routeStatus: 'failed' } });
      } catch {
        // ignore
      }
      const code = (err as { code?: string })?.code ?? 'MAPS_UNAVAILABLE';
      this.logger.warn(`route compute failed for ${tripId}: ${code}`);
      return { ok: false, code };
    }
  }

  private async rankPickups(tripId: string, polylineEncoded: string): Promise<void> {
    try {
      const route = this.geo.decode(polylineEncoded);
      if (route.length < 2) return;
      const bookings = await this.prisma.booking.findMany({
        where: { tripId, status: 'confirmed' },
      });
      const ranked = bookings
        .filter((b) => b.pickupLat != null && b.pickupLng != null)
        .map((b) => ({
          id: b.id,
          along: this.geo.alongRouteM(
            [Number(b.pickupLat), Number(b.pickupLng)],
            route,
          ),
        }))
        .sort((a, b) => a.along - b.along);
      for (let i = 0; i < ranked.length; i++) {
        await this.prisma.booking.update({
          where: { id: (ranked[i] as { id: string }).id },
          data: { pickupOrder: i + 1 },
        });
      }
    } catch (err) {
      this.logger.warn(`pickup ranking failed: ${(err as Error).message}`);
    }
  }

  async compactActualPath(
    tripId: string,
    { occurrenceDate }: { occurrenceDate?: string } = {},
  ): Promise<{ ok: boolean; points?: number; distanceM?: number; durationS?: number; reason?: string }> {
    void occurrenceDate;
    const rows = await this.prisma.tripLocation.findMany({
      where: { tripId },
      orderBy: { createdAt: 'asc' },
    });
    // Dedupe identical consecutive points, then drop teleports (>83 m/s ≈
    // 300 km/h; TripLocation has no accuracy column).
    const filtered: { p: LatLng; at: Date }[] = [];
    for (const r of rows) {
      const p: LatLng = [Number(r.lat), Number(r.lng)];
      const prev = filtered[filtered.length - 1];
      if (prev && prev.p[0] === p[0] && prev.p[1] === p[1]) continue;
      if (prev) {
        const dtS = (new Date(r.createdAt).getTime() - prev.at.getTime()) / 1000;
        if (dtS > 0 && this.geo.haversineM(prev.p, p) / dtS > 83) continue;
      }
      filtered.push({ p, at: new Date(r.createdAt) });
    }
    if (filtered.length < 2) return { ok: false, reason: 'NOT_ENOUGH_POINTS' };
    const tolerance = getMapsConfig().actualPathSimplifyToleranceM;
    const simple = this.geo.simplify(
      filtered.map((f) => f.p),
      tolerance,
    );
    let distanceM = 0;
    for (let i = 1; i < simple.length; i++) {
      distanceM += this.geo.haversineM(simple[i - 1] as LatLng, simple[i] as LatLng);
    }
    const durationS = Math.round(
      (filtered[filtered.length - 1].at.getTime() - filtered[0].at.getTime()) / 1000,
    );
    await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        actualPathPolyline: this.geo.encode(simple),
        actualDistanceM: Math.round(distanceM),
        actualDurationS: durationS,
      },
    });
    return { ok: true, points: simple.length, distanceM: Math.round(distanceM), durationS };
  }
}
