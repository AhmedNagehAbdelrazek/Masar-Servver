"use strict";
/**
 * Per-process observability for the realtime service. Snapshot shape follows
 * contracts/metrics-contracts.md (`GET /api/health/realtime`).
 *
 * Counters are per-process: with the Redis pub/sub adapter they can drift
 * across instances. `active_connections` reads the local engine; for true
 * cluster-wide totals a shared Redis INCR counter (`metrics:...`) is the
 * documented follow-up (see research R11).
 *
 * Alerting (log-based): when >5% of sampled deliveries exceed 1s or >5% of
 * connection attempts fail within a 60s window, a high-severity structured
 * log is emitted and `alerting.failure_alert_active` is set until the window
 * recovers.
 */
const WINDOW_MS = 60 * 1000;
const SLOW_DELIVERY_MS = 1000;
const MAX_SAMPLES = 1000;
const ALERT_THRESHOLD = 0.05;
const state = {
    startedAt: Date.now(),
    connections: { current: 0, peak: 0, total: 0 },
    activeUsers: new Set(),
    connectionAttempts: [], // { t, ok } — handshake outcomes within the window
    deliveries: {
        total: 0,
        samples: [], // { t, ms }
    },
    failures: 0,
    rateLimited: 0,
    reconnects: { total: 0, samples: [] }, // { t } within the window
    lastAlertedAt: null,
    alertActive: false,
    events: {},
};
function pruneWindow() {
    const cutoff = Date.now() - WINDOW_MS;
    while (state.connectionAttempts.length && state.connectionAttempts[0].t < cutoff) {
        state.connectionAttempts.shift();
    }
    while (state.deliveries.samples.length && state.deliveries.samples[0].t < cutoff) {
        state.deliveries.samples.shift();
    }
    while (state.reconnects.samples.length && state.reconnects.samples[0].t < cutoff) {
        state.reconnects.samples.shift();
    }
}
function recordConnection(userId) {
    state.connections.total += 1;
    state.connections.current += 1;
    if (state.connections.current > state.connections.peak) {
        state.connections.peak = state.connections.current;
    }
    if (userId)
        state.activeUsers.add(userId);
    state.connectionAttempts.push({ t: Date.now(), ok: true });
}
function recordDisconnection(userId) {
    state.connections.current = Math.max(0, state.connections.current - 1);
    if (userId) {
        state.activeUsers.delete(userId);
    }
}
function recordConnectionFailure() {
    state.connectionAttempts.push({ t: Date.now(), ok: false });
}
function recordReconnect() {
    state.reconnects.total += 1;
    state.reconnects.samples.push({ t: Date.now() });
}
function recordDelivery(latencyMs = 0) {
    state.deliveries.total += 1;
    state.deliveries.samples.push({ t: Date.now(), ms: latencyMs });
    if (state.deliveries.samples.length > MAX_SAMPLES) {
        state.deliveries.samples.splice(0, state.deliveries.samples.length - MAX_SAMPLES);
    }
}
function recordFailure() {
    state.failures += 1;
}
function recordRateLimited() {
    state.rateLimited += 1;
}
function recordEvent(name) {
    state.events[name] = (state.events[name] || 0) + 1;
}
function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const idx = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
}
function maybeAlert(reason, detail) {
    const now = new Date();
    if (!state.alertActive) {
        state.alertActive = true;
        state.lastAlertedAt = now.toISOString();
        console.error(JSON.stringify({
            level: 'error',
            type: 'realtime_alert',
            reason,
            detail,
            at: now.toISOString(),
        }));
    }
}
function getSnapshot(io) {
    pruneWindow();
    const recent = state.deliveries.samples;
    const latencies = recent.map((s) => s.ms).sort((a, b) => a - b);
    const delivered1s = recent.filter((s) => s.ms <= SLOW_DELIVERY_MS).length;
    const windowAttempts = state.connectionAttempts;
    const windowFailures = windowAttempts.filter((a) => !a.ok).length;
    const deliverySlowRate = recent.length > 0
        ? recent.filter((s) => s.ms > SLOW_DELIVERY_MS).length / recent.length
        : 0;
    const connectionFailureRate = windowAttempts.length > 0 ? windowFailures / windowAttempts.length : 0;
    const reconnectRate1m = (state.reconnects.samples.length +
        (windowAttempts.length > 0 ? windowFailures : 0)) /
        Math.max(1, state.connections.total + windowFailures);
    const activeConnections = io && io.engine ? io.engine.clientsCount : state.connections.current;
    const slowAlert = deliverySlowRate > ALERT_THRESHOLD;
    const connAlert = connectionFailureRate > ALERT_THRESHOLD;
    if (slowAlert) {
        maybeAlert('delivery_slow_rate', { rate: deliverySlowRate, threshold: ALERT_THRESHOLD });
    }
    if (connAlert) {
        maybeAlert('connection_failure_rate', { rate: connectionFailureRate, threshold: ALERT_THRESHOLD });
    }
    if (!slowAlert && !connAlert && state.alertActive) {
        state.alertActive = false;
    }
    return {
        active_connections: activeConnections,
        active_users: state.activeUsers.size,
        events_delivered_total: state.deliveries.total,
        events_delivered_1s: delivered1s,
        delivery_p99_ms: percentile(latencies, 0.99),
        delivery_p95_ms: percentile(latencies, 0.95),
        reconnects_total: state.reconnects.total,
        reconnect_rate_1m: Number(reconnectRate1m.toFixed(4)),
        rate_limited_total: state.rateLimited,
        failures_total: state.failures,
        alerting: {
            failure_alert_active: state.alertActive,
            last_alerted_at: state.lastAlertedAt,
        },
    };
}
function reset() {
    state.startedAt = Date.now();
    state.connections = { current: 0, peak: 0, total: 0 };
    state.activeUsers = new Set();
    state.connectionAttempts = [];
    state.deliveries = { total: 0, samples: [] };
    state.failures = 0;
    state.rateLimited = 0;
    state.reconnects = { total: 0, samples: [] };
    state.lastAlertedAt = null;
    state.alertActive = false;
    state.events = {};
}
module.exports = {
    recordConnection,
    recordDisconnection,
    recordConnectionFailure,
    recordReconnect,
    recordDelivery,
    recordFailure,
    recordRateLimited,
    recordEvent,
    getSnapshot,
    reset,
    WINDOW_MS,
    SLOW_DELIVERY_MS,
    ALERT_THRESHOLD,
};
//# sourceMappingURL=realtimeMetrics.js.map