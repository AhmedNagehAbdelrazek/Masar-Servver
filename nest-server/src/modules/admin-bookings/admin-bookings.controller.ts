import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminBookingsService } from './admin-bookings.service.js';
import {
  AdminBookingListQuery,
  AdminCancelBookingDto,
  BookingIdParam,
} from './dto/admin-bookings.dto.js';

// Admin bookings surface. Full paths carry the global /api prefix
// (main.ts): GET /api/admin/bookings/stats, etc. Static route `stats` is
// declared before :booking_id so it is never captured as a booking id.
@Controller('admin/bookings')
@Roles('admin')
export class AdminBookingsController {
  constructor(private readonly bookings: AdminBookingsService) {}

  @Get('stats')
  getStats(): Promise<Record<string, unknown>> {
    return this.bookings.getStats();
  }

  @Get()
  listBookings(
    @Query() query: AdminBookingListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.bookings.listBookings(query);
  }

  @Get(':booking_id')
  getDetail(@Param() params: BookingIdParam): Promise<Record<string, unknown>> {
    return this.bookings.getDetail(params.booking_id);
  }

  @Post(':booking_id/cancel')
  @HttpCode(200)
  cancelBooking(
    @Param() params: BookingIdParam,
    @Body() dto: AdminCancelBookingDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ booking: Record<string, unknown> }> {
    return this.bookings.cancelBooking(user?.id ?? '', params.booking_id, dto);
  }
}
