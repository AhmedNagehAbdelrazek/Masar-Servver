import { Body, Controller, Get, HttpCode, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { EarningsQuery, PenaltyListQuery } from './dto/driver-query.dto.js';
import { UpdatePersonalDataDto } from './dto/personal-data.dto.js';
import { DriverService } from './driver.service.js';

// Express parity: Routes/driverRoutes.ts mounted at /api/driver (driver-only).
// Wave 3: profile, full, personal-data, account-status, delete-account,
// penalties, earnings, stats. Bookings/offers arrive with Wave 5 services;
// home/subscription with Wave 4.
@Controller('driver')
@Roles('driver')
export class DriverController {
  constructor(private readonly driver: DriverService) {}

  @Get('profile')
  getProfile(@CurrentUser() user?: AuthUser): Promise<{ profile: Record<string, unknown> }> {
    return this.driver.getProfile(user?.id ?? '');
  }

  @Get('profile/full')
  getFullProfile(@CurrentUser() user?: AuthUser): Promise<Record<string, unknown>> {
    return this.driver.getFullProfile(user?.id ?? '');
  }

  @Get('personal-data')
  getPersonalData(@CurrentUser() user?: AuthUser): Promise<{
    personal_data: Record<string, unknown>;
    vehicle: Record<string, unknown> | null;
    editable_now: string[];
    locked_fields: string[];
    rejected_fields: string[];
  }> {
    return this.driver.getPersonalData(user?.id ?? '');
  }

  @Put('personal-data')
  updatePersonalData(
    @Body() dto: UpdatePersonalDataDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.driver.updatePersonalData(user?.id ?? '', dto);
  }

  @Get('account-status')
  getAccountStatus(@CurrentUser() user?: AuthUser): Promise<Record<string, unknown>> {
    return this.driver.getAccountStatus(user?.id ?? '');
  }

  @Post('delete-account')
  @HttpCode(200)
  requestDeleteAccount(
    @Body() body: { reason?: string; confirmation?: boolean },
    @CurrentUser() user?: AuthUser,
  ): Promise<{ request_id: string; status: string; estimated_completion: Date }> {
    return this.driver.requestDeleteAccount(user?.id ?? '', body ?? {});
  }

  @Post('delete-account/cancel')
  @HttpCode(200)
  cancelDeleteAccount(
    @CurrentUser() user?: AuthUser,
  ): Promise<{ request_id: string; status: string }> {
    return this.driver.cancelDeleteAccount(user?.id ?? '');
  }

  @Get('penalties')
  getPenalties(
    @Query() query: PenaltyListQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.driver.getPenalties(user?.id ?? '', query);
  }

  @Get('earnings')
  getEarnings(
    @Query() query: EarningsQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{
    period: string;
    currency: string;
    total: number;
    breakdown: { bucket: string; earnings: number; trips: number }[];
  }> {
    return this.driver.getEarnings(user?.id ?? '', query);
  }

  @Get('stats')
  getStats(@CurrentUser() user?: AuthUser): Promise<{
    stats: {
      total_trips: number;
      total_bookings: number;
      no_show_rate: number;
      response_rate: number;
      avg_rating: number;
      total_earnings: number;
      completed_trips: number;
      cancelled_trips: number;
    };
  }> {
    return this.driver.getStats(user?.id ?? '');
  }
}
