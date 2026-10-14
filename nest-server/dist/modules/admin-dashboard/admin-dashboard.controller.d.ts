import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AccountActionDto, RejectDocumentDto, SetDriverStatusDto } from './dto/admin-actions.dto.js';
import { DriversListQuery, DriverTripsQuery, RecentTripsQuery, ReservationsQuery } from './dto/dashboard-queries.dto.js';
import { DocumentDecisionParams } from './dto/document-key.param.js';
import { DriverIdParam } from './dto/driver-id.param.js';
export declare class AdminDashboardController {
    private readonly dashboard;
    constructor(dashboard: AdminDashboardService);
    getSummary(): Promise<Record<string, unknown>>;
    getRecentTrips(query: RecentTripsQuery): Promise<Record<string, unknown>>;
    getTopRoutes(): Promise<Record<string, unknown>>;
    getPendingRequests(query: RecentTripsQuery): Promise<Record<string, unknown>>;
    getLatestComplaints(query: RecentTripsQuery): Promise<Record<string, unknown>>;
    listDrivers(query: DriversListQuery): Promise<Record<string, unknown>>;
    getDriverStats(): Promise<Record<string, unknown>>;
    getDriverHeader(params: DriverIdParam): Promise<Record<string, unknown>>;
    getDriverOverview(params: DriverIdParam): Promise<Record<string, unknown>>;
    listDriverTrips(params: DriverIdParam, query: DriverTripsQuery): Promise<Record<string, unknown>>;
    getDriverEvaluations(params: DriverIdParam, query: RecentTripsQuery): Promise<Record<string, unknown>>;
    getAccountLog(params: DriverIdParam): Promise<Record<string, unknown>>;
    getCarDetails(params: DriverIdParam): Promise<Record<string, unknown>>;
    getDocuments(params: DriverIdParam): Promise<Record<string, unknown>>;
    setDriverStatus(params: DriverIdParam, dto: SetDriverStatusDto, user?: AuthUser): Promise<Record<string, unknown>>;
    applyStandingAction(params: DriverIdParam, dto: AccountActionDto, user?: AuthUser): Promise<Record<string, unknown>>;
    approveDocument(params: DocumentDecisionParams, user?: AuthUser): Promise<Record<string, unknown>>;
    rejectDocument(params: DocumentDecisionParams, dto: RejectDocumentDto, user?: AuthUser): Promise<Record<string, unknown>>;
    listReservations(query: ReservationsQuery): Promise<Record<string, unknown>>;
}
