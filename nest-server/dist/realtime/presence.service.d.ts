import { RedisService } from '../redis/redis.service.js';
import type { RealtimeGateway } from './realtime.gateway.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';
export declare const PRESENCE_TTL_SECONDS = 60;
export declare class PresenceService {
    private readonly redis;
    private readonly realtime;
    private readonly metrics;
    private readonly logger;
    private readonly pendingOffline;
    constructor(redis: RedisService, realtime: RealtimeGateway, metrics: RealtimeMetricsService);
    private key;
    private emitStatus;
    markOnline(userId: string, role: string): Promise<void>;
    scheduleOffline(userId: string, role: string): void;
    getStatus(userId: string): Promise<'online' | 'offline'>;
}
