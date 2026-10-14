import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
export declare class RecentSearchService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService);
    recordSearch(passengerId: string, originCity: string, destinationCity: string): Promise<{
        passengerId: string;
        originCity: string;
        destinationCity: string;
        searchedOn: string;
    }>;
    getRecent(passengerId: string, limit?: number): Promise<{
        id: string;
        origin_city: string;
        destination_city: string;
        searched_on: Date;
    }[]>;
}
