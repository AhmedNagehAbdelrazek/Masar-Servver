"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertAuditBatch = insertAuditBatch;
async function insertAuditBatch(pool, payloads) {
    const allEvents = [];
    const allSpans = [];
    for (const payload of payloads) {
        for (const event of payload.events) {
            allEvents.push({
                ...event,
                service_id: payload.service.serviceId,
                service_name: payload.service.serviceName,
                environment: payload.service.environment,
            });
        }
        for (const span of payload.spans) {
            allSpans.push({
                ...span,
                service_id: payload.service.serviceId,
                service_name: payload.service.serviceName,
                environment: payload.service.environment,
            });
        }
    }
    await insertEvents(pool, allEvents);
    await insertSpans(pool, allSpans);
}
async function insertEvents(pool, events) {
    if (!events.length)
        return;
    const columns = [
        'id', 'schema_version', 'service_id', 'service_name', 'environment',
        'instance_id', 'event_type', 'event_time', 'action', 'outcome',
        'actor_type', 'actor_id', 'actor_role', 'resource_type', 'resource_id',
        'resource_label', 'trace_id', 'request_id', 'correlation_id', 'span_id',
        'parent_span_id', 'caller_service', 'method', 'path', 'route', 'query',
        'ip', 'user_agent', 'status_code', 'duration_ms', 'payload', 'metadata',
        'error', 'idempotency_key',
    ];
    const values = [];
    const placeholders = [];
    events.forEach((event, index) => {
        const offset = index * columns.length;
        placeholders.push('(' + columns.map((_, i) => `$${offset + i + 1}`).join(', ') + ')');
        values.push(event.id, event.schema_version ?? '1.0', event.service_id, event.service_name, event.environment, event.instance_id ?? null, event.event_type, event.event_time, event.action, event.outcome, event.actor_type ?? null, event.actor_id ?? null, event.actor_role ?? null, event.resource_type ?? null, event.resource_id ?? null, event.resource_label ?? null, event.trace_id ?? null, event.request_id ?? null, event.correlation_id ?? null, event.span_id ?? null, event.parent_span_id ?? null, event.caller_service ?? null, event.method ?? null, event.path ?? null, event.route ?? null, event.query ? JSON.stringify(event.query) : null, event.ip ?? null, event.user_agent ?? null, event.status_code ?? null, event.duration_ms ?? null, event.payload ? JSON.stringify(event.payload) : null, event.metadata ? JSON.stringify(event.metadata) : null, event.error ? JSON.stringify(event.error) : null, event.idempotency_key ?? null);
    });
    await pool.query(`INSERT INTO audit.events (${columns.join(', ')})
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`, values);
}
async function insertSpans(pool, spans) {
    if (!spans.length)
        return;
    const columns = [
        'span_id', 'trace_id', 'parent_span_id', 'service_id', 'service_name',
        'environment', 'instance_id', 'name', 'kind', 'start_time', 'end_time',
        'duration_ms', 'status_code', 'status', 'caller_service', 'target_service',
        'request_id', 'correlation_id', 'attributes', 'error',
    ];
    const values = [];
    const placeholders = [];
    spans.forEach((span, index) => {
        const offset = index * columns.length;
        placeholders.push('(' + columns.map((_, i) => `$${offset + i + 1}`).join(', ') + ')');
        values.push(span.span_id, span.trace_id, span.parent_span_id ?? null, span.service_id, span.service_name, span.environment, span.instance_id ?? null, span.name, span.kind, span.start_time, span.end_time ?? null, span.duration_ms ?? null, span.status_code ?? null, span.status ?? 'ok', span.caller_service ?? null, span.target_service ?? null, span.request_id ?? null, span.correlation_id ?? null, span.attributes ? JSON.stringify(span.attributes) : null, span.error ? JSON.stringify(span.error) : null);
    });
    await pool.query(`INSERT INTO audit.trace_spans (${columns.join(', ')})
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`, values);
}
//# sourceMappingURL=worker.js.map