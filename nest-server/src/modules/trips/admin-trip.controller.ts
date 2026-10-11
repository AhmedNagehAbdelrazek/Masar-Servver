import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ModerateTripDto } from '../admin-moderation/dto/admin-moderation.dto.js';
import { TripIdParam } from './dto/create-trip.dto.js';
import { TripsService } from './trips.service.js';

// Express parity: Routes/adminTripRoutes.ts (protect + admin/support/
// moderator, audited views). Registered early with the trips module;
// Wave 7 admin module must NOT re-register these paths.
@Controller('admin/trips')
@Roles('admin', 'support', 'moderator')
export class AdminTripController {
  constructor(private readonly trips: TripsService) {}

  @Get(':trip_id/route')
  getAdminTripRoute(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.trips.getTripRoute(user?.id ?? '', user?.role ?? '', params.trip_id);
  }

  @Get(':trip_id/route/actual')
  getAdminTripActual(
    @Param() params: TripIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.trips.getTripActual(user?.id ?? '', user?.role ?? '', params.trip_id);
  }

  // Express parity: Routes/adminModerationRoutes.ts trip section
  // (PUT /api/admin/trips/:trip_id, protect + admin only). Method-level
  // @Roles('admin') overrides the class-level staff roles.
  @Put(':trip_id')
  @Roles('admin')
  moderateTrip(
    @Param() params: TripIdParam,
    @Body() dto: ModerateTripDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{
    trip: { id: string; status: string; is_blocked_by_balance: boolean; moderated: boolean };
  }> {
    return this.trips.moderateTrip(user?.id ?? '', params.trip_id, dto);
  }
}
