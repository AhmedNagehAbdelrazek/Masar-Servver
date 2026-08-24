const { Op } = require('sequelize');
const { Penalty, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { PENALTY_TYPES, USER_STATUS } = require('../config/constants');
const { parsePagination, buildPagination } = require('../utils/pagination');

function serializePenalty(penalty, user) {
  return {
    id: penalty.id,
    type: penalty.type,
    reason: penalty.reason,
    starts_at: penalty.startsAt,
    ends_at: penalty.endsAt,
    is_appealed: penalty.isAppealed,
    enforcement_state: user ? user.status : null,
  };
}

/**
 * List penalties for a driver (contract D7). `active` filters to penalties
 * still within their starts_at/ends_at window. `enforcement_state` reflects
 * the user's current status.
 */
async function listForDriver(userId, filters = {}) {
  const { active } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const where = { userId };
  if (active === 'true' || active === true) {
    const now = new Date();
    where.startsAt = { [Op.lte]: now };
    where[Op.or] = [{ endsAt: { [Op.is]: null } }, { endsAt: { [Op.gte]: now } }];
  }

  const { rows, count } = await Penalty.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'status'], required: false }],
    order: [['startsAt', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map((p) => serializePenalty(p, p.user)),
    pagination: buildPagination(count, page, limit),
  };
}

const STATUS_BY_TYPE = {
  [PENALTY_TYPES.WARNING]: USER_STATUS.WARNED,
  [PENALTY_TYPES.SUSPENSION]: USER_STATUS.SUSPENDED,
  [PENALTY_TYPES.BAN]: USER_STATUS.BANNED,
};

/**
 * Issue a penalty (contract A11). Append-only: inserts a new Penalty row and
 * syncs `users.status` to reflect the enforcement level. Throws when the user
 * does not exist or a suspension is missing `ends_at` / a ban provides one.
 */
async function issue(actorId, payload) {
  const { user_id: userId, type, reason, details, complaint_id: complaintId, ends_at: endsAt } = payload;

  if (type === PENALTY_TYPES.SUSPENSION && !endsAt) {
    throw ApiErrors.validation('ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION');
  }
  if (type === PENALTY_TYPES.BAN && endsAt) {
    throw ApiErrors.validation('ENDS_AT_IS_FORBIDDEN_FOR_A_BAN');
  }

  const user = await User.findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

  const penalty = await Penalty.create({
    userId,
    complaintId: complaintId || null,
    type,
    reason,
    details: details || null,
    startsAt: new Date(),
    endsAt: endsAt ? new Date(endsAt) : null,
    issuedBy: actorId,
  });

  const newStatus = STATUS_BY_TYPE[type];
  if (newStatus) {
    await user.update({ status: newStatus });
  }

  // Realtime enforcement: suspensions and bans revoke live sessions so the
  // penalty takes effect immediately (Requirement 8). Best-effort, never
  // blocks the penalty write.
  try {
    const { revoke } = require('./enforcementService');
    const { revocationForPenalty } = require('./enforcementService');
    const plan = revocationForPenalty(type);
    if (plan.applies) {
      revoke(userId, {
        action: plan.action,
        reason,
        actorId,
        duration: type === PENALTY_TYPES.SUSPENSION && endsAt ? String(endsAt) : null,
      });
    }
  } catch (err) {
    console.warn('[penaltyService] enforcement revocation failed:', err.message);
  }

  return {
    penalty: {
      id: penalty.id,
      user_id: penalty.userId,
      type: penalty.type,
      reason: penalty.reason,
      details: penalty.details || null,
      starts_at: penalty.startsAt,
      ends_at: penalty.endsAt,
      issued_by: penalty.issuedBy,
    },
  };
}

module.exports = { listForDriver, issue };
