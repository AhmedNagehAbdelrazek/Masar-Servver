"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceContext = exports.auditedFetch = exports.audit = void 0;
const audit_client_1 = require("../external packages/audit-client");
Object.defineProperty(exports, "getTraceContext", { enumerable: true, get: function () { return audit_client_1.getTraceContext; } });
// Disabled when the collector and signing material are not configured so the
// client never signs with an undefined secret or retries unreachable hosts
// (local dev, tests). Audit is best-effort: events are dropped, never thrown.
const auditConfigured = Boolean(process.env.AUDIT_COLLECTOR_URL &&
    process.env.AUDIT_CLIENT_KEY &&
    process.env.AUDIT_CLIENT_SECRET);
const audit = new audit_client_1.AuditClient({
    serviceId: process.env.AUDIT_SERVICE_ID,
    serviceName: 'masar-trip-service',
    environment: process.env.NODE_ENV,
    collectorUrl: process.env.AUDIT_COLLECTOR_URL,
    clientKey: process.env.AUDIT_CLIENT_KEY,
    clientSecret: process.env.AUDIT_CLIENT_SECRET,
    enabled: auditConfigured,
});
exports.audit = audit;
const auditedFetch = (0, audit_client_1.createAuditedFetch)(audit);
exports.auditedFetch = auditedFetch;
exports.default = { audit, auditedFetch, getTraceContext: audit_client_1.getTraceContext };
// CommonJS interop
module.exports = { audit, auditedFetch, getTraceContext: audit_client_1.getTraceContext };
module.exports.audit = audit;
module.exports.auditedFetch = auditedFetch;
module.exports.getTraceContext = audit_client_1.getTraceContext;
//# sourceMappingURL=audit.js.map