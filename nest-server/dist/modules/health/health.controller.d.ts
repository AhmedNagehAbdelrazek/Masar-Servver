import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService, type RealtimeSnapshot } from '../../realtime/realtime-metrics.service.js';
export declare class HealthController {
    private readonly metrics;
    private readonly gateway;
    constructor(metrics: RealtimeMetricsService, gateway: RealtimeGateway);
    healthz(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    realtime(): RealtimeSnapshot;
}
