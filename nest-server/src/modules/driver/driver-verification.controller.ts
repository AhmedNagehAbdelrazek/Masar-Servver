import { Body, Controller, Get, HttpCode, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { DriverVerificationService } from './driver-verification.service.js';
import { SubmitVerificationDto } from './dto/verification.dto.js';

function envelope(data: unknown): { status: string; data: unknown } {
  return { status: 'success', data };
}

// Express parity: Routes/driverVerificationRoutes.ts mounted at /api/driver
// (all protect + driver). Responses use the {status,data} envelope.
@Controller('driver')
@Roles('driver')
export class DriverVerificationController {
  constructor(private readonly verification: DriverVerificationService) {}

  @Get('verification-status')
  getStatus(@CurrentUser() user?: AuthUser): Promise<{ status: string; data: unknown }> {
    return this.verification.getStatus(user?.id ?? '').then(envelope);
  }

  @Get('verification')
  getSubmission(@CurrentUser() user?: AuthUser): Promise<{ status: string; data: unknown }> {
    return this.verification.getSubmission(user?.id ?? '').then(envelope);
  }

  @Put('verification')
  @HttpCode(200)
  submit(
    @Body() dto: SubmitVerificationDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ status: string; data: unknown }> {
    return this.verification.submitOrResubmit(user?.id ?? '', dto).then(envelope);
  }
}
