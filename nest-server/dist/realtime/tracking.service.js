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
var TrackingService_1;
import { ConflictException, ForbiddenException, forwardRef, Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { GeoService } from '../modules/maps/geo.service.js';
import { getMapsConfig } from '../modules/maps/maps.config.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RealtimeGateway } from './realtime.gateway.js';
let TrackingService = TrackingService_1 = class TrackingService {
    prisma;
    redis;
    geo;
    notifications;
    realtime;
    logger = new Logger(TrackingService_1.name);
    constructor(prisma, redis, geo, notifications, realtime) {
        this.prisma = prisma;
        this.redis = redis;
        this.geo = geo;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    async assertDriverOfActiveTrip(user, tripId) {
        if (!tripId) {
            throw new UnprocessableEntityException({ message: 'TRIP_ID_IS_REQUIRED', code: 'TRIP_ID_IS_REQUIRED' });
        }
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
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
        return trip;
    }
    async isTripActive(tripId) {
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { status: true } });
        return trip?.status === 'in_progress';
    }
    async isTripMember(user, tripId) {
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { driverId: true } });
        if (!trip)
            return false;
        if (trip.driverId === user.id)
            return true;
        const booking = await this.prisma.booking.findFirst({
            where: { tripId, passengerId: user.id, status: 'confirmed' },
        });
        return booking !== null;
    }
    async updateLocation(user, payload) {
        const tripId = payload.tripId ?? payload.trip_id ?? '';
        if (Array.isArray(payload.points)) {
            const cfg = getMapsConfig();
            const batch = payload.points.slice(0, cfg.trackingBatchMaxPoints);
            const kept = [];
            for (const p of batch) {
                try {
                    const stored = await this.ingestPoint(user, { ...p, tripId: (p.tripId ?? p.trip_id ?? tripId) });
                    if (stored)
                        kept.push(stored);
                }
                catch {
                }
            }
            return { trip_id: tripId, received: batch.length, stored: kept.filter(Boolean).length };
        }
        return (await this.ingestPoint(user, payload));
    }
    async ingestPoint(user, payload) {
        const tripId = (payload.tripId ?? payload.trip_id ?? '');
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
        const occurrenceDate = (payload.occurrence_date ?? payload.occurrenceDate ?? null);
        const point = await this.prisma.tripLocation.create({
            data: {
                tripId,
                driverId: user.id,
                lat,
                lng,
                speed: Number.isFinite(speed) ? speed : null,
                heading: Number.isFinite(heading) ? heading : null,
                occurrenceDate: occurrenceDate ? new Date(occurrenceDate) : null,
            },
        });
        const out = await this.buildUpdate(tripId, trip, { lat, lng, speed });
        try {
            this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
        }
        catch {
        }
        try {
            await this.fanOut(tripId, { lat, lng, speed });
        }
        catch (err) {
            this.logger.warn(`tracking fanout failed: ${err.message}`);
        }
        void point;
        return out;
    }
    async upcomingBookings(tripId) {
        const rows = await this.prisma.booking.findMany({
            where: { tripId, status: 'confirmed' },
            include: { passenger: { select: { id: true, fullName: true } } },
            orderBy: { pickupOrder: 'asc' },
        });
        return rows;
    }
    async buildUpdate(tripId, trip, pos) {
        const upcoming = await this.upcomingBookings(tripId);
        const pending = upcoming.filter((b) => !['picked_up', 'missed'].includes(b.pickupStatus));
        const next = pending[0] ?? null;
        let eta = null;
        if (next && next.pickupLat != null && next.pickupLng != null && (pos.speed ?? 0) > 0) {
            eta = Math.round((this.geo.haversineKm([pos.lat, pos.lng], [Number(next.pickupLat), Number(next.pickupLng)]) /
                pos.speed) *
                60);
        }
        else if (trip.destinationLat != null && trip.destinationLng != null && (pos.speed ?? 0) > 0) {
            eta = Math.round((this.geo.haversineKm([pos.lat, pos.lng], [Number(trip.destinationLat), Number(trip.destinationLng)]) /
                pos.speed) *
                60);
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
    async fanOut(tripId, pos) {
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            return;
        const upcoming = await this.upcomingBookings(tripId);
        const pending = upcoming.filter((b) => !['picked_up', 'missed'].includes(b.pickupStatus));
        const next = pending[0] ?? null;
        if (next) {
            const distM = next.pickupLat != null && next.pickupLng != null
                ? Math.round(this.geo.haversineM([pos.lat, pos.lng], [Number(next.pickupLat), Number(next.pickupLng)]))
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
            }
            catch {
            }
        }
        for (const b of pending) {
            if (b.pickupLat == null || b.pickupLng == null || !b.passenger)
                continue;
            const distM = Math.round(this.geo.haversineM([pos.lat, pos.lng], [Number(b.pickupLat), Number(b.pickupLng)]));
            const eta = (pos.speed ?? 0) > 0 ? Math.round(distM / 1000 / pos.speed * 60) : null;
            try {
                this.realtime.emitToUser(b.passenger.id, 'tracking:update', {
                    trip_id: tripId,
                    driver_lat: pos.lat,
                    driver_lng: pos.lng,
                    eta_minutes: eta,
                    status: 'en_route',
                    timestamp: new Date().toISOString(),
                });
            }
            catch {
            }
            await this.proximity(tripId, b, distM);
        }
    }
    async proximity(tripId, booking, distM) {
        const cfg = getMapsConfig();
        await this.fireProximity(tripId, booking, 'near', cfg.proximityNearMeters, distM, 'DRIVER_NEARBY', {
            distance_m: distM,
        });
        await this.fireProximity(tripId, booking, 'arrived', cfg.proximityArrivedMeters, distM, 'DRIVER_ARRIVED', {});
    }
    async fireProximity(tripId, booking, kind, thresholdM, distM, template, vars) {
        if (distM > thresholdM)
            return;
        const key = `proximity:${booking.id}:${kind}`;
        try {
            if (await this.redis.getKey(key))
                return;
            await this.redis.setKey(key, '1');
        }
        catch {
        }
        try {
            this.realtime.emitToUser(booking.passenger.id, 'tracking:proximity', {
                trip_id: tripId,
                booking_id: booking.id,
                state: kind,
            });
        }
        catch {
        }
        try {
            const passenger = await this.prisma.user.findUnique({ where: { id: booking.passenger.id } });
            if (passenger) {
                await this.notifications.sendToUser(passenger, template, { channels: ['in_app', 'push'], vars, data: { trip_id: tripId, booking_id: booking.id } });
            }
        }
        catch (err) {
            this.logger.warn(`proximity notify failed: ${err.message}`);
        }
    }
    async startTracking(user, tripId) {
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
        }
        catch {
        }
        return out;
    }
    async stopTracking(user, tripId) {
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
        }
        catch {
        }
        return out;
    }
    async getLatest(tripId) {
        const row = await this.prisma.tripLocation.findFirst({
            where: { tripId },
            orderBy: { createdAt: 'desc' },
        });
        if (!row)
            return null;
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
    async getHistory(tripId, { limit = 50, occurrenceDate } = {}) {
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
};
TrackingService = TrackingService_1 = __decorate([
    Injectable(),
    __param(4, Inject(forwardRef(() => RealtimeGateway))),
    __metadata("design:paramtypes", [PrismaService,
        RedisService,
        GeoService,
        NotificationsService,
        RealtimeGateway])
], TrackingService);
export { TrackingService };
//# sourceMappingURL=tracking.service.js.map