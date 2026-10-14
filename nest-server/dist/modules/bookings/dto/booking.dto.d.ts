export declare class CreateBookingDto {
    trip_id: string;
    seat_number?: number | string;
    seat_numbers: (number | string)[];
    seats?: number;
    agreed_fare: string | number;
    pickup_point?: unknown;
    pick_up_point?: unknown;
    pickup?: unknown;
    drop_off_point?: unknown;
    dropoff_point?: unknown;
    dropoff?: unknown;
    dropOffPoint?: unknown;
    pickup_type?: string;
    pickup_stop_id?: string;
    dropoff_place?: string;
    dropoff_deadline?: string;
    pickup_label?: string;
    label?: string;
}
export declare class PassengerBookingListQuery {
    status?: string;
    trip_id?: string;
    page?: number;
    limit?: number;
}
export declare class DriverBookingListQuery {
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
}
export declare class BookingIdParam {
    booking_id: string;
}
export declare class EditPickupDto {
    pickup_type?: string;
    pickup_stop_id?: string;
    lat?: string | number;
    lng?: string | number;
    pickup_label?: string;
    label?: string;
}
export declare class ReportDelayDto {
    party: string;
    delay_minutes: number;
    reason?: string;
}
export declare class DelayListQuery {
    party?: string;
    page?: number;
    limit?: number;
}
