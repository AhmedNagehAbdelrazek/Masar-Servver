"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.track = track;
exports.markResource = markResource;
// @ts-nocheck
const audit_1 = require("../config/audit");
/**
 * Shared audit helper for administrative and domain mutations.
 * Wraps the existing audit client with a stable convention: every call
 * records an actor and timestamp (timestamp added by the collector), and
 * links the event to the originating HTTP request via the trace context.
 *
 * Never throws — failures are logged so audit issues do not break
 * the primary operation.
 */
function track({ eventType = 'domain.event', action, resourceType, resourceId, resourceLabel, actorId, actorType = 'admin', outcome = 'success', error, payload = {} }) {
    try {
        const trace = (0, audit_1.getTraceContext)();
        audit_1.audit.track({
            event_type: eventType,
            action,
            outcome,
            actor: actorId ? { type: actorType, id: actorId } : { type: 'system' },
            resource: { type: resourceType, id: resourceId, label: resourceLabel },
            request: trace
                ? {
                    trace_id: trace.trace_id,
                    request_id: trace.request_id,
                    correlation_id: trace.correlation_id,
                    span_id: trace.span_id,
                    parent_span_id: trace.parent_span_id,
                    caller_service: trace.caller_service,
                }
                : undefined,
            payload,
            error,
        });
    }
    catch (err) {
        console.warn('[auditService] tracking failed:', err.message);
    }
}
/**
 * Mark the resource touched by the current HTTP request so the
 * audit-client middleware can attach it to the http.request event.
 * Controllers call this after a successful mutation.
 */
function markResource(res, resource) {
    if (res && res.locals && resource) {
        res.locals.auditResource = resource;
    }
}
module.exports = { track, markResource };
exports.default = module.exports;
//# sourceMappingURL=auditService.js.map