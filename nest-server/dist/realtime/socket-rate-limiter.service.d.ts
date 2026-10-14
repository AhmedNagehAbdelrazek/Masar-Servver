import { RedisService } from '../redis/redis.service.js';
export declare class SocketRateLimiter {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    checkRateLimit(scope: string, limitKey: string, userId: string): Promise<{
        allowed: boolean;
        count: number;
    }>;
}
