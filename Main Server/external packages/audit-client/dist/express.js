"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditMiddleware = createAuditMiddleware;
const context_1 = require("./context");
const ids_1 = require("./ids");
function createAuditMiddleware(client, options = {}) {
    return (req, res, next) => {
        if (options.skip?.(req))
            return next();
        const start = process.hrtime.bigint();
        const trace_id = req.headers['x-audit-trace-id'] || (0, ids_1.generateTraceId)();
        const request_id = req.headers['x-audit-request-id'] ||
            req.headers['x-request-id'] ||
            (0, ids_1.generateRequestId)();
        const correlation_id = req.headers['x-audit-correlation-id'] || request_id;
        const parent_span_id = req.headers['x-audit-span-id'] ||
            req.headers['x-audit-parent-span-id'];
        const caller_service = req.headers['x-audit-caller-service'];
        const span_id = (0, ids_1.generateSpanId)();
        const context = {
            trace_id,
            request_id,
            correlation_id,
            span_id,
            parent_span_id,
            caller_service,
        };
        res.setHeader('X-Request-Id', request_id);
        res.setHeader('X-Audit-Trace-Id', trace_id);
        let finished = false;
        const onFinish = () => {
            if (finished)
                return;
            finished = true;
            const durationNs = Number(process.hrtime.bigint() - start);
            const durationMs = Math.round(durationNs / 1e6);
            const route = req.baseUrl + (req.route?.path ?? req.path);
            const outcome = res.statusCode >= 500 ? 'failure' : res.statusCode >= 400 ? 'denied' : 'success';
            const shouldCaptureBody = options.captureBody?.(req) ?? (req.method !== 'GET' && req.method !== 'HEAD');
            const resource = res.locals?.auditResource;
            client.track({
                event_type: 'http.request',
                action: 'http.request',
                resource: resource
                    ? { type: resource.type, id: resource.id, label: resource.label }
                    : undefined,
                actor: req.user
                    ? {
                        type: req.user.type ?? 'user',
                        id: req.user.id,
                        role: req.user.role,
                    }
                    : { type: 'anonymous' },
                request: {
                    trace_id,
                    request_id,
                    correlation_id,
                    span_id,
                    parent_span_id,
                    caller_service,
                    method: req.method,
                    path: req.originalUrl.split('?')[0],
                    route,
                    ip: req.ip,
                    user_agent: req.headers['user-agent'],
                    status_code: res.statusCode,
                    duration_ms: durationMs,
                },
                payload: shouldCaptureBody ? { body: req.body } : undefined,
                outcome,
            });
            client.trackSpan({
                trace_id,
                span_id,
                parent_span_id,
                name: `${req.method} ${route}`,
                kind: 'server',
                start_time: new Date(Date.now() - durationMs).toISOString(),
                end_time: new Date().toISOString(),
                duration_ms: durationMs,
                status_code: res.statusCode,
                status: res.statusCode >= 500 ? 'error' : 'ok',
                caller_service,
                request_id,
                correlation_id,
                attributes: {
                    http_method: req.method,
                    http_path: req.originalUrl.split('?')[0],
                    http_route: route,
                    http_status_code: res.statusCode,
                },
            });
        };
        res.on('finish', onFinish);
        res.on('close', onFinish);
        context_1.traceStorage.run(context, () => next());
    };
}
//# sourceMappingURL=express.js.map