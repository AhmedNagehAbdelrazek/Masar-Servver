import { PrismaService } from '../../prisma/prisma.service.js';
export declare class StatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    lifetime(driverId: string): Promise<{
        stats: {
            total_trips: number;
            total_bookings: number;
            no_show_rate: number;
            response_rate: number;
            avg_rating: number;
            total_earnings: number;
            completed_trips: number;
            cancelled_trips: number;
        };
    }>;
}
