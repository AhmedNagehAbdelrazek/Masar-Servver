declare class WaypointDto {
    stop_name?: string;
    name?: string;
    stop_lat?: string | number;
    lat?: string | number;
    stop_lng?: string | number;
    lng?: string | number;
}
declare class TripPointDto {
    name?: string;
    stop_name?: string;
    lat?: string | number;
    stop_lat?: string | number;
    lng?: string | number;
    stop_lng?: string | number;
    city?: string;
}
declare class StopInputDto {
    name?: string;
    stop_name?: string;
    city?: string;
    address?: string;
    lat?: string | number;
    lng?: string | number;
    stop_lat?: string | number;
    stop_lng?: string | number;
    stop_type?: string;
    stop_order?: number;
}
declare class SeatInputDto {
    seat_number: number;
    type: string;
}
export declare class CreateTripDto {
    origin_city: string;
    origin_area?: string;
    origin_lat?: string | number;
    origin_lng?: string | number;
    destination_city: string;
    destination_area?: string;
    destination_lat?: string | number;
    destination_lng?: string | number;
    waypoints?: WaypointDto[];
    pickup_point?: TripPointDto;
    pickup?: Record<string, unknown>;
    pickup_location?: Record<string, unknown>;
    dropoff_point?: TripPointDto;
    dropoff?: Record<string, unknown>;
    dropoff_location?: Record<string, unknown>;
    drop_off_point?: Record<string, unknown>;
    stops?: StopInputDto[];
    departure_time: string;
    type_of_trip: string;
    repeated_days?: number[];
    repeated_end_date?: string;
    allowed_type?: string;
    fare_per_seat: string | number;
    seats: SeatInputDto[];
    instructions?: string[];
    additional_instructions?: string;
}
declare class TripAttributeDto {
    attr_key?: string;
    attr_value?: string;
}
declare class TripStopUpdateDto {
    city?: string;
    address?: string;
    lat?: string | number;
    lng?: string | number;
    stop_type?: string;
    stop_order?: number;
    estimated_arrival?: string;
}
export declare class UpdateTripDto {
    fare_per_seat?: string | number;
    departure_time?: string;
    arrival_time?: string;
    gender_preference?: string;
    driver_instructions?: string[];
    additional_instructions?: string;
    attributes?: TripAttributeDto[];
    stops?: TripStopUpdateDto[];
}
export declare class TripIdParam {
    trip_id: string;
}
export declare class TripPassengersQuery {
    status?: string;
}
export declare class TripSearchQuery {
    origin_city?: string;
    destination_city?: string;
    date?: string;
    return_date?: string;
    gender_preference?: string;
    time_from?: string;
    time_to?: string;
    vehicle_type?: string;
    seats?: number;
}
export declare class CancelTripDto {
    reason: string;
    note?: string;
}
export declare class LockSeatDto {
    seat_number?: number;
    seat_numbers?: (number | string)[];
}
export {};
