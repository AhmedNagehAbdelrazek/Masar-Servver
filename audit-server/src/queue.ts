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

export class InMemoryAuditQueue implements AuditQueue {
  private buffer: AuditQueuePayload[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly flushFn: (payloads: AuditQueuePayload[]) => Promise<void>;
  private readonly bufferSize: number;
  private readonly flushIntervalMs: number;

  constructor(params: {
    flushFn: (payloads: AuditQueuePayload[]) => Promise<void>;
    bufferSize?: number;
    flushIntervalMs?: number;
  }) {
    this.flushFn = params.flushFn;
    this.bufferSize = params.bufferSize ?? 1000;
    this.flushIntervalMs = params.flushIntervalMs ?? 3000;

    this.timer = setInterval(() => {
      void this.flush().catch((err) => {
        console.error('[audit-queue] flush error', err);
      });
    }, this.flushIntervalMs);
  }

  async add(payload: AuditQueuePayload): Promise<void> {
    this.buffer.push(payload);
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const toFlush = this.buffer.splice(0, this.buffer.length);
    try {
      await this.flushFn(toFlush);
    } catch (err) {
      console.error('[audit-queue] flush failed, re-queuing', err);
      this.buffer.unshift(...toFlush);
    }
  }
}
