import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
export declare class DashboardService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    private key;
    getDashboard(driverId: string): Promise<Record<string, unknown>>;
    invalidateDashboardCache(driverId: string): Promise<void>;
}
