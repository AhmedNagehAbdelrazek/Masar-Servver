import { randomUUID } from 'node:crypto';
import { AuditEvent, AuditEventInput, TraceSpan, TraceSpanInput } from './types';
import { redact } from './redact';
import { signAuditRequest } from './sign';

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
  maxBatchBytes?: number;
}

export class AuditClient {
  readonly config: Required<
    Pick<
      AuditClientConfig,
      'serviceId' | 'serviceName' | 'environment' | 'collectorUrl' | 'clientKey' | 'clientSecret'
    >
  > & Omit<AuditClientConfig, 'serviceId' | 'serviceName' | 'environment' | 'collectorUrl' | 'clientKey' | 'clientSecret'>;

  private eventQueue: AuditEvent[] = [];
  private spanQueue: TraceSpan[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(config: AuditClientConfig) {
    this.config = {
      batchSize: 100,
      flushIntervalMs: 1000,
      maxQueueSize: 10000,
      maxBatchBytes: 1536 * 1024,
      enabled: true,
      instanceId: undefined,
      ...config,
    };

    this.timer = setInterval(() => {
      void this.flush().catch((err) => console.error('[audit-client] flush error', err));
    }, this.config.flushIntervalMs);
  }

  track(input: AuditEventInput): void {
    if (!this.config.enabled) return;

    try {
      const now = new Date().toISOString();

      const event: AuditEvent = {
        id: randomUUID(),
        schema_version: '1.0',
        service_id: this.config.serviceId,
        service_name: this.config.serviceName,
        environment: this.config.environment,
        instance_id: this.config.instanceId,
        event_type: input.event_type ?? 'domain.event',
        event_time: now,
        action: input.action,
        outcome: input.outcome ?? 'success',
        actor_type: input.actor?.type,
        actor_id: input.actor?.id,
        actor_role: input.actor?.role,
        resource_type: input.resource?.type,
        resource_id: input.resource?.id,
        resource_label: input.resource?.label,
        trace_id: input.request?.trace_id,
        request_id: input.request?.request_id,
        correlation_id: input.request?.correlation_id,
        span_id: input.request?.span_id,
        parent_span_id: input.request?.parent_span_id,
        caller_service: input.request?.caller_service,
        method: input.request?.method,
        path: input.request?.path,
        route: input.request?.route,
        query: input.request?.query as Record<string, unknown> | undefined,
        ip: input.request?.ip,
        user_agent: input.request?.user_agent,
        status_code: input.request?.status_code,
        duration_ms: input.request?.duration_ms,
        payload: input.payload ? (redact(input.payload) as Record<string, unknown>) : undefined,
        metadata: input.metadata ? (redact(input.metadata) as Record<string, unknown>) : undefined,
        error: input.error,
        idempotency_key: input.idempotency_key,
      };

      this.eventQueue.push(event);
      this.trimQueue();
      void this.maybeFlush();
    } catch (err) {
      console.error('[audit-client] track error', err);
    }
  }

  trackSpan(span: TraceSpanInput): void {
    if (!this.config.enabled) return;

    this.spanQueue.push({
      ...span,
      service_id: this.config.serviceId,
      service_name: this.config.serviceName,
      environment: this.config.environment,
      instance_id: this.config.instanceId,
    });

    this.trimQueue();
    void this.maybeFlush();
  }

  private trimQueue(): void {
    const maxQueueSize = this.config.maxQueueSize ?? 10000;
    if (this.eventQueue.length > maxQueueSize) {
      const dropped = this.eventQueue.length - maxQueueSize;
      this.eventQueue.splice(0, dropped);
      console.error(`[audit-client] dropped ${dropped} events`);
    }
    if (this.spanQueue.length > maxQueueSize) {
      const dropped = this.spanQueue.length - maxQueueSize;
      this.spanQueue.splice(0, dropped);
      console.error(`[audit-client] dropped ${dropped} spans`);
    }
  }

  private async maybeFlush(): Promise<void> {
    const batchSize = this.config.batchSize ?? 100;
    if (this.eventQueue.length + this.spanQueue.length >= batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    if (this.eventQueue.length === 0 && this.spanQueue.length === 0) return;

    this.flushing = true;
    const events = this.eventQueue.splice(0, this.eventQueue.length);
    const spans = this.spanQueue.splice(0, this.spanQueue.length);

    try {
      const chunks = this.createChunks(events, spans);
      for (const chunk of chunks) {
        await this.send(chunk);
      }
    } catch (err) {
      this.eventQueue.unshift(...events);
      this.spanQueue.unshift(...spans);
      console.error('[audit-client] send failed', err);
    } finally {
      this.flushing = false;
    }
  }

  private createChunks(
    events: AuditEvent[],
    spans: TraceSpan[]
  ): { events: AuditEvent[]; spans: TraceSpan[] }[] {
    const maxBatchBytes = this.config.maxBatchBytes ?? 1536 * 1024;
    const chunks: { events: AuditEvent[]; spans: TraceSpan[] }[] = [];
    let current: { events: AuditEvent[]; spans: TraceSpan[] } = { events: [], spans: [] };
    let currentBytes = 0;

    const flushCurrent = (): void => {
      if (current.events.length > 0 || current.spans.length > 0) {
        chunks.push(current);
        current = { events: [], spans: [] };
        currentBytes = 0;
      }
    };

    for (const event of events) {
      const itemBytes = Buffer.byteLength(JSON.stringify(event));
      if (current.events.length > 0 && currentBytes + itemBytes > maxBatchBytes) {
        flushCurrent();
      }
      current.events.push(event);
      currentBytes += itemBytes;
    }

    for (const span of spans) {
      const itemBytes = Buffer.byteLength(JSON.stringify(span));
      if (current.spans.length > 0 && currentBytes + itemBytes > maxBatchBytes) {
        flushCurrent();
      }
      current.spans.push(span);
      currentBytes += itemBytes;
    }

    flushCurrent();
    return chunks;
  }

  private async send(payload: { events: AuditEvent[]; spans: TraceSpan[] }): Promise<void> {
    const body = JSON.stringify(payload);
    const headers = signAuditRequest({
      serviceId: this.config.serviceId,
      clientKey: this.config.clientKey,
      clientSecret: this.config.clientSecret,
      body,
    });

    const response = await fetch(`${this.config.collectorUrl}/v1/audit/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    });

    if (!response.ok) {
      throw new Error(`Audit collector responded ${response.status}`);
    }
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}
