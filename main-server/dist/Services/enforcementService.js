"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revoke = revoke;
exports.revokeIfBlocked = revokeIfBlocked;
exports.revocationForPenalty = revocationForPenalty;
// @ts-nocheck
const realtimeService_1 = __importDefault(require("./realtimeService"));
const realtimeMetrics_1 = __importDefault(require("./realtimeMetrics"));
const socketServer_1 = require("../socketServer");
const auditService_1 = __importDefault(require("./auditService"));
const constants_1 = require("../config/constants");
/**
 * Immediate session revocation for suspensions/bans (Requirement 8):
 *   1. audit-log the revocation;
 *   2. emit `enforcement:revoke` to the user's room;
 *   3. force-disconnect all of the user's sockets.
 * Reconnect is then blocked at the handshake (socketAuth rejects
 * suspended/banned users).
 */
function revoke(userId, { action = 'suspend', reason = 'Account action applied', actorId = null, duration = null } = {}) {
    if (!userId)
        return false;
    auditService_1.default.track({
        action: `enforcement.revoke_${action}`,
        resourceType: 'user',
        resourceId: userId,
        resourceLabel: `revoke_${action}`,
        actorId,
        payload: { reason, duration },
    });
    realtimeService_1.default.emitToUser(userId, 'enforcement:revoke', {
        reason,
        action,
        duration,
        effective_at: new Date().toISOString(),
    });
    realtimeMetrics_1.default.recordEvent('enforcement:revoke');
    try {
        (0, socketServer_1.disconnectUserSockets)(userId);
    }
    catch (err) {
        console.warn('[enforcement] disconnect failed:', err.message);
    }
    return true;
}
/**
 * Applies a status-based revocation when the user's status transitions to
 * suspended/banned. No-op for active/warned users.
 */
function revokeIfBlocked(user, { actorId = null, reason = null } = {}) {
    if (!user)
        return false;
    if (user.status === constants_1.USER_STATUS.SUSPENDED) {
        return revoke(user.id, { action: 'suspend', reason: reason || 'Account suspended', actorId });
    }
    if (user.status === constants_1.USER_STATUS.BANNED) {
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
    if (penaltyType === constants_1.PENALTY_TYPES.SUSPENSION) {
        return { action: 'suspend', applies: true };
    }
    if (penaltyType === constants_1.PENALTY_TYPES.BAN) {
        return { action: 'ban', applies: true };
    }
    return { action: null, applies: false };
}
module.exports = { revoke, revokeIfBlocked, revocationForPenalty };
exports.default = module.exports;
//# sourceMappingURL=enforcementService.js.map