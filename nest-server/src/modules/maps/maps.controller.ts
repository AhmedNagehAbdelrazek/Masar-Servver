import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { resolveLocaleMode } from '../../common/utils/locale.js';
import { RedisService } from '../../redis/redis.service.js';
import { PickupPreviewDto, ReverseGeocodeDto, RoutePreviewDto, TripIdParam } from './dto/maps.dto.js';
import { MapsClient, type RoutePoint } from './maps.client.js';
import { PickupService } from './pickup.service.js';
import { RouteService } from './route.service.js';

function toPoint(src: unknown): RoutePoint | null {
  const o = src as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return null;
  const lat = Number(o.lat ?? o.stop_lat ?? o.latitude);
  const lng = Number(o.lng ?? o.stop_lng ?? o.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function langOf(req: Request): string {
  return resolveLocaleMode({
    query: req.query as Record<string, unknown>,
    headers: req.headers as Record<string, unknown>,
  }) === 'en'
    ? 'en'
    : 'ar';
}

// Express parity: Routes/mapsRoutes.ts + the trip pickup-preview route.
// Rate limit: 30 previews/min/user, fail-open when Redis is down.
@Controller()
export class MapsController {
  constructor(
    private readonly routes: RouteService,
    private readonly maps: MapsClient,
    private readonly pickup: PickupService,
    private readonly redis: RedisService,
  ) {}

  private async checkRateLimit(userId: string): Promise<void> {
    const key = `ratelimit:maps:${userId}`;
    try {
      const raw = await this.redis.getKey(key);
      const n = raw ? parseInt(raw, 10) : 0;
      if (n >= 30) {
        throw new HttpException({ message: 'RATE_LIMITED', code: 'RATE_LIMITED' }, 429);
      }
      await this.redis.setKey(key, String(n + 1), 60);
    } catch (err) {
      if ((err as { status?: number })?.status === 429) throw err;
      // fail open
    }
  }

  @Post('maps/route-preview')
  @HttpCode(200)
  @Roles('driver')
  async routePreview(
    @Body() dto: RoutePreviewDto,
    @Req() req: Request,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    await this.checkRateLimit(user?.id ?? '');
    const origin = toPoint(dto.origin) ?? toPoint({ lat: dto.origin_lat, lng: dto.origin_lng });
    const destination =
      toPoint(dto.destination) ?? toPoint({ lat: dto.destination_lat, lng: dto.destination_lng });
    const pts = [origin, ...(dto.stops ?? []).map(toPoint), destination].filter(
      (p): p is RoutePoint => p !== null,
    );
    const route = await this.routes.resolveRoute(pts, { languageCode: langOf(req) });
    const base = dto.departure_time ? new Date(dto.departure_time).getTime() : Date.now();
    return {
      polyline: route.polyline,
      distance_m: route.distanceM,
      duration_s: route.durationS,
      suggested_arrival: new Date(base + route.durationS * 1000).toISOString(),
      cached: route.cached,
    };
  }

  @Post('maps/reverse-geocode')
  @HttpCode(200)
  async reverseGeocode(
    @Body() dto: ReverseGeocodeDto,
    @Req() req: Request,
  ): Promise<{ city: string; area: string; label: string }> {
    return this.maps.reverseGeocode({ lat: dto.lat, lng: dto.lng, languageCode: langOf(req) });
  }

  @Post('trips/:trip_id/pickup-preview')
  @HttpCode(200)
  @Roles('passenger')
  async pickupPreview(
    @Param() params: TripIdParam,
    @Body() dto: PickupPreviewDto,
  ): Promise<{
    accepted: boolean;
    distance_from_route_m: number;
    detour_seconds: number;
    reason: string | null;
  }> {
    const out = await this.pickup.validatePickup(params.trip_id, {
      pickup_type: dto.pickup_type,
      pickup_stop_id: dto.pickup_stop_id,
      lat: dto.lat !== undefined ? Number(dto.lat) : null,
      lng: dto.lng !== undefined ? Number(dto.lng) : null,
      pickup_label: dto.pickup_label,
    });
    return {
      accepted: out.accepted,
      distance_from_route_m: out.distanceM,
      detour_seconds: out.detourSeconds,
      reason: out.reason,
    };
  }
}
