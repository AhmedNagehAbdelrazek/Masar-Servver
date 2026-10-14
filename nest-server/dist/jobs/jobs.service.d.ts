import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { BalanceService } from '../modules/balance/balance.service.js';
import { DriverStatsService } from '../modules/driver/driver-stats.service.js';
import { RouteService } from '../modules/maps/route.service.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { SosService } from '../modules/sos/sos.service.js';
import { CommissionService } from '../modules/subscriptions/commission.service.js';
import { TripExpiryService } from '../modules/trips/trip-expiry.service.js';
export declare class JobsService {
    private readonly prisma;
    private readonly redis;
    private readonly balance;
    private readonly notifications;
    private readonly commission;
    private readonly sos;
    private readonly tripExpiry;
    private readonly routes;
    private readonly stats;
    private readonly logger;
    private readonly running;
    constructor(prisma: PrismaService, redis: RedisService, balance: BalanceService, notifications: NotificationsService, commission: CommissionService, sos: SosService, tripExpiry: TripExpiryService, routes: RouteService, stats: DriverStatsService);
    private guarded;
    runExpirySweep(): Promise<{
        driverId: string;
        expired: {
            id: string;
            planName: string;
            removedBalance: number;
        }[];
        totalBalance: number;
        isInDebt: boolean;
    }[]>;
    runExpiryReminder(): Promise<{
        driverId: string;
        subscriptionId: string;
        planName: string;
    }[]>;
    runLowBalanceWarning(): Promise<{
        driverId: string;
        tripId: string;
        minimum: number;
        balance: number;
    }[]>;
    runSosEscalation(): Promise<{
        alerted: number;
        escalated: number;
    }>;
    runDataRetention(): Promise<{
        locationsDeleted: number;
        messagesDeleted: number;
    }>;
    runRouteRetry(): Promise<{
        retried: number;
        recovered: number;
        stillFailing: number;
    }>;
    runActualPath(): Promise<{
        compacted: number;
        skipped: number;
    }>;
    runDriverStats(): Promise<{
        driversUpdated: number;
    }>;
    runTripLifecycle(): Promise<{
        autoCompleted: string[];
        expiredUnoperated: string[];
        noShowBookings: number;
        errors: {
            tripId: string | null;
            message: string;
        }[];
        touched: number;
    }>;
    private isTestEnv;
    expirySweep(): void;
    expiryReminder(): void;
    lowBalanceWarning(): void;
    sosEscalation(): void;
    dataRetention(): void;
    routeRetry(): void;
    actualPath(): void;
    driverStats(): void;
    tripLifecycle(): void;
}
