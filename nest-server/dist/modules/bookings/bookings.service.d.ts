import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RedisService } from '../../redis/redis.service.js';
import { PickupService } from '../maps/pickup.service.js';
import { RouteService } from '../maps/route.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { TripExpiryService } from '../trips/trip-expiry.service.js';
export declare class BookingsService {
    private readonly prisma;
    private readonly redis;
    private readonly pickup;
    private readonly routes;
    private readonly notifications;
    private readonly home;
    private readonly realtime;
    private readonly expiry;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, pickup: PickupService, routes: RouteService, notifications: NotificationsService, home: HomeService, realtime: RealtimeGateway, expiry: TripExpiryService);
    private serializeListRow;
    private serializeDetail;
    private serializePassengerDetail;
    listForDriver(driverId: string, filters?: {
        status?: string;
        date_from?: string;
        date_to?: string;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getForDriver(driverId: string, bookingId: string): Promise<{
        booking: Record<string, unknown>;
    }>;
    private uniqueBookingCode;
    private extractNameLatLng;
    createBooking(passengerId: string, payload: {
        trip_id: string;
        seat_number?: number | string | null;
        seat_numbers?: (number | string)[] | number | string | null;
        seats?: number | string | null;
        agreed_fare: string | number;
        dropoff_place?: string | null;
        dropoff_deadline?: string | null;
        drop_off_point?: unknown;
        dropoff_point?: unknown;
        pickup_point?: unknown;
        pick_up_point?: unknown;
        pickup?: unknown;
        dropoff?: unknown;
        dropOffPoint?: unknown;
        pickup_type?: string;
        pickup_stop_id?: string | null;
        lat?: string | number | null;
        lng?: string | number | null;
        pickup_label?: string | null;
        label?: string | null;
    }): Promise<Record<string, unknown>>;
    listForPassenger(passengerId: string, filters?: {
        status?: string;
        trip_id?: string;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getForPassenger(passengerId: string, bookingId: string): Promise<{
        booking: Record<string, unknown>;
    }>;
    private syncBookingsWithTripStatus;
    cancelBooking(passengerId: string, bookingId: string): Promise<{
        booking: {
            id: string;
            status: string;
            cancelled_at: Date | null;
        };
    }>;
    editPickup(passengerId: string, bookingId: string, input: {
        pickup_type?: string;
        pickup_stop_id?: string | null;
        lat?: string | number | null;
        lng?: string | number | null;
        pickup_label?: string | null;
        label?: string | null;
    }): Promise<{
        booking_id: string;
        pickup_type: string;
        detour_seconds: number;
    }>;
    getDriverReveal(requesterId: string, requesterRole: string, bookingId: string): Promise<{
        driver: Record<string, unknown>;
    }>;
}
