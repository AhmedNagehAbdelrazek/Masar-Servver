import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AccountActionDto, RejectDocumentDto, SetDriverStatusDto } from './dto/admin-actions.dto.js';
import {
  DriversListQuery,
  DriverTripsQuery,
  RecentTripsQuery,
  ReservationsQuery,
} from './dto/dashboard-queries.dto.js';
import { DocumentDecisionParams } from './dto/document-key.param.js';
import { DriverIdParam } from './dto/driver-id.param.js';

// Express parity: Routes/adminDashboardRoutes.ts mounted at
// /api/admin/dashboard (all protect + admin role). All handlers use
// successResponse (raw data, no envelope), so this controller returns service
// results directly. Static routes are declared before :driver_id so
// /drivers/stats/summary is never captured as a driver id.
@Controller('admin/dashboard')
@Roles('admin')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  // ===== US1: Global dashboard =====
  @Get('summary')
  getSummary(): Promise<Record<string, unknown>> {
    return this.dashboard.getSummary();
  }

  @Get('recent-trips')
  getRecentTrips(@Query() query: RecentTripsQuery): Promise<Record<string, unknown>> {
    return this.dashboard.getRecentTrips(query);
  }

  @Get('top-routes')
  getTopRoutes(): Promise<Record<string, unknown>> {
    return this.dashboard.getTopRoutes();
  }

  @Get('pending-requests')
  getPendingRequests(@Query() query: RecentTripsQuery): Promise<Record<string, unknown>> {
    return this.dashboard.getPendingRequests(query);
  }

  @Get('latest-complaints')
  getLatestComplaints(@Query() query: RecentTripsQuery): Promise<Record<string, unknown>> {
    return this.dashboard.getLatestComplaints(query);
  }

  // ===== US2: Drivers directory (static routes BEFORE :driver_id) =====
  @Get('drivers')
  listDrivers(@Query() query: DriversListQuery): Promise<Record<string, unknown>> {
    return this.dashboard.listDrivers(query);
  }

  @Get('drivers/stats/summary')
  getDriverStats(): Promise<Record<string, unknown>> {
    return this.dashboard.getDriverStats();
  }

  // ===== US3: Driver dossier =====
  @Get('drivers/:driver_id')
  getDriverHeader(@Param() params: DriverIdParam): Promise<Record<string, unknown>> {
    return this.dashboard.getDriverHeader(params.driver_id);
  }

  @Get('drivers/:driver_id/overview')
  getDriverOverview(@Param() params: DriverIdParam): Promise<Record<string, unknown>> {
    return this.dashboard.getDriverOverview(params.driver_id);
  }

  @Get('drivers/:driver_id/trips')
  listDriverTrips(
    @Param() params: DriverIdParam,
    @Query() query: DriverTripsQuery,
  ): Promise<Record<string, unknown>> {
    return this.dashboard.listDriverTrips(params.driver_id, query);
  }

  @Get('drivers/:driver_id/evaluations')
  getDriverEvaluations(
    @Param() params: DriverIdParam,
    @Query() query: RecentTripsQuery,
  ): Promise<Record<string, unknown>> {
    return this.dashboard.getDriverEvaluations(params.driver_id, query);
  }

  @Get('drivers/:driver_id/account-log')
  getAccountLog(@Param() params: DriverIdParam): Promise<Record<string, unknown>> {
    return this.dashboard.getAccountLog(params.driver_id);
  }

  @Get('drivers/:driver_id/car')
  getCarDetails(@Param() params: DriverIdParam): Promise<Record<string, unknown>> {
    return this.dashboard.getCarDetails(params.driver_id);
  }

  @Get('drivers/:driver_id/documents')
  getDocuments(@Param() params: DriverIdParam): Promise<Record<string, unknown>> {
    return this.dashboard.getDocuments(params.driver_id);
  }

  // ===== US4: Actions (Express answers 200, Nest POST defaults to 201) =====
  @Post('drivers/:driver_id/status')
  @HttpCode(200)
  setDriverStatus(
    @Param() params: DriverIdParam,
    @Body() dto: SetDriverStatusDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.dashboard.setDriverStatus(user?.id ?? '', params.driver_id, dto.status);
  }

  @Post('drivers/:driver_id/account-status')
  @HttpCode(200)
  applyStandingAction(
    @Param() params: DriverIdParam,
    @Body() dto: AccountActionDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.dashboard.applyStandingAction(user?.id ?? '', params.driver_id, dto.action, dto.reason);
  }

  @Post('drivers/:driver_id/documents/:document_key/approve')
  @HttpCode(200)
  approveDocument(
    @Param() params: DocumentDecisionParams,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.dashboard.decideDocument(user?.id ?? '', params.driver_id, params.document_key, 'approved', null);
  }

  @Post('drivers/:driver_id/documents/:document_key/reject')
  @HttpCode(200)
  rejectDocument(
    @Param() params: DocumentDecisionParams,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.dashboard.decideDocument(user?.id ?? '', params.driver_id, params.document_key, 'rejected', dto.reason);
  }

  // ===== US5: Shared listings =====
  @Get('reservations')
  listReservations(@Query() query: ReservationsQuery): Promise<Record<string, unknown>> {
    return this.dashboard.listReservations(query);
  }
}
