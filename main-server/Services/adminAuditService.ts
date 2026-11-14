// @ts-nocheck
import { AuditLog } from '../Models';

/**
 * Durable administrative mutation trail for the dashboard dossier account log.
 * The external audit collector is still used for compliance; this local row is
 * what the admin UI can read back without depending on the collector.
 */
async function record({
  actorId = null,
  userId,
  action,
  before = null,
  after = null,
  reason = null,
  source = 'admin',
}) {
  if (!userId || !action) return null;
  try {
    return await AuditLog.create({
      tableName: 'users',
      recordId: userId,
      action: action === 'account_deleted' ? 'DELETE' : 'UPDATE',
      oldData: before ?? null,
      newData: {
        action,
        after: after ?? null,
        reason: reason ?? null,
        source,
        actor_id: actorId ?? null,
      },
      performedBy: actorId ?? null,
    });
  } catch (err) {
    console.warn('[adminAuditService] record failed:', err.message);
    return null;
  }
}

async function listForUser(userId) {
  return AuditLog.findAll({
    where: { recordId: userId, tableName: 'users' },
    order: [['createdat', 'DESC']],
    limit: 100,
  });
}

export { record, listForUser };

export default { record, listForUser };
module.exports = { record, listForUser };
