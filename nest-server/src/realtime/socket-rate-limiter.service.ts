import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';

// Port of Main Server/Services/socketRateLimiter.ts. Fails open when Redis
// is unavailable. Tracking locations: 1 per 2s per driver.
const LIMITS: Record<string, { max: number; windowSeconds: number }> = {
  chat: { max: 10, windowSeconds: 10 },
  location: { max: 1, windowSeconds: 2 },
  presence: { max: 60, windowSeconds: 60 },
  sos: { max: 5, windowSeconds: 60 },
  typing: { max: 20, windowSeconds: 10 },
  read: { max: 60, windowSeconds: 10 },
};

@Injectable()
export class SocketRateLimiter {
  private readonly logger = new Logger(SocketRateLimiter.name);

  constructor(private readonly redis: RedisService) {}

  async checkRateLimit(
    scope: string,
    limitKey: string,
    userId: string,
  ): Promise<{ allowed: boolean; count: number }> {
    const rule = LIMITS[limitKey] ?? { max: 30, windowSeconds: 60 };
    const key = `ratelimit:${scope}:${limitKey}:${userId}`;
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        try {
          await this.redis.connection.expire(key, rule.windowSeconds);
        } catch {
          // best-effort
        }
      }
      return { allowed: count <= rule.max, count };
    } catch (err) {
      this.logger.warn(`rate limiter failed open: ${(err as Error).message}`);
      return { allowed: true, count: 0 };
    }
  }
}
