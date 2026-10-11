export interface BookingLike {
    seatNumber?: number | string | null;
    seat_number?: number | string | null;
    seatNumbers?: (number | string)[] | null;
    seat_numbers?: (number | string)[] | null;
}
export declare function seatNumbersFor(booking: BookingLike | null | undefined): (number | string)[];
