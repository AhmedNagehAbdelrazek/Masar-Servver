import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { TripsService } from '../trips/trips.service.js';
import { BookingsService } from './bookings.service.js';
import { DelayService } from './delay.service.js';
import {
  BookingIdParam,
  CreateBookingDto,
  DelayListQuery,
  DriverBookingListQuery,
  EditPickupDto,
  PassengerBookingListQuery,
  ReportDelayDto,
} from './dto/booking.dto.js';

// Express parity: Routes/bookingRoutes.ts (all protect) + driver bookings
// surface from Routes/driverRoutes.ts + GET booking route. NOTE: GET /:id and
// PUT cancel carry param validation WITHOUT the `validate` middleware in
// Express, so malformed ids fall through to 404s — plain-string params here.
@Controller()
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly delays: DelayService,
    private readonly trips: TripsService,
  ) {}

  @Get('bookings')
  @Roles('passenger')
  listMyBookings(
    @Query() query: PassengerBookingListQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.bookings.listForPassenger(user?.id ?? '', query);
  }

  @Post('bookings')
  @HttpCode(201)
  @Roles('passenger')
  createBooking(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.bookings.createBooking(user?.id ?? '', dto).then((booking) => ({ booking }));
  }

  @Get('bookings/:booking_id')
  @Roles('passenger')
  getBooking(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking: Record<string, unknown> }> {
    return this.bookings.getForPassenger(user?.id ?? '', bookingId);
  }

  @Get('bookings/:booking_id/driver-profile')
  getDriverProfile(
    @Param() params: BookingIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ driver: Record<string, unknown> }> {
    return this.bookings.getDriverReveal(user?.id ?? '', user?.role ?? '', params.booking_id);
  }

  @Put('bookings/:booking_id/cancel')
  @Roles('passenger')
  cancelBooking(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking: { id: string; status: string; cancelled_at: Date | null } }> {
    return this.bookings.cancelBooking(user?.id ?? '', bookingId);
  }

  @Get('bookings/:booking_id/route')
  @Roles('passenger', 'driver')
  getBookingRoute(
    @Param() params: BookingIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.trips.getBookingRoute(user?.id ?? '', user?.role ?? '', params.booking_id);
  }

  @Patch('bookings/:booking_id/pickup')
  @Roles('passenger')
  editBookingPickup(
    @Param() params: BookingIdParam,
    @Body() dto: EditPickupDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking_id: string; pickup_type: string; detour_seconds: number }> {
    return this.bookings.editPickup(user?.id ?? '', params.booking_id, dto);
  }

  @Post('bookings/:booking_id/delay')
  @HttpCode(201)
  reportDelay(
    @Param() params: BookingIdParam,
    @Body() dto: ReportDelayDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ delay_event: Record<string, unknown> }> {
    return this.delays.reportDelay(user?.id ?? '', params.booking_id, dto);
  }

  @Get('bookings/:booking_id/delays')
  listDelays(
    @Param() params: BookingIdParam,
    @Query() query: DelayListQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.delays.listDelays(user?.id ?? '', params.booking_id, query);
  }

  @Get('driver/bookings')
  @Roles('driver')
  getDriverBookings(
    @Query() query: DriverBookingListQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.bookings.listForDriver(user?.id ?? '', query);
  }

  @Get('driver/bookings/:booking_id')
  @Roles('driver')
  getDriverBooking(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking: Record<string, unknown> }> {
    return this.bookings.getForDriver(user?.id ?? '', bookingId);
  }
}
