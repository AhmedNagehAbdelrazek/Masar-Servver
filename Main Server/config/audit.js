const { AuditClient, createAuditedFetch, getTraceContext } = require('../external packages/audit-client');

// Disabled when the collector and signing material are not configured so the
// client never signs with an undefined secret or retries unreachable hosts
// (local dev, tests). Audit is best-effort: events are dropped, never thrown.
const auditConfigured = Boolean(
  process.env.AUDIT_COLLECTOR_URL &&
  process.env.AUDIT_CLIENT_KEY &&
  process.env.AUDIT_CLIENT_SECRET
);

const audit = new AuditClient({
  serviceId: process.env.AUDIT_SERVICE_ID,
  serviceName: 'masar-trip-service',       // unique per service
  environment: process.env.NODE_ENV,
  collectorUrl: process.env.AUDIT_COLLECTOR_URL,
  clientKey: process.env.AUDIT_CLIENT_KEY,
  clientSecret: process.env.AUDIT_CLIENT_SECRET,
  enabled: auditConfigured,
});

const auditedFetch = createAuditedFetch(audit);

exports.audit = audit;
exports.auditedFetch = auditedFetch;
exports.getTraceContext = getTraceContext;