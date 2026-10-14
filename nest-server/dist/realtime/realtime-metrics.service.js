var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
const WINDOW_MS = 60 * 1000;
const SLOW_DELIVERY_MS = 1000;
const MAX_SAMPLES = 1000;
const ALERT_THRESHOLD = 0.05;
function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
}
let RealtimeMetricsService = class RealtimeMetricsService {
    startedAt = Date.now();
    connections = { current: 0, peak: 0, total: 0 };
    activeUsers = new Set();
    connectionAttempts = [];
    deliveries = { total: 0, samples: [] };
    failures = 0;
    rateLimited = 0;
    reconnects = { total: 0, samples: [] };
    lastAlertedAt = null;
    alertActive = false;
    events = {};
    pruneWindow() {
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
    recordConnection(userId) {
        this.connections.total += 1;
        this.connections.current += 1;
        if (this.connections.current > this.connections.peak) {
            this.connections.peak = this.connections.current;
        }
        if (userId)
            this.activeUsers.add(userId);
        this.connectionAttempts.push({ t: Date.now(), ok: true });
    }
    recordDisconnection(userId) {
        this.connections.current = Math.max(0, this.connections.current - 1);
        if (userId)
            this.activeUsers.delete(userId);
    }
    recordConnectionFailure() {
        this.connectionAttempts.push({ t: Date.now(), ok: false });
    }
    recordReconnect() {
        this.reconnects.total += 1;
        this.reconnects.samples.push({ t: Date.now() });
    }
    recordDelivery(latencyMs = 0) {
        this.deliveries.total += 1;
        this.deliveries.samples.push({ t: Date.now(), ms: latencyMs });
        if (this.deliveries.samples.length > MAX_SAMPLES) {
            this.deliveries.samples.splice(0, this.deliveries.samples.length - MAX_SAMPLES);
        }
    }
    recordFailure() {
        this.failures += 1;
    }
    recordRateLimited() {
        this.rateLimited += 1;
    }
    recordEvent(name) {
        this.events[name] = (this.events[name] || 0) + 1;
    }
    eventCount(name) {
        return this.events[name] || 0;
    }
    maybeAlert(reason, detail) {
        const now = new Date();
        if (!this.alertActive) {
            this.alertActive = true;
            this.lastAlertedAt = now.toISOString();
            console.error(JSON.stringify({
                level: 'error',
                type: 'realtime_alert',
                reason,
                detail,
                at: now.toISOString(),
            }));
        }
    }
    getSnapshot(io) {
        this.pruneWindow();
        const recent = this.deliveries.samples;
        const latencies = recent.map((s) => s.ms).sort((a, b) => a - b);
        const delivered1s = recent.filter((s) => s.ms <= SLOW_DELIVERY_MS).length;
        const windowAttempts = this.connectionAttempts;
        const windowFailures = windowAttempts.filter((a) => !a.ok).length;
        const deliverySlowRate = recent.length > 0 ? recent.filter((s) => s.ms > SLOW_DELIVERY_MS).length / recent.length : 0;
        const connectionFailureRate = windowAttempts.length > 0 ? windowFailures / windowAttempts.length : 0;
        const reconnectRate1m = (this.reconnects.samples.length + (windowAttempts.length > 0 ? windowFailures : 0)) /
            Math.max(1, this.connections.total + windowFailures);
        const activeConnections = io?.engine && typeof io.engine.clientsCount === 'number'
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
    reset() {
        this.startedAt = Date.now();
        this.connections = { current: 0, peak: 0, total: 0 };
        this.activeUsers = new Set();
        this.connectionAttempts = [];
        this.deliveries = { total: 0, samples: [] };
        this.failures = 0;
        this.rateLimited = 0;
        this.reconnects = { total: 0, samples: [] };
        this.lastAlertedAt = null;
        this.alertActive = false;
        this.events = {};
    }
};
RealtimeMetricsService = __decorate([
    Injectable()
], RealtimeMetricsService);
export { RealtimeMetricsService };
//# sourceMappingURL=realtime-metrics.service.js.map