var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SocketRateLimiter_1;
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
const LIMITS = {
    chat: { max: 10, windowSeconds: 10 },
    location: { max: 1, windowSeconds: 2 },
    presence: { max: 60, windowSeconds: 60 },
    sos: { max: 5, windowSeconds: 60 },
    typing: { max: 20, windowSeconds: 10 },
    read: { max: 60, windowSeconds: 10 },
    supportChat: { max: 10, windowSeconds: 10 },
    admin: { max: 60, windowSeconds: 60 },
};
let SocketRateLimiter = SocketRateLimiter_1 = class SocketRateLimiter {
    redis;
    logger = new Logger(SocketRateLimiter_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async checkRateLimit(scope, limitKey, userId) {
        const rule = LIMITS[limitKey] ?? { max: 30, windowSeconds: 60 };
        const key = `ratelimit:${scope}:${limitKey}:${userId}`;
        try {
            const count = await this.redis.incr(key);
            if (count === 1) {
                try {
                    await this.redis.connection.expire(key, rule.windowSeconds);
                }
                catch {
                }
            }
            return { allowed: count <= rule.max, count };
        }
        catch (err) {
            this.logger.warn(`rate limiter failed open: ${err.message}`);
            return { allowed: true, count: 0 };
        }
    }
};
SocketRateLimiter = SocketRateLimiter_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], SocketRateLimiter);
export { SocketRateLimiter };
//# sourceMappingURL=socket-rate-limiter.service.js.map