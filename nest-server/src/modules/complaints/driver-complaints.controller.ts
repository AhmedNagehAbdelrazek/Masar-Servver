import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { DriverComplaintListQuery } from './dto/complaint-list.query.js';

// Express parity: Routes/driverRoutes.ts GET /api/driver/complaints
// (protect + driver). Pulled into the complaints module now;
// Wave 3 driver module must NOT re-register this path.
@Controller('driver/complaints')
@Roles('driver')
export class DriverComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  getComplaints(
    @Query() query: DriverComplaintListQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.complaints.listForDriver(user?.id ?? '', query);
  }
}
