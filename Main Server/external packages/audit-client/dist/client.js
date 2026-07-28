"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditClient = void 0;
const node_crypto_1 = require("node:crypto");
const redact_1 = require("./redact");
const sign_1 = require("./sign");
class AuditClient {
    config;
    eventQueue = [];
    spanQueue = [];
    timer = null;
    flushing = false;
    constructor(config) {
        this.config = {
            batchSize: 100,
            flushIntervalMs: 1000,
            maxQueueSize: 10000,
            enabled: true,
            instanceId: undefined,
            ...config,
        };
        this.timer = setInterval(() => {
            void this.flush().catch((err) => console.error('[audit-client] flush error', err));
        }, this.config.flushIntervalMs);
    }
    track(input) {
        if (!this.config.enabled)
            return;
        try {
            const now = new Date().toISOString();
            const event = {
                id: (0, node_crypto_1.randomUUID)(),
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
                query: input.request?.query,
                ip: input.request?.ip,
                user_agent: input.request?.user_agent,
                status_code: input.request?.status_code,
                duration_ms: input.request?.duration_ms,
                payload: input.payload ? (0, redact_1.redact)(input.payload) : undefined,
                metadata: input.metadata ? (0, redact_1.redact)(input.metadata) : undefined,
                error: input.error,
                idempotency_key: input.idempotency_key,
            };
            this.eventQueue.push(event);
            this.trimQueue();
            void this.maybeFlush();
        }
        catch (err) {
            console.error('[audit-client] track error', err);
        }
    }
    trackSpan(span) {
        if (!this.config.enabled)
            return;
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
    trimQueue() {
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
    async maybeFlush() {
        const batchSize = this.config.batchSize ?? 100;
        if (this.eventQueue.length + this.spanQueue.length >= batchSize) {
            await this.flush();
        }
    }
    async flush() {
        if (this.flushing)
            return;
        if (this.eventQueue.length === 0 && this.spanQueue.length === 0)
            return;
        this.flushing = true;
        const events = this.eventQueue.splice(0, this.eventQueue.length);
        const spans = this.spanQueue.splice(0, this.spanQueue.length);
        try {
            await this.send({ events, spans });
        }
        catch (err) {
            this.eventQueue.unshift(...events);
            this.spanQueue.unshift(...spans);
            console.error('[audit-client] send failed', err);
        }
        finally {
            this.flushing = false;
        }
    }
    async send(payload) {
        const body = JSON.stringify(payload);
        const headers = (0, sign_1.signAuditRequest)({
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
    async close() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.flush();
    }
}
exports.AuditClient = AuditClient;
//# sourceMappingURL=client.js.map