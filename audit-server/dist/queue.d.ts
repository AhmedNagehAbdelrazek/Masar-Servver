import { AuthenticatedService } from './auth';
export interface AuditQueuePayload {
    service: AuthenticatedService;
    events: Record<string, unknown>[];
    spans: Record<string, unknown>[];
}
export interface AuditQueue {
    add(payload: AuditQueuePayload): Promise<void>;
    close(): Promise<void>;
}
export declare class InMemoryAuditQueue implements AuditQueue {
    private buffer;
    private timer;
    private readonly flushFn;
    private readonly bufferSize;
    private readonly flushIntervalMs;
    constructor(params: {
        flushFn: (payloads: AuditQueuePayload[]) => Promise<void>;
        bufferSize?: number;
        flushIntervalMs?: number;
    });
    add(payload: AuditQueuePayload): Promise<void>;
    close(): Promise<void>;
    private flush;
}
//# sourceMappingURL=queue.d.ts.map