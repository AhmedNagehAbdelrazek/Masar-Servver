import type { Request } from 'express';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RedisService } from '../../redis/redis.service.js';
import { PickupPreviewDto, ReverseGeocodeDto, RoutePreviewDto, TripIdParam } from './dto/maps.dto.js';
import { MapsClient } from './maps.client.js';
import { PickupService } from './pickup.service.js';
import { RouteService } from './route.service.js';
export declare class MapsController {
    private readonly routes;
    private readonly maps;
    private readonly pickup;
    private readonly redis;
    constructor(routes: RouteService, maps: MapsClient, pickup: PickupService, redis: RedisService);
    private checkRateLimit;
    routePreview(dto: RoutePreviewDto, req: Request, user?: AuthUser): Promise<Record<string, unknown>>;
    reverseGeocode(dto: ReverseGeocodeDto, req: Request): Promise<{
        city: string;
        area: string;
        label: string;
    }>;
    pickupPreview(params: TripIdParam, dto: PickupPreviewDto): Promise<{
        accepted: boolean;
        distance_from_route_m: number;
        detour_seconds: number;
        reason: string | null;
    }>;
}
