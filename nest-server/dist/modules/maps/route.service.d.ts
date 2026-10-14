import { GeoService } from './geo.service.js';
import { MapsClient, type RoutePoint } from './maps.client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
export interface ResolvedRoute {
    polyline: string;
    distanceM: number;
    durationS: number;
    cached: boolean;
}
export declare class RouteService {
    private readonly prisma;
    private readonly redis;
    private readonly maps;
    private readonly geo;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, maps: MapsClient, geo: GeoService);
    private fail;
    resolveRoute(waypoints: RoutePoint[], { languageCode }?: {
        languageCode?: string;
    }): Promise<ResolvedRoute>;
    buildWaypoints(trip: {
        originLat: unknown;
        originLng: unknown;
        destinationLat: unknown;
        destinationLng: unknown;
        stops?: {
            stopOrder: number;
            lat: unknown;
            lng: unknown;
            stopLat: unknown;
            stopLng: unknown;
        }[];
        bookings?: {
            pickupLat: unknown;
            pickupLng: unknown;
            pickupOrder: number | null;
            status: string;
        }[];
    }, { includePickups }?: {
        includePickups?: boolean;
    }): RoutePoint[];
    private geoDecodeSafe;
    buildNavigationLinks(waypoints: RoutePoint[]): {
        navigation_url: string;
        legs: string[];
    };
    computeTripRoute(tripId: string): Promise<{
        ok: boolean;
        routeVersion?: number;
        code?: string;
    }>;
    private rankPickups;
    compactActualPath(tripId: string, { occurrenceDate }?: {
        occurrenceDate?: string;
    }): Promise<{
        ok: boolean;
        points?: number;
        distanceM?: number;
        durationS?: number;
        reason?: string;
    }>;
}
