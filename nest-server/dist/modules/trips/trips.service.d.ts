import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CommissionService } from '../subscriptions/commission.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { RecentSearchService } from '../subscriptions/recent-search.service.js';
import { SeatLockService } from './seat-lock.service.js';
import type { TripExpiryService } from './trip-expiry.service.js';
import { PickupService } from '../maps/pickup.service.js';
import { RouteService } from '../maps/route.service.js';
import type { CreateTripDto } from './dto/create-trip.dto.js';
export declare class TripsService {
    private readonly prisma;
    private readonly commission;
    private readonly seatLocks;
    private readonly recentSearch;
    private readonly notifications;
    private readonly home;
    private readonly realtime;
    private readonly expiry;
    private readonly routeService;
    private readonly pickupService;
    private readonly logger;
    constructor(prisma: PrismaService, commission: CommissionService, seatLocks: SeatLockService, recentSearch: RecentSearchService, notifications: NotificationsService, home: HomeService, realtime: RealtimeGateway, expiry: TripExpiryService, routeService: RouteService, pickupService: PickupService);
    private hasRemainingFreeTrips;
    private assertFreeTripsAvailable;
    private assertCanPublish;
    createTrip(driverId: string, data: CreateTripDto): Promise<{
        trip_id: string;
        status: string;
        total_seats: number;
        available_seats: number;
        estimated_earnings: number;
        total_profit: number;
        message: string;
    }>;
    getTripById(tripId: string): Promise<Record<string, unknown>>;
    getTripOptions(tripId: string): Promise<Record<string, unknown>>;
    getTripSeats(tripId: string): Promise<Record<string, unknown>>;
    getDriverTrips(driverId: string, status?: string | null): Promise<Record<string, unknown>[]>;
    getAvailableTrips(filters: {
        originCity?: string;
        destinationCity?: string;
        date?: string;
        returnDate?: string;
        genderPreference?: string | null;
        timeFrom?: string;
        timeTo?: string;
        vehicleType?: string;
        seats?: unknown;
    }): Promise<{
        trips: Record<string, unknown>[];
        returningTrips: Record<string, unknown>[];
    }>;
    private fetchTripsForDate;
    cancelTrip(driverId: string, tripId: string): Promise<{
        trip: {
            id: string;
            status: string;
            notified_passengers: number;
        };
    }>;
    moderateTrip(adminId: string, tripId: string, data: {
        action: string;
        reason?: string;
    }): Promise<{
        trip: {
            id: string;
            status: string;
            is_blocked_by_balance: boolean;
            moderated: boolean;
        };
    }>;
    startTrip(driverId: string, tripId: string): Promise<{
        trip_id: string;
        status: string;
        message: string;
        tracking_link: string;
    }>;
    completeTrip(driverId: string, tripId: string): Promise<{
        trip_id: string;
        commission: number;
        plan_name: string | null;
        balance_after: number;
        is_in_debt: boolean;
    }>;
    updateTrip(driverId: string, tripId: string, data: {
        fare_per_seat?: string | number;
        arrival_time?: string;
        gender_preference?: string;
        driver_instructions?: string[];
        additional_instructions?: string;
        attributes?: {
            attr_key?: string;
            attr_value?: string;
        }[];
        stops?: {
            stop_order?: number;
            city?: string;
            address?: string;
            lat?: string | number;
            lng?: string | number;
            stop_type?: string;
            estimated_arrival?: string;
        }[];
        departure_time?: string;
    }): Promise<{
        trip: Record<string, unknown>;
    }>;
    private countRecentCancellations;
    private getEscalationLevel;
    private applyEscalation;
    cancelTripWithPenalty(driverId: string, tripId: string, { reason, note }: {
        reason: string;
        note?: string;
    }): Promise<{
        message: string;
        trip_id: string;
        status: string;
        penalty_id: string;
        penalty_type: string;
    }>;
    replaceTripStops(driverId: string, tripId: string, stops: Record<string, unknown>[]): Promise<{
        trip_id: string;
        stops: number;
        route_status: string;
    }>;
    getTripRoute(requesterId: string, requesterRole: string, tripId: string): Promise<Record<string, unknown>>;
    setPickupStatus(driverId: string, tripId: string, bookingId: string, status: string): Promise<{
        booking_id: string;
        pickup_status: string;
    }>;
    getBookingRoute(requesterId: string, requesterRole: string, bookingId: string): Promise<Record<string, unknown>>;
    getTripActual(requesterId: string, requesterRole: string, tripId: string): Promise<Record<string, unknown>>;
    getTripAttributes(tripId: string): Promise<Record<string, unknown>>;
    getTripPassengers(driverId: string, tripId: string, filters?: {
        status?: string;
    }): Promise<Record<string, unknown>>;
}
