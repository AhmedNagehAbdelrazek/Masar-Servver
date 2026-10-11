var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GeoService } from './geo.service.js';
import { getMapsConfig } from './maps.config.js';
import { RouteService } from './route.service.js';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let PickupService = class PickupService {
    prisma;
    routes;
    geo;
    constructor(prisma, routes, geo) {
        this.prisma = prisma;
        this.routes = routes;
        this.geo = geo;
    }
    assertBookable(trip) {
        if (!['published', 'full'].includes(trip.status)) {
            throw new ConflictException({ message: 'TRIP_NOT_BOOKABLE', code: 'TRIP_NOT_BOOKABLE' });
        }
    }
    async validatePickup(tripId, input) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: { stops: true },
        });
        if (!trip)
            throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
        const type = input.pickup_type ?? (input.pickup_stop_id ? 'stop' : 'custom');
        if (type === 'stop') {
            const stopId = input.pickup_stop_id;
            if (!stopId || !UUID_RE.test(stopId)) {
                throw new UnprocessableEntityException({
                    message: 'PICKUP_STOP_ID_MUST_BE_A_VALID_UUID',
                    code: 'VALIDATION_ERROR',
                });
            }
            const stop = trip.stops.find((s) => s.id === stopId);
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
        const baseWaypoints = this.routes.buildWaypoints({
            originLat: trip.originLat,
            originLng: trip.originLng,
            destinationLat: trip.destinationLat,
            destinationLng: trip.destinationLng,
            stops: trip.stops,
            bookings: [],
        }, { includePickups: false });
        let base;
        try {
            base = await this.routes.resolveRoute(baseWaypoints);
        }
        catch {
            return {
                accepted: true,
                distanceM: 0,
                detourSeconds: 0,
                reason: null,
                point: { lat, lng, label, pickupType: 'custom', pickupStopId: null },
            };
        }
        const cfg = getMapsConfig();
        const distanceM = Math.round(this.geo.distanceFromRouteM([lat, lng], this.geo.decode(base.polyline)));
        if (distanceM > cfg.pickupMaxDistanceFromRouteM) {
            return {
                accepted: false,
                distanceM,
                detourSeconds: 0,
                reason: 'PICKUP_TOO_FAR_FROM_ROUTE',
                point: { lat, lng, label, pickupType: 'custom', pickupStopId: null },
            };
        }
        const route = this.geo.decode(base.polyline);
        const ordered = [...baseWaypoints].sort((a, b) => this.geo.alongRouteM([a.lat, a.lng], route) - this.geo.alongRouteM([b.lat, b.lng], route));
        const pointAlong = this.geo.alongRouteM([lat, lng], route);
        let idx = ordered.findIndex((w) => this.geo.alongRouteM([w.lat, w.lng], route) > pointAlong);
        if (idx === -1)
            idx = ordered.length;
        const rerouted = [...ordered.slice(0, idx), { lat, lng }, ...ordered.slice(idx)];
        let detour = 0;
        try {
            const withRoute = await this.routes.resolveRoute(rerouted);
            detour = Math.max(0, withRoute.durationS - base.durationS);
        }
        catch {
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
};
PickupService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        RouteService,
        GeoService])
], PickupService);
export { PickupService };
//# sourceMappingURL=pickup.service.js.map