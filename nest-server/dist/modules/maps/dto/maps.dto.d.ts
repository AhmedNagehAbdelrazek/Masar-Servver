export declare class RoutePreviewDto {
    origin_lat?: string | number;
    origin_lng?: string | number;
    destination_lat?: string | number;
    destination_lng?: string | number;
    origin?: Record<string, unknown>;
    destination?: Record<string, unknown>;
    stops?: Record<string, unknown>[];
    departure_time?: string;
}
export declare class ReverseGeocodeDto {
    lat: number;
    lng: number;
}
export declare class PickupPreviewDto {
    pickup_type?: string;
    pickup_stop_id?: string;
    lat?: string | number;
    lng?: string | number;
    pickup_label?: string;
}
export declare class TripIdParam {
    trip_id: string;
}
