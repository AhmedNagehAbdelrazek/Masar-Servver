import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RecentSearchService } from '../subscriptions/recent-search.service.js';
import { CreateTripDto, TripIdParam, TripPassengersQuery, TripSearchQuery } from './dto/create-trip.dto.js';
import { CancelTripDto, UpdateTripDto } from './dto/create-trip.dto.js';
import { ReplaceStopsDto, SetPickupStatusDto, TripPickupParams } from './dto/route.dto.js';
import { AttachOfferBody } from '../ride-requests/dto/ride-request.dto.js';
import { RideRequestsService } from '../ride-requests/ride-requests.service.js';
import { TripsService } from './trips.service.js';
declare class AttachOfferParams {
    trip_id: string;
    offer_id: string;
}
export declare class TripsController {
    private readonly trips;
    private readonly recentSearch;
    private readonly offers;
    constructor(trips: TripsService, recentSearch: RecentSearchService, offers: RideRequestsService);
    createTrip(dto: CreateTripDto, user?: AuthUser): Promise<{
        trip_id: string;
        status: string;
        total_seats: number;
        available_seats: number;
        estimated_earnings: number;
        total_profit: number;
        message: string;
    }>;
    getDriverTrips(query: {
        status?: string;
    }, user?: AuthUser): Promise<{
        trips: Record<string, unknown>[];
    }>;
    searchAvailableTrips(query: TripSearchQuery, user?: AuthUser): Promise<{
        trips: Record<string, unknown>[];
        returning_trips: Record<string, unknown>[];
    }>;
    getTripById(params: TripIdParam): Promise<Record<string, unknown>>;
    getTripOptions(params: TripIdParam): Promise<Record<string, unknown>>;
    getTripSeats(params: TripIdParam): Promise<Record<string, unknown>>;
    getTripEmptySeats(params: TripIdParam): Promise<Record<string, unknown>>;
    getTripAttributes(params: TripIdParam): Promise<Record<string, unknown>>;
    startTrip(params: TripIdParam, user?: AuthUser): Promise<{
        trip_id: string;
        status: string;
        message: string;
        tracking_link: string;
    }>;
    completeTrip(params: TripIdParam, user?: AuthUser): Promise<{
        trip_id: string;
        commission: number;
        plan_name: string | null;
        balance_after: number;
        is_in_debt: boolean;
    }>;
    updateTrip(params: TripIdParam, dto: UpdateTripDto, user?: AuthUser): Promise<{
        trip: Record<string, unknown>;
    }>;
    cancelTripWithPenalty(params: TripIdParam, dto: CancelTripDto, user?: AuthUser): Promise<{
        message: string;
        trip_id: string;
        status: string;
        penalty_id: string;
        penalty_type: string;
    }>;
    cancelTrip(params: TripIdParam, user?: AuthUser): Promise<{
        trip: {
            id: string;
            status: string;
            notified_passengers: number;
        };
    }>;
    updateTripStops(params: TripIdParam, dto: ReplaceStopsDto, user?: AuthUser): Promise<{
        trip_id: string;
        stops: number;
        route_status: string;
    }>;
    getTripRoute(params: TripIdParam, user?: AuthUser): Promise<Record<string, unknown>>;
    getTripActual(params: TripIdParam, user?: AuthUser): Promise<Record<string, unknown>>;
    attachOfferToTrip(params: AttachOfferParams, dto: AttachOfferBody, user?: AuthUser): Promise<{
        booking: Record<string, unknown>;
        offer: Record<string, unknown>;
    }>;
    setTripPickupStatus(params: TripPickupParams, dto: SetPickupStatusDto, user?: AuthUser): Promise<{
        booking_id: string;
        pickup_status: string;
    }>;
    getTripPassengers(params: TripIdParam, query: TripPassengersQuery, user?: AuthUser): Promise<Record<string, unknown>>;
}
export {};
