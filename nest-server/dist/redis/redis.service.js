var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
let RedisService = RedisService_1 = class RedisService {
    config;
    logger = new Logger(RedisService_1.name);
    client;
    constructor(config) {
        this.config = config;
        const host = this.config.get('redis.host', '127.0.0.1');
        const port = this.config.get('redis.port', 6380);
        const password = this.config.get('redis.password');
        this.client = new Redis({
            host,
            port,
            password,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
            lazyConnect: process.env.NODE_ENV === 'test',
        });
        this.client.on('connect', () => this.logger.log('Redis connected'));
        this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
    }
    get connection() {
        return this.client;
    }
    async setKey(key, value, ttlSeconds) {
        if (ttlSeconds)
            await this.client.set(key, value, 'EX', ttlSeconds);
        else
            await this.client.set(key, value);
    }
    async getKey(key) {
        return this.client.get(key);
    }
    async deleteKey(...keys) {
        if (keys.length === 0)
            return 0;
        return this.client.del(...keys);
    }
    async exists(key) {
        return (await this.client.exists(key)) === 1;
    }
    async incr(key) {
        return this.client.incr(key);
    }
    async onModuleDestroy() {
        try {
            this.client.disconnect();
        }
        catch {
        }
    }
};
RedisService = RedisService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], RedisService);
export { RedisService };
//# sourceMappingURL=redis.service.js.map