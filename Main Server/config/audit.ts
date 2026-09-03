import { AuditClient, createAuditedFetch, getTraceContext } from '../external packages/audit-client';

// Disabled when the collector and signing material are not configured so the
// client never signs with an undefined secret or retries unreachable hosts
// (local dev, tests). Audit is best-effort: events are dropped, never thrown.
const auditConfigured: boolean = Boolean(
  process.env.AUDIT_COLLECTOR_URL &&
    process.env.AUDIT_CLIENT_KEY &&
    process.env.AUDIT_CLIENT_SECRET,
);

const audit = new AuditClient({
  serviceId: process.env.AUDIT_SERVICE_ID as string,
  serviceName: 'masar-trip-service',
  environment: process.env.NODE_ENV as string,
  collectorUrl: process.env.AUDIT_COLLECTOR_URL as string,
  clientKey: process.env.AUDIT_CLIENT_KEY as string,
  clientSecret: process.env.AUDIT_CLIENT_SECRET as string,
  enabled: auditConfigured,
});

const auditedFetch: ReturnType<typeof createAuditedFetch> = createAuditedFetch(audit);

export { audit, auditedFetch, getTraceContext };
export default { audit, auditedFetch, getTraceContext };

// CommonJS interop
module.exports = { audit, auditedFetch, getTraceContext };
(module.exports as unknown as { audit: typeof audit }).audit = audit;
(module.exports as unknown as { auditedFetch: typeof auditedFetch }).auditedFetch = auditedFetch;
(module.exports as unknown as { getTraceContext: typeof getTraceContext }).getTraceContext = getTraceContext;
