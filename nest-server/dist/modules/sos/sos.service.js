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
import { ConflictException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
const ACTIVE_SOS_STATUSES = ['pending', 'acknowledged'];
const ACTIVE_TRIP_STATUSES = ['in_progress', 'ongoing'];
export const RE_ALERT_INTERVAL_MS = 60 * 1000;
export const ESCALATION_AFTER_MS = 5 * 60 * 1000;
const SOS_STATUSES = ['pending', 'acknowledged', 'resolved', 'cancelled'];
function serialize(event, user = null) {
    return {
        id: event.id,
        user_id: event.userId,
        user_name: user ? user.fullName : null,
        trip_id: event.tripId,
        booking_id: event.bookingId || null,
        lat: Number(event.lat),
        lng: Number(event.lng),
        urgency: event.urgency,
        escalation_level: event.escalationLevel,
        status: event.status,
        triggered_at: event.createdAt ? event.createdAt.toISOString() : null,
    };
}
function validationError(message) {
    return new UnprocessableEntityException({ message, code: 'VALIDATION_FAILED' });
}
let SosService = class SosService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async isTripMember(user, tripId) {
        if (!user?.id || !tripId)
            return false;
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { id: true, driverId: true },
        });
        if (!trip)
            return false;
        if (trip.driverId === user.id)
            return true;
        const booking = await this.prisma.booking.findFirst({
            where: { tripId, passengerId: user.id, status: 'confirmed' },
            select: { id: true },
        });
        return !!booking;
    }
    async findActiveForUser(userId) {
        return this.prisma.sosEvent.findFirst({
            where: { userId, status: { in: [...ACTIVE_SOS_STATUSES] } },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });
    }
    async alertPayload(event) {
        const user = await this.prisma.user.findUnique({
            where: { id: event.userId },
            select: { id: true, fullName: true },
        });
        let driverLat = null;
        let driverLng = null;
        try {
            const last = await this.prisma.tripLocation.findFirst({
                where: { tripId: event.tripId },
                orderBy: { createdAt: 'desc' },
                select: { lat: true, lng: true },
            });
            if (last) {
                driverLat = Number(last.lat);
                driverLng = Number(last.lng);
            }
        }
        catch {
        }
        return {
            sos_event_id: event.id,
            user_id: event.userId,
            user_name: user ? user.fullName : null,
            trip_id: event.tripId,
            lat: Number(event.lat),
            lng: Number(event.lng),
            driver_lat: driverLat,
            driver_lng: driverLng,
            urgency: event.urgency,
            escalation_level: event.escalationLevel,
            triggered_at: event.createdAt ? event.createdAt.toISOString() : null,
            timestamp: Date.now(),
        };
    }
    async trigger(user, input) {
        const { tripId, lat, lng, urgency = 'high' } = input ?? {};
        if (!tripId)
            throw validationError('TRIP_ID_IS_REQUIRED_FOR_SOS');
        if (lat === undefined || lng === undefined) {
            throw validationError('LAT_AND_LNG_ARE_REQUIRED');
        }
        const member = await this.isTripMember(user, tripId);
        if (!member) {
            throw new ForbiddenException({ message: 'YOU_ARE_NOT_A_PARTICIPANT_OF_THIS_TRIP', code: 'FORBIDDEN' });
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { id: true, status: true },
        });
        if (!trip)
            throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
        if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) {
            throw new ConflictException({ message: 'SOS_IS_ONLY_AVAILABLE_DURING_AN_ACTIVE_TRIP', code: 'SOS_IS_ONLY_AVAILABLE_DURING_AN_ACTIVE_TRIP' });
        }
        const active = await this.findActiveForUser(user.id);
        if (active) {
            return { sos_event_id: active.id, reused: true };
        }
        const event = await this.prisma.sosEvent.create({
            data: {
                userId: user.id,
                tripId,
                lat,
                lng,
                urgency,
                status: 'pending',
                escalationLevel: 0,
                lastAlertAt: new Date(),
            },
        });
        const payloadOut = await this.alertPayload(event);
        this.realtime.emitToUser(user.id, 'sos:ack', {
            status: 'received',
            sos_event_id: event.id,
            assigned_support_id: null,
            timestamp: Date.now(),
        });
        this.realtime.emitToRole('admin', 'sos:alert', payloadOut);
        this.realtime.emitToRole('admin', 'admin:sos_alert', payloadOut);
        return { sos_event_id: event.id, reused: false };
    }
    async listAdmin(_actor, input) {
        const where = {};
        if (input.status && SOS_STATUSES.includes(input.status.toLowerCase())) {
            where.status = input.status.toLowerCase();
        }
        const { page: p, limit: l, offset } = parsePagination(input);
        const [rows, count] = await Promise.all([
            this.prisma.sosEvent.findMany({
                where,
                include: { user: { select: { id: true, fullName: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: l,
            }),
            this.prisma.sosEvent.count({ where }),
        ]);
        return {
            data: rows.map((r) => serialize(r, r.user ?? null)),
            pagination: buildPagination(count, p, l),
        };
    }
    async acknowledge(actor, sosId) {
        const event = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } }));
        if (!event)
            throw new NotFoundException({ message: 'SOS_EVENT_NOT_FOUND', code: 'SOS_EVENT_NOT_FOUND' });
        if (event.status === 'resolved' || event.status === 'cancelled') {
            throw new ConflictException({ message: 'SOS_EVENT_IS_ALREADY_CLOSED', code: 'SOS_EVENT_IS_ALREADY_CLOSED' });
        }
        if (event.status !== 'acknowledged') {
            await this.prisma.sosEvent.update({
                where: { id: sosId },
                data: { status: 'acknowledged', acknowledgedBy: actor.id, acknowledgedAt: new Date() },
            });
        }
        const updated = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } }));
        return { sos_event: serialize(updated) };
    }
    async resolve(actor, sosId, resolutionNote) {
        const event = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } }));
        if (!event)
            throw new NotFoundException({ message: 'SOS_EVENT_NOT_FOUND', code: 'SOS_EVENT_NOT_FOUND' });
        if (event.status === 'resolved' || event.status === 'cancelled') {
            throw new ConflictException({ message: 'SOS_EVENT_IS_ALREADY_CLOSED', code: 'SOS_EVENT_IS_ALREADY_CLOSED' });
        }
        const resolvedAt = new Date();
        await this.prisma.sosEvent.update({
            where: { id: sosId },
            data: {
                status: 'resolved',
                resolvedBy: actor.id,
                resolutionNote: resolutionNote || null,
                resolvedAt,
            },
        });
        const out = {
            sos_event_id: event.id,
            resolution: resolutionNote || 'Resolved',
            resolved_by: actor.id,
            resolved_at: resolvedAt.toISOString(),
            timestamp: Date.now(),
        };
        this.realtime.emitToUser(event.userId, 'sos:resolved', out);
        this.realtime.emitToRole('admin', 'sos:resolved', out);
        const updated = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } }));
        return { sos_event: serialize(updated) };
    }
    async runEscalation() {
        const now = Date.now();
        const events = (await this.prisma.sosEvent.findMany({
            where: { status: { in: [...ACTIVE_SOS_STATUSES] } },
        }));
        let alerted = 0;
        let escalated = 0;
        for (const event of events) {
            const createdAt = event.createdAt ? new Date(event.createdAt).getTime() : now;
            const updates = {};
            if (event.escalationLevel === 0 && now - createdAt >= ESCALATION_AFTER_MS) {
                updates.escalationLevel = 1;
                escalated += 1;
            }
            const lastAlert = event.lastAlertAt ? new Date(event.lastAlertAt).getTime() : 0;
            if (now - lastAlert >= RE_ALERT_INTERVAL_MS) {
                updates.lastAlertAt = new Date();
                alerted += 1;
            }
            if (Object.keys(updates).length > 0) {
                await this.prisma.sosEvent.update({ where: { id: event.id }, data: updates });
            }
            if (now - lastAlert >= RE_ALERT_INTERVAL_MS || event.escalationLevel === 1) {
                const payloadOut = await this.alertPayload(event);
                this.realtime.emitToRole('admin', 'sos:alert', payloadOut);
                this.realtime.emitToRole('admin', 'admin:sos_alert', payloadOut);
            }
        }
        return { alerted, escalated };
    }
};
SosService = __decorate([
    Injectable(),
    __param(1, Inject(forwardRef(() => RealtimeGateway))),
    __metadata("design:paramtypes", [PrismaService,
        RealtimeGateway])
], SosService);
export { SosService };
//# sourceMappingURL=sos.service.js.map