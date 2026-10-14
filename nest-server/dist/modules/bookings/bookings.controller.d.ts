import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { TripsService } from '../trips/trips.service.js';
import { BookingsService } from './bookings.service.js';
import { DelayService } from './delay.service.js';
import { BookingIdParam, CreateBookingDto, DelayListQuery, DriverBookingListQuery, EditPickupDto, PassengerBookingListQuery, ReportDelayDto } from './dto/booking.dto.js';
export declare class BookingsController {
    private readonly bookings;
    private readonly delays;
    private readonly trips;
    constructor(bookings: BookingsService, delays: DelayService, trips: TripsService);
    listMyBookings(query: PassengerBookingListQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    createBooking(dto: CreateBookingDto, user?: AuthUser): Promise<Record<string, unknown>>;
    getBooking(bookingId: string, user?: AuthUser): Promise<{
        booking: Record<string, unknown>;
    }>;
    getDriverProfile(params: BookingIdParam, user?: AuthUser): Promise<{
        driver: Record<string, unknown>;
    }>;
    cancelBooking(bookingId: string, user?: AuthUser): Promise<{
        booking: {
            id: string;
            status: string;
            cancelled_at: Date | null;
        };
    }>;
    getBookingRoute(params: BookingIdParam, user?: AuthUser): Promise<Record<string, unknown>>;
    editBookingPickup(params: BookingIdParam, dto: EditPickupDto, user?: AuthUser): Promise<{
        booking_id: string;
        pickup_type: string;
        detour_seconds: number;
    }>;
    reportDelay(params: BookingIdParam, dto: ReportDelayDto, user?: AuthUser): Promise<{
        delay_event: Record<string, unknown>;
    }>;
    listDelays(params: BookingIdParam, query: DelayListQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getDriverBookings(query: DriverBookingListQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getDriverBooking(bookingId: string, user?: AuthUser): Promise<{
        booking: Record<string, unknown>;
    }>;
}
