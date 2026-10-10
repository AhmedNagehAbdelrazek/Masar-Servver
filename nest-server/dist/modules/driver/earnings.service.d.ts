import { PrismaService } from '../../prisma/prisma.service.js';
declare const PERIODS: readonly ["day", "week", "month"];
export type EarningsPeriod = (typeof PERIODS)[number];
export declare class EarningsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    aggregate(driverId: string, { period, from, to }?: {
        period?: string;
        from?: string;
        to?: string;
    }): Promise<{
        period: EarningsPeriod;
        currency: string;
        total: number;
        breakdown: {
            bucket: string;
            earnings: number;
            trips: number;
        }[];
    }>;
}
export {};
