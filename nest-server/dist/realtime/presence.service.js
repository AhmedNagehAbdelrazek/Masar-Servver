var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PresenceService_1;
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { RealtimeGateway as RealtimeGatewayToken } from './realtime.gateway.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';
export const PRESENCE_TTL_SECONDS = 60;
const GRACE_MS = 60 * 1000;
let PresenceService = PresenceService_1 = class PresenceService {
    redis;
    realtime;
    metrics;
    logger = new Logger(PresenceService_1.name);
    pendingOffline = new Map();
    constructor(redis, realtime, metrics) {
        this.redis = redis;
        this.realtime = realtime;
        this.metrics = metrics;
    }
    key(userId) {
        return `presence:${userId}`;
    }
    emitStatus(userId, role, status, lastSeen) {
        try {
            const last_seen = lastSeen ?? new Date().toISOString();
            this.realtime.emitToRole(role, 'presence:status', {
                user_id: userId,
                status,
                last_seen,
                timestamp: Date.now(),
            });
            if (status === 'online' && role === 'driver') {
                this.realtime.emitToRole('admin', 'admin:driver_online', {
                    driver_id: userId,
                    lat: null,
                    lng: null,
                    timestamp: Date.now(),
                });
            }
        }
        catch (err) {
            this.logger.warn(`presence emit failed: ${err.message}`);
        }
    }
    async markOnline(userId, role) {
        const pending = this.pendingOffline.get(userId);
        if (pending) {
            clearTimeout(pending);
            this.pendingOffline.delete(userId);
        }
        try {
            await this.redis.setKey(this.key(userId), 'online', PRESENCE_TTL_SECONDS);
        }
        catch (err) {
            this.logger.warn(`presence write failed: ${err.message}`);
        }
        this.emitStatus(userId, role, 'online');
        this.metrics.recordEvent('presence:online');
    }
    scheduleOffline(userId, role) {
        if (this.pendingOffline.has(userId)) {
            clearTimeout(this.pendingOffline.get(userId));
        }
        const timer = setTimeout(() => {
            this.pendingOffline.delete(userId);
            void this.redis.deleteKey(this.key(userId)).catch(() => undefined);
            this.emitStatus(userId, role, 'offline');
            this.metrics.recordEvent('presence:offline');
        }, GRACE_MS);
        timer.unref?.();
        this.pendingOffline.set(userId, timer);
    }
    async getStatus(userId) {
        try {
            return (await this.redis.getKey(this.key(userId))) === 'online' ? 'online' : 'offline';
        }
        catch {
            return 'offline';
        }
    }
};
PresenceService = PresenceService_1 = __decorate([
    Injectable(),
    __param(1, Inject(forwardRef(() => RealtimeGatewayToken))),
    __metadata("design:paramtypes", [RedisService, Function, RealtimeMetricsService])
], PresenceService);
export { PresenceService };
//# sourceMappingURL=presence.service.js.map