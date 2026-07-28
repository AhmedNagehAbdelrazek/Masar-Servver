import { AsyncLocalStorage } from 'node:async_hooks';
export interface TraceContext {
    trace_id: string;
    request_id: string;
    correlation_id: string;
    span_id: string;
    parent_span_id?: string;
    caller_service?: string;
}
export declare const traceStorage: AsyncLocalStorage<TraceContext>;
export declare function getTraceContext(): TraceContext | undefined;
//# sourceMappingURL=context.d.ts.map