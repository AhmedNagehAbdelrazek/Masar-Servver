import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { AdminComplaintListQuery } from './dto/complaint-list.query.js';
import { ComplaintPenaltyDto } from './dto/complaint-penalty.dto.js';
import { ComplaintIdParam, ResolveComplaintDto } from './dto/resolve-complaint.dto.js';

// Express parity: Routes/adminModerationRoutes.ts complaint section
// (all protect + admin). Stats/detail/penalties extend the dashboard
// dossier (Figma 10678:13079, 10681:11590/19490, 10698:23006, 10699:24545/25044).
// Static route `stats` is declared before :complaint_id so it is never
// captured as a complaint id.
@Controller('admin/complaints')
@Roles('admin')
export class AdminComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get('stats')
  getStats(): Promise<Record<string, unknown>> {
    return this.complaints.getStats();
  }

  @Get()
  listComplaints(
    @Query() query: AdminComplaintListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.complaints.listAdmin(query);
  }

  @Get(':complaint_id')
  getDetail(@Param() params: ComplaintIdParam): Promise<Record<string, unknown>> {
    return this.complaints.getDetail(params.complaint_id);
  }

  @Post(':complaint_id/penalties')
  @HttpCode(200)
  penalize(
    @Param() params: ComplaintIdParam,
    @Body() dto: ComplaintPenaltyDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ penalty: Record<string, unknown> }> {
    return this.complaints.penalize(user?.id ?? '', params.complaint_id, dto);
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
