import { Body, Controller, Get, Header, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminPassengersService } from './admin-passengers.service.js';
import {
  PassengerBookingsQuery,
  PassengerComplaintsQuery,
  PassengerIdParam,
  PassengerListQuery,
  PassengerRatingsQuery,
  PassengerRideRequestsQuery,
  PermanentSuspensionDto,
  SendPassengerNotificationDto,
  SendPassengerWarningDto,
  TemporarySuspensionDto,
} from './dto/admin-passengers.dto.js';

// Admin passenger surface. Full paths carry the global /api prefix
// (main.ts): GET /api/admin/passengers/stats, etc.
// Static routes (stats, export) are declared before :passenger_id so they
// are never captured as a passenger id.
@Controller('admin/passengers')
@Roles('admin')
export class AdminPassengersController {
  constructor(private readonly passengers: AdminPassengersService) {}

  @Get('stats')
  getStats(): Promise<Record<string, unknown>> {
    return this.passengers.getStats();
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  exportPassengers(@Query() query: PassengerListQuery): Promise<string> {
    return this.passengers.exportPassengers(query);
  }

  @Get()
  listPassengers(
    @Query() query: PassengerListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.passengers.listPassengers(query);
  }

  @Get(':passenger_id')
  getOverview(@Param() params: PassengerIdParam): Promise<Record<string, unknown>> {
    return this.passengers.getOverview(params.passenger_id);
  }

  @Get(':passenger_id/account-log')
  getAccountLog(@Param() params: PassengerIdParam): Promise<Record<string, unknown>> {
    return this.passengers.getAccountLog(params.passenger_id);
  }

  @Get(':passenger_id/bookings')
  listBookings(
    @Param() params: PassengerIdParam,
    @Query() query: PassengerBookingsQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.passengers.listBookings(params.passenger_id, query);
  }

  @Get(':passenger_id/trip-requests')
  listTripRequests(
    @Param() params: PassengerIdParam,
    @Query() query: PassengerRideRequestsQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.passengers.listTripRequests(params.passenger_id, query);
  }

  @Get(':passenger_id/complaints')
  listComplaints(
    @Param() params: PassengerIdParam,
    @Query() query: PassengerComplaintsQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.passengers.listComplaints(params.passenger_id, query);
  }

  @Get(':passenger_id/ratings')
  listRatings(
    @Param() params: PassengerIdParam,
    @Query() query: PassengerRatingsQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.passengers.listRatings(params.passenger_id, query);
  }

  @Post(':passenger_id/notifications')
  @HttpCode(200)
  sendNotification(
    @Param() params: PassengerIdParam,
    @Body() dto: SendPassengerNotificationDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ notification: Record<string, unknown> }> {
    return this.passengers.sendNotification(user?.id ?? '', params.passenger_id, dto);
  }

  @Post(':passenger_id/warnings')
  @HttpCode(200)
  sendWarning(
    @Param() params: PassengerIdParam,
    @Body() dto: SendPassengerWarningDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ penalty: Record<string, unknown> }> {
    return this.passengers.sendWarning(user?.id ?? '', params.passenger_id, dto);
  }

  @Post(':passenger_id/suspensions/temporary')
  @HttpCode(200)
  suspendTemporary(
    @Param() params: PassengerIdParam,
    @Body() dto: TemporarySuspensionDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ penalty: Record<string, unknown> }> {
    return this.passengers.suspendTemporary(user?.id ?? '', params.passenger_id, dto);
  }

  @Post(':passenger_id/suspensions/permanent')
  @HttpCode(200)
  suspendPermanent(
    @Param() params: PassengerIdParam,
    @Body() dto: PermanentSuspensionDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ penalty: Record<string, unknown> }> {
    return this.passengers.suspendPermanent(user?.id ?? '', params.passenger_id, dto);
  }
}
