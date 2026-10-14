import { PrismaService } from '../../prisma/prisma.service.js';
import type { DriversListQuery, DriverTripsQuery, RecentTripsQuery, ReservationsQuery } from './dto/dashboard-queries.dto.js';
interface BucketUser {
    status: string;
    verificationStatus: string;
}
export declare function deriveAccountStatus(user: BucketUser): string;
export declare function maskPhone(phone: string | number | null | undefined): string | null;
export declare class AdminDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getDriverOrThrow;
    private tripPassengerAggregates;
    private pendingDocumentKeysFor;
    private countPendingDocuments;
    private resolveImages;
    private documentEntry;
    private loadDossierContext;
    getSummary(): Promise<Record<string, unknown>>;
    getRecentTrips(query: RecentTripsQuery): Promise<Record<string, unknown>>;
    getTopRoutes(): Promise<Record<string, unknown>>;
    getPendingRequests(query: RecentTripsQuery): Promise<Record<string, unknown>>;
    getLatestComplaints(query: RecentTripsQuery): Promise<Record<string, unknown>>;
    listDrivers(query: DriversListQuery): Promise<Record<string, unknown>>;
    getDriverStats(): Promise<Record<string, unknown>>;
    exportDrivers(query: DriversListQuery): Promise<string>;
    getDriverHeader(driverId: string): Promise<Record<string, unknown>>;
    getDriverOverview(driverId: string): Promise<Record<string, unknown>>;
    listDriverTrips(driverId: string, query: DriverTripsQuery): Promise<Record<string, unknown>>;
    getDriverEvaluations(driverId: string, query: RecentTripsQuery): Promise<Record<string, unknown>>;
    getAccountLog(driverId: string): Promise<Record<string, unknown>>;
    getCarDetails(driverId: string): Promise<Record<string, unknown>>;
    getDocuments(driverId: string): Promise<Record<string, unknown>>;
    setDriverStatus(adminId: string, driverId: string, requestedStatus: string): Promise<Record<string, unknown>>;
    applyStandingAction(adminId: string, driverId: string, action: string, reason?: string | null): Promise<Record<string, unknown>>;
    decideDocument(adminId: string, driverId: string, documentKey: string, decision: 'approved' | 'rejected', reason?: string | null): Promise<Record<string, unknown>>;
    sendDriverNotification(adminId: string, driverId: string, dto: {
        title: string;
        body: string;
        type: string;
    }): Promise<Record<string, unknown>>;
    listReservations(query: ReservationsQuery): Promise<Record<string, unknown>>;
}
export {};
