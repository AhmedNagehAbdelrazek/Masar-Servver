export declare class HealthController {
    healthz(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    realtime(): {
        status: string;
        timestamp: string;
    };
}
