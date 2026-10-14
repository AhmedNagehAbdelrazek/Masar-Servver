import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { SeatLockService } from './seat-lock.service.js';
import type { TripsService } from './trips.service.js';
export interface SweepResult {
    autoCompleted: string[];
    expiredUnoperated: string[];
    noShowBookings: number;
    errors: {
        tripId: string | null;
        message: string;
    }[];
    touched: number;
}
export declare class TripExpiryService {
    private readonly prisma;
    private readonly trips;
    private readonly seatLocks;
    private readonly notifications;
    private readonly home;
    private readonly logger;
    constructor(prisma: PrismaService, trips: TripsService, seatLocks: SeatLockService, notifications: NotificationsService, home: HomeService);
    private unoperatedCutoff;
    private lifecycleCutoff;
    private expireUnoperatedTrip;
    private closeOutStaleTrip;
    refreshStaleTrips(tripIds?: unknown): Promise<SweepResult>;
}
