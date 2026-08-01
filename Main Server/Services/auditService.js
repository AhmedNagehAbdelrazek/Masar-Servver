const { audit } = require('../config/audit');

/**
 * Shared audit helper for administrative and domain mutations.
 * Wraps the existing audit client with a stable convention: every call
 * records an actor and timestamp (timestamp added by the collector).
 *
 * Never throws — failures are logged so audit issues do not break
 * the primary operation.
 */
function track({ action, resourceType, resourceId, resourceLabel, actorId, actorType = 'admin', payload = {} }) {
  try {
    audit.track({
      event_type: 'domain.event',
      action,
      outcome: 'success',
      actor: actorId ? { type: actorType, id: actorId } : { type: 'system' },
      resource: { type: resourceType, id: resourceId, label: resourceLabel },
      payload,
    });
  } catch (err) {
    console.warn('[auditService] tracking failed:', err.message);
  }
}

module.exports = { track };
