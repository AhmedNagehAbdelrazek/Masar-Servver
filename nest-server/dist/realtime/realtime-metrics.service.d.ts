export interface RealtimeSnapshot {
    active_connections: number;
    active_users: number;
    events_delivered_total: number;
    events_delivered_1s: number;
    delivery_p99_ms: number;
    delivery_p95_ms: number;
    reconnects_total: number;
    reconnect_rate_1m: number;
    rate_limited_total: number;
    failures_total: number;
    alerting: {
        failure_alert_active: boolean;
        last_alerted_at: string | null;
    };
}
interface EngineLike {
    engine?: {
        clientsCount?: number;
    };
}
export declare class RealtimeMetricsService {
    private startedAt;
    private connections;
    private activeUsers;
    private connectionAttempts;
    private deliveries;
    private failures;
    private rateLimited;
    private reconnects;
    private lastAlertedAt;
    private alertActive;
    private events;
    private pruneWindow;
    recordConnection(userId?: string): void;
    recordDisconnection(userId?: string): void;
    recordConnectionFailure(): void;
    recordReconnect(): void;
    recordDelivery(latencyMs?: number): void;
    recordFailure(): void;
    recordRateLimited(): void;
    recordEvent(name: string): void;
    eventCount(name: string): number;
    private maybeAlert;
    getSnapshot(io?: EngineLike | null): RealtimeSnapshot;
    reset(): void;
}
export {};
