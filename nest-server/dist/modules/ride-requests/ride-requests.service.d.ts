import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RedisService } from '../../redis/redis.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
export declare class RideRequestsService {
    private readonly prisma;
    private readonly notifications;
    private readonly home;
    private readonly redis;
    private readonly realtime;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService, home: HomeService, redis: RedisService, realtime: RealtimeGateway);
    expireStale(): Promise<void>;
    private computeExpiresAt;
    createRideRequest(userId: string, payload: {
        origin_city: string;
        destination_city: string;
        origin_place?: string;
        destination_place?: string;
        origin_lat?: string | number;
        origin_lng?: string | number;
        origin_time?: string;
        destination_lat?: string | number;
        destination_lng?: string | number;
        arrival_deadline?: string;
        seats_needed?: number;
        max_budget?: string | number;
        attributes_preferred?: unknown;
        note?: string;
    }): Promise<Record<string, unknown>>;
    listRequests(user: {
        id: string;
        role: string;
    }, filters?: {
        status?: string;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getRequest(user: {
        id: string;
        role: string;
    }, requestId: string): Promise<{
        ride_request: Record<string, unknown>;
    }>;
    updateRideRequest(userId: string, requestId: string, payload: {
        action?: string;
        origin_place?: string;
        origin_city?: string;
        origin_time?: string;
        destination_city?: string;
        arrival_deadline?: string;
        seats_needed?: number;
        max_budget?: string | number;
        attributes_preferred?: unknown;
        note?: string;
    }): Promise<{
        ride_request: Record<string, unknown>;
    }>;
    submitOffer(driverId: string, requestId: string, payload: {
        trip_id?: string | null;
        offered_fare?: string | number | null;
        message?: string | null;
    }): Promise<Record<string, unknown>>;
    listOffersForRequest(userId: string, requestId: string): Promise<{
        data: Record<string, unknown>[];
    }>;
    listDriverOffers(driverId: string, filters?: {
        status?: string;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    decideOffer(passengerId: string, offerId: string, action: string): Promise<Record<string, unknown>>;
    agreeOfferPrice(passengerId: string, offerId: string, agreedFare: string | number): Promise<Record<string, unknown>>;
    attachOfferToTrip(driverId: string, tripId: string, offerId: string, payload?: {
        dropoff_place?: string | null;
        dropoff_deadline?: string | null;
    }): Promise<{
        booking: Record<string, unknown>;
        offer: Record<string, unknown>;
    }>;
    private uniqueBookingCode;
    getMatches(user: {
        id: string;
        role: string;
    }, requestId: string): Promise<{
        ride_request_id: string;
        matches: Record<string, unknown>[];
    }>;
}
