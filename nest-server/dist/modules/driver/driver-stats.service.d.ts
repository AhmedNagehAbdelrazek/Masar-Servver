import { PrismaService } from '../../prisma/prisma.service.js';
export declare const PROFESSIONAL_MIN_TRIPS = 20;
export declare const PROFESSIONAL_MIN_PUNCTUALITY = 90;
export interface DriverStatsResult {
    driverId: string;
    completedTrips: number;
    punctualityRate: number | null;
    professionalDriver: boolean;
}
export declare class DriverStatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recomputeForDriver(driverId: string): Promise<DriverStatsResult>;
    recomputeAllDrivers(): Promise<DriverStatsResult[]>;
}
