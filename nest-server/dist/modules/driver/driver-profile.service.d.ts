import { PrismaService } from '../../prisma/prisma.service.js';
import { BalanceService } from '../balance/balance.service.js';
import { DeletionService } from './deletion.service.js';
import { StatsService } from './stats.service.js';
export declare const MENU_ITEMS: {
    key: string;
    label: string;
    icon: string;
}[];
export declare class DriverProfileService {
    private readonly prisma;
    private readonly stats;
    private readonly balance;
    private readonly deletion;
    constructor(prisma: PrismaService, stats: StatsService, balance: BalanceService, deletion: DeletionService);
    private computePunctualityRate;
    getFullProfile(driverId: string): Promise<Record<string, unknown>>;
    private buildSubscriptionCard;
    getAccountStatus(driverId: string): Promise<Record<string, unknown>>;
}
