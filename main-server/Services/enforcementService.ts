// @ts-nocheck
import realtimeService from './realtimeService';
import realtimeMetrics from './realtimeMetrics';
import { disconnectUserSockets } from '../socketServer';
import auditService from './auditService';
import { USER_STATUS, PENALTY_TYPES } from '../config/constants';


/**
 * Immediate session revocation for suspensions/bans (Requirement 8):
 *   1. audit-log the revocation;
 *   2. emit `enforcement:revoke` to the user's room;
 *   3. force-disconnect all of the user's sockets.
 * Reconnect is then blocked at the handshake (socketAuth rejects
 * suspended/banned users).
 */
function revoke(userId, { action = 'suspend', reason = 'Account action applied', actorId = null, duration = null } = {}) {
  if (!userId) return false;

  auditService.track({
    action: `enforcement.revoke_${action}`,
    resourceType: 'user',
    resourceId: userId,
    resourceLabel: `revoke_${action}`,
    actorId,
    payload: { reason, duration },
  });

  realtimeService.emitToUser(userId, 'enforcement:revoke', {
    reason,
    action,
    duration,
    effective_at: new Date().toISOString(),
  });
  realtimeMetrics.recordEvent('enforcement:revoke');

  try {
    disconnectUserSockets(userId);
  } catch (err) {
    console.warn('[enforcement] disconnect failed:', err.message);
  }
  return true;
}

/**
 * Applies a status-based revocation when the user's status transitions to
 * suspended/banned. No-op for active/warned users.
 */
function revokeIfBlocked(user, { actorId = null, reason = null } = {}) {
  if (!user) return false;
  if (user.status === USER_STATUS.SUSPENDED) {
    return revoke(user.id, { action: 'suspend', reason: reason || 'Account suspended', actorId });
  }
  if (user.status === USER_STATUS.BANNED) {
    return revoke(user.id, { action: 'ban', reason: reason || 'Account banned', actorId });
  }
  return false;
}

/**
 * Maps a penalty type to the revocation parameters used when a penalty is
 * issued (warnings do not revoke sessions). Returns the revocation plan; the
 * caller still provides the target userId via `revoke`.
 */
function revocationForPenalty(penaltyType) {
  if (penaltyType === PENALTY_TYPES.SUSPENSION) {
    return { action: 'suspend', applies: true };
  }
  if (penaltyType === PENALTY_TYPES.BAN) {
    return { action: 'ban', applies: true };
  }
  return { action: null, applies: false };
}

module.exports = { revoke, revokeIfBlocked, revocationForPenalty };
export { revoke, revokeIfBlocked, revocationForPenalty };
export default module.exports;