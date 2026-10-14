import { Controller, Get, Param, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRideRequestsService } from './admin-ride-requests.service.js';
import {
  AdminRideRequestListQuery,
  RideRequestIdParam,
} from './dto/admin-ride-requests.dto.js';

// Admin ride-requests surface. Full paths carry the global /api prefix
// (main.ts): GET /api/admin/ride-requests/stats, etc. Static route `stats`
// is declared before :request_id so it is never captured as a request id.
@Controller('admin/ride-requests')
@Roles('admin')
export class AdminRideRequestsController {
  constructor(private readonly requests: AdminRideRequestsService) {}

  @Get('stats')
  getStats(): Promise<Record<string, unknown>> {
    return this.requests.getStats();
  }

  @Get()
  listRequests(
    @Query() query: AdminRideRequestListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.requests.listRequests(query);
  }

  @Get(':request_id')
  getDetail(@Param() params: RideRequestIdParam): Promise<Record<string, unknown>> {
    return this.requests.getDetail(params.request_id);
  }
}
