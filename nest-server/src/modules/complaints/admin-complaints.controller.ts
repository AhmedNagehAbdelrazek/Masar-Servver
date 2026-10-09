import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { AdminComplaintListQuery } from './dto/complaint-list.query.js';
import { ComplaintIdParam, ResolveComplaintDto } from './dto/resolve-complaint.dto.js';

// Express parity: Routes/adminModerationRoutes.ts complaint section
// (all protect + admin). Pulled into the complaints module now;
// Wave 7 admin module must NOT re-register these paths.
@Controller('admin/complaints')
@Roles('admin')
export class AdminComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  listComplaints(
    @Query() query: AdminComplaintListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.complaints.listAdmin(query);
  }

  @Put(':complaint_id')
  resolveComplaint(
    @Param() params: ComplaintIdParam,
    @Body() dto: ResolveComplaintDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ complaint: Record<string, unknown> }> {
    return this.complaints.resolve(user?.id ?? '', params.complaint_id, dto);
  }
}
