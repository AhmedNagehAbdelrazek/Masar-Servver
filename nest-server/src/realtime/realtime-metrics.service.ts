import { Injectable } from '@nestjs/common';

// Nest port of Main Server/Services/realtimeMetrics.ts: per-process
// observability for the realtime surface. Snapshot shape matches Express
// `GET /api/health/realtime` (see contracts/metrics-contracts.md).
//
// MULTI-INSTANCE CAVEAT (same as Express): counters are per-process. With
// the Redis pub/sub adapter they drift across instances; `active_connections`
// reads the local engine when `io` is passed, otherwise the local counter.
// For true cluster-wide totals use a shared Redis INCR counter
// (`metrics:...`) as the documented follow-up (Express research R11).
const WINDOW_MS = 60 * 1000;
const SLOW_DELIVERY_MS = 1000;
const MAX_SAMPLES = 1000;
const ALERT_THRESHOLD = 0.05;

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
  engine?: { clientsCount?: number };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

@Injectable()
export class RealtimeMetricsService {
  private startedAt = Date.now();
  private connections = { current: 0, peak: 0, total: 0 };
  private activeUsers = new Set<string>();
  private connectionAttempts: Array<{ t: number; ok: boolean }> = [];
  private deliveries = { total: 0, samples: [] as Array<{ t: number; ms: number }> };
  private failures = 0;
  private rateLimited = 0;
  private reconnects = { total: 0, samples: [] as Array<{ t: number }> };
  private lastAlertedAt: string | null = null;
  private alertActive = false;
  private events: Record<string, number> = {};

  private pruneWindow(): void {
    const cutoff = Date.now() - WINDOW_MS;
    while (this.connectionAttempts.length > 0 && this.connectionAttempts[0].t < cutoff) {
      this.connectionAttempts.shift();
    }
    while (this.deliveries.samples.length > 0 && this.deliveries.samples[0].t < cutoff) {
      this.deliveries.samples.shift();
    }
    while (this.reconnects.samples.length > 0 && this.reconnects.samples[0].t < cutoff) {
      this.reconnects.samples.shift();
    }
  }

  recordConnection(userId?: string): void {
    this.connections.total += 1;
    this.connections.current += 1;
    if (this.connections.current > this.connections.peak) {
      this.connections.peak = this.connections.current;
    }
    if (userId) this.activeUsers.add(userId);
    this.connectionAttempts.push({ t: Date.now(), ok: true });
  }

  recordDisconnection(userId?: string): void {
    this.connections.current = Math.max(0, this.connections.current - 1);
    if (userId) this.activeUsers.delete(userId);
  }

  recordConnectionFailure(): void {
    this.connectionAttempts.push({ t: Date.now(), ok: false });
  }

  recordReconnect(): void {
    this.reconnects.total += 1;
    this.reconnects.samples.push({ t: Date.now() });
  }

  recordDelivery(latencyMs = 0): void {
    this.deliveries.total += 1;
    this.deliveries.samples.push({ t: Date.now(), ms: latencyMs });
    if (this.deliveries.samples.length > MAX_SAMPLES) {
      this.deliveries.samples.splice(0, this.deliveries.samples.length - MAX_SAMPLES);
    }
  }

  recordFailure(): void {
    this.failures += 1;
  }

  recordRateLimited(): void {
    this.rateLimited += 1;
  }

  recordEvent(name: string): void {
    this.events[name] = (this.events[name] || 0) + 1;
  }

  eventCount(name: string): number {
    return this.events[name] || 0;
  }

  private maybeAlert(reason: string, detail: unknown): void {
    const now = new Date();
    if (!this.alertActive) {
      this.alertActive = true;
      this.lastAlertedAt = now.toISOString();
      console.error(
        JSON.stringify({
          level: 'error',
          type: 'realtime_alert',
          reason,
          detail,
          at: now.toISOString(),
        }),
      );
    }
  }

  getSnapshot(io?: EngineLike | null): RealtimeSnapshot {
    this.pruneWindow();

    const recent = this.deliveries.samples;
    const latencies = recent.map((s) => s.ms).sort((a, b) => a - b);
    const delivered1s = recent.filter((s) => s.ms <= SLOW_DELIVERY_MS).length;
    const windowAttempts = this.connectionAttempts;
    const windowFailures = windowAttempts.filter((a) => !a.ok).length;

    const deliverySlowRate =
      recent.length > 0 ? recent.filter((s) => s.ms > SLOW_DELIVERY_MS).length / recent.length : 0;
    const connectionFailureRate = windowAttempts.length > 0 ? windowFailures / windowAttempts.length : 0;

    const reconnectRate1m =
      (this.reconnects.samples.length + (windowAttempts.length > 0 ? windowFailures : 0)) /
      Math.max(1, this.connections.total + windowFailures);

    const activeConnections =
      io?.engine && typeof io.engine.clientsCount === 'number'
        ? io.engine.clientsCount
        : this.connections.current;

    const slowAlert = deliverySlowRate > ALERT_THRESHOLD;
    const connAlert = connectionFailureRate > ALERT_THRESHOLD;
    if (slowAlert) {
      this.maybeAlert('delivery_slow_rate', { rate: deliverySlowRate, threshold: ALERT_THRESHOLD });
    }
    if (connAlert) {
      this.maybeAlert('connection_failure_rate', { rate: connectionFailureRate, threshold: ALERT_THRESHOLD });
    }
    if (!slowAlert && !connAlert && this.alertActive) {
      this.alertActive = false;
    }

    return {
      active_connections: activeConnections,
      active_users: this.activeUsers.size,
      events_delivered_total: this.deliveries.total,
      events_delivered_1s: delivered1s,
      delivery_p99_ms: percentile(latencies, 0.99),
      delivery_p95_ms: percentile(latencies, 0.95),
      reconnects_total: this.reconnects.total,
      reconnect_rate_1m: Number(reconnectRate1m.toFixed(4)),
      rate_limited_total: this.rateLimited,
      failures_total: this.failures,
      alerting: {
        failure_alert_active: this.alertActive,
        last_alerted_at: this.lastAlertedAt,
      },
    };
  }

  reset(): void {
    this.startedAt = Date.now();
    this.connections = { current: 0, peak: 0, total: 0 };
    this.activeUsers = new Set<string>();
    this.connectionAttempts = [];
    this.deliveries = { total: 0, samples: [] };
    this.failures = 0;
    this.rateLimited = 0;
    this.reconnects = { total: 0, samples: [] };
    this.lastAlertedAt = null;
    this.alertActive = false;
    this.events = {};
  }
}
