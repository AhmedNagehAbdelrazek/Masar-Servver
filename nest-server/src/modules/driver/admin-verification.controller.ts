import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import {
  DriverIdParam,
  RejectVerificationDto,
  VehicleIdParam,
  VerificationQueueQuery,
} from './dto/verification.dto.js';
import { VerificationService } from './verification.service.js';

function envelope(data: unknown): { status: string; data: unknown } {
  return { status: 'success', data };
}

// Express parity: Routes/adminVerificationRoutes.ts mounted at
// /api/admin/verification (all protect + admin). Registered early for the
// driver resubmit flow; Wave 7 admin module must NOT re-register these paths.
// NOTE: queue uses the {status,data} envelope; approve/reject use raw shapes.
@Controller('admin/verification')
@Roles('admin')
export class AdminVerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get('queue')
  getQueue(@Query() query: VerificationQueueQuery): Promise<{ status: string; data: unknown }> {
    return this.verification.getQueue(query).then(envelope);
  }

  @Post('drivers/:driver_id/approve')
  @HttpCode(200)
  approveDriver(
    @Param() params: DriverIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ driver_id: string; id_verified: boolean; notified: boolean }> {
    return this.verification.approveDriver(user?.id ?? '', params.driver_id);
  }

  @Post('drivers/:driver_id/reject')
  @HttpCode(200)
  rejectDriver(
    @Param() params: DriverIdParam,
    @Body() dto: RejectVerificationDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ driver_id: string; id_verified: boolean; reason: string; notified: boolean }> {
    return this.verification.rejectDriver(
      user?.id ?? '',
      params.driver_id,
      dto.reason,
      dto.fields_to_fix,
    );
  }

  @Post('vehicles/:vehicle_id/approve')
  @HttpCode(200)
  approveVehicle(
    @Param() params: VehicleIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ vehicle_id: string; is_verified: boolean; notified: boolean }> {
    return this.verification.approveVehicle(user?.id ?? '', params.vehicle_id);
  }

  @Post('vehicles/:vehicle_id/reject')
  @HttpCode(200)
  rejectVehicle(
    @Param() params: VehicleIdParam,
    @Body() dto: RejectVerificationDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ vehicle_id: string; is_verified: boolean; reason: string; notified: boolean }> {
    return this.verification.rejectVehicle(
      user?.id ?? '',
      params.vehicle_id,
      dto.reason,
      dto.fields_to_fix,
    );
  }
}
