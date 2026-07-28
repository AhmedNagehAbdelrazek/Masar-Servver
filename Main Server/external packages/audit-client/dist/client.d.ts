import { AuditEventInput, TraceSpanInput } from './types';
export interface AuditClientConfig {
    serviceId: string;
    serviceName: string;
    environment: string;
    instanceId?: string;
    collectorUrl: string;
    clientKey: string;
    clientSecret: string;
    enabled?: boolean;
    batchSize?: number;
    flushIntervalMs?: number;
    maxQueueSize?: number;
}
export declare class AuditClient {
    readonly config: Required<Pick<AuditClientConfig, 'serviceId' | 'serviceName' | 'environment' | 'collectorUrl' | 'clientKey' | 'clientSecret'>> & Omit<AuditClientConfig, 'serviceId' | 'serviceName' | 'environment' | 'collectorUrl' | 'clientKey' | 'clientSecret'>;
    private eventQueue;
    private spanQueue;
    private timer;
    private flushing;
    constructor(config: AuditClientConfig);
    track(input: AuditEventInput): void;
    trackSpan(span: TraceSpanInput): void;
    private trimQueue;
    private maybeFlush;
    flush(): Promise<void>;
    private send;
    close(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map