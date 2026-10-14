import { GeoService } from '../modules/maps/geo.service.js';
import type { NotificationsService } from '../modules/notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { RealtimeGateway } from './realtime.gateway.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';
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
export declare class TrackingService {
    private readonly prisma;
    private readonly redis;
    private readonly geo;
    private readonly notifications;
    private readonly realtime;
    private readonly metrics;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, geo: GeoService, notifications: NotificationsService, realtime: RealtimeGateway, metrics: RealtimeMetricsService);
    private assertDriverOfActiveTrip;
    isTripActive(tripId: string): Promise<boolean>;
    isTripMember(user: TrackingUser, tripId: string): Promise<boolean>;
    updateLocation(user: TrackingUser, payload: LocationPayload): Promise<Record<string, unknown>>;
    private ingestPoint;
    private upcomingBookings;
    private buildUpdate;
    private fanOut;
    private proximity;
    private fireProximity;
    startTracking(user: TrackingUser, tripId: string): Promise<Record<string, unknown>>;
    stopTracking(user: TrackingUser, tripId: string): Promise<Record<string, unknown>>;
    getLatest(tripId: string): Promise<Record<string, unknown> | null>;
    getHistory(tripId: string, { limit, occurrenceDate }?: {
        limit?: unknown;
        occurrenceDate?: string;
    }): Promise<Record<string, unknown>[]>;
}
