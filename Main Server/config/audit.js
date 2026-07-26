const { AuditClient, createAuditedFetch } = require('../external packages/audit-client');

const audit = new AuditClient({
  serviceId: process.env.AUDIT_SERVICE_ID,
  serviceName: 'masar-trip-service',       // unique per service
  environment: process.env.NODE_ENV,
  collectorUrl: process.env.AUDIT_COLLECTOR_URL,
  clientKey: process.env.AUDIT_CLIENT_KEY,
  clientSecret: process.env.AUDIT_CLIENT_SECRET,
});

console.log(process.env.AUDIT_SERVICE_ID);
console.log(process.env.AUDIT_COLLECTOR_URL);
console.log(process.env.AUDIT_CLIENT_KEY);
console.log(process.env.AUDIT_CLIENT_SECRET);

const auditedFetch = createAuditedFetch(audit);

exports.audit = audit;
exports.auditedFetch = auditedFetch;