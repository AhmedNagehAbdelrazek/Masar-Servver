var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, HttpCode, HttpException, Param, Post, Req, } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { resolveLocaleMode } from '../../common/utils/locale.js';
import { RedisService } from '../../redis/redis.service.js';
import { PickupPreviewDto, ReverseGeocodeDto, RoutePreviewDto, TripIdParam } from './dto/maps.dto.js';
import { MapsClient } from './maps.client.js';
import { PickupService } from './pickup.service.js';
import { RouteService } from './route.service.js';
function toPoint(src) {
    const o = src;
    if (!o || typeof o !== 'object')
        return null;
    const lat = Number(o.lat ?? o.stop_lat ?? o.latitude);
    const lng = Number(o.lng ?? o.stop_lng ?? o.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return null;
    return { lat, lng };
}
function langOf(req) {
    return resolveLocaleMode({
        query: req.query,
        headers: req.headers,
    }) === 'en'
        ? 'en'
        : 'ar';
}
let MapsController = class MapsController {
    routes;
    maps;
    pickup;
    redis;
    constructor(routes, maps, pickup, redis) {
        this.routes = routes;
        this.maps = maps;
        this.pickup = pickup;
        this.redis = redis;
    }
    async checkRateLimit(userId) {
        const key = `ratelimit:maps:${userId}`;
        try {
            const raw = await this.redis.getKey(key);
            const n = raw ? parseInt(raw, 10) : 0;
            if (n >= 30) {
                throw new HttpException({ message: 'RATE_LIMITED', code: 'RATE_LIMITED' }, 429);
            }
            await this.redis.setKey(key, String(n + 1), 60);
        }
        catch (err) {
            if (err?.status === 429)
                throw err;
        }
    }
    async routePreview(dto, req, user) {
        await this.checkRateLimit(user?.id ?? '');
        const origin = toPoint(dto.origin) ?? toPoint({ lat: dto.origin_lat, lng: dto.origin_lng });
        const destination = toPoint(dto.destination) ?? toPoint({ lat: dto.destination_lat, lng: dto.destination_lng });
        const pts = [origin, ...(dto.stops ?? []).map(toPoint), destination].filter((p) => p !== null);
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
    async reverseGeocode(dto, req) {
        return this.maps.reverseGeocode({ lat: dto.lat, lng: dto.lng, languageCode: langOf(req) });
    }
    async pickupPreview(params, dto) {
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
};
__decorate([
    Post('maps/route-preview'),
    HttpCode(200),
    Roles('driver'),
    __param(0, Body()),
    __param(1, Req()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RoutePreviewDto, Object, Object]),
    __metadata("design:returntype", Promise)
], MapsController.prototype, "routePreview", null);
__decorate([
    Post('maps/reverse-geocode'),
    HttpCode(200),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReverseGeocodeDto, Object]),
    __metadata("design:returntype", Promise)
], MapsController.prototype, "reverseGeocode", null);
__decorate([
    Post('trips/:trip_id/pickup-preview'),
    HttpCode(200),
    Roles('passenger'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam,
        PickupPreviewDto]),
    __metadata("design:returntype", Promise)
], MapsController.prototype, "pickupPreview", null);
MapsController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [RouteService,
        MapsClient,
        PickupService,
        RedisService])
], MapsController);
export { MapsController };
//# sourceMappingURL=maps.controller.js.map