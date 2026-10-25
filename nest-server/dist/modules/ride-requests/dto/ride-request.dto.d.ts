export declare class CreateRideRequestDto {
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
    max_budget?: number;
    attributes_preferred?: Record<string, unknown>;
    note?: string;
}
export declare class ListRideRequestsQuery {
    status?: string;
    page?: number;
    limit?: number;
}
export declare class RequestIdParam {
    request_id: string;
}
export declare class UpdateRideRequestDto {
    action?: string;
    origin_city?: string;
    destination_city?: string;
    origin_time?: string;
    arrival_deadline?: string;
    seats_needed?: number;
    max_budget?: number;
    note?: string;
}
export declare class CreateOfferDto {
    offered_fare?: number;
    message?: string;
    trip_id?: string;
}
export declare class DecideOfferDto {
    action: string;
}
export declare class AgreePriceDto {
    agreed_fare: number;
}
export declare class OfferIdParam {
    offer_id: string;
}
export declare class DriverOffersQuery {
    status?: string;
    page?: number;
    limit?: number;
}
export declare class AttachOfferBody {
    dropoff_place?: string;
    dropoff_deadline?: string;
}
export declare class AcceptRideRequestBody {
    fare_per_seat: number;
    vehicle_id?: string;
    seats: Array<{
        seat_number: number;
        type: 'driver' | 'available' | 'unavailable';
    }>;
    type_of_trip?: string;
    repeated_days?: number[];
    repeated_end_date?: string;
    allowed_type?: string;
    instructions?: string[];
    additional_instructions?: string;
    pickup_point?: Record<string, unknown>;
    dropoff_point?: Record<string, unknown>;
    waypoints?: Record<string, unknown>[];
    stops?: Record<string, unknown>[];
    origin_time?: string;
}
