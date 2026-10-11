import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
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
}
