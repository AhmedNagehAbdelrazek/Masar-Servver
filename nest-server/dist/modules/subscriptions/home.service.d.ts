import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { BalanceService } from '../balance/balance.service.js';
import { RecentSearchService } from './recent-search.service.js';
import { SubscriptionsService } from './subscriptions.service.js';
export declare class HomeService {
    private readonly prisma;
    private readonly balance;
    private readonly subscriptions;
    private readonly recentSearch;
    private readonly realtime;
    private readonly logger;
    constructor(prisma: PrismaService, balance: BalanceService, subscriptions: SubscriptionsService, recentSearch: RecentSearchService, realtime: RealtimeGateway);
    private toSubscriptionSection;
    private toNextTrip;
    private toRecentBookings;
    getHome(driverId: string): Promise<Record<string, unknown>>;
    getSubscription(driverId: string): Promise<Record<string, unknown>>;
    getPassengerHome(passengerId: string): Promise<Record<string, unknown>>;
    invalidateHomeCache(_driverId: string): Promise<void>;
    invalidatePassengerHome(_passengerId: string): Promise<void>;
    invalidateHomeForTrip(tripId: string, driverId: string): Promise<void>;
}
