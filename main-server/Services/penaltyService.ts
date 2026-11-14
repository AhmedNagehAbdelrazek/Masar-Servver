// @ts-nocheck
import { Op } from 'sequelize';
import { Penalty, User } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { PENALTY_TYPES, USER_STATUS } from '../config/constants';
import { parsePagination, buildPagination } from '../utils/pagination';
import { revoke } from './enforcementService';
import { revokeUserSessions } from './authService';
import { revocationForPenalty } from './enforcementService';
import notificationService from './notificationService';
import { blockAccountInventory } from './accountBlockingService';

const STATUS_RANK = {
  [USER_STATUS.ACTIVE]: 0,
  [USER_STATUS.WARNED]: 1,
  [USER_STATUS.SUSPENDED]: 2,
  [USER_STATUS.BANNED]: 3,
};

const REASON_LABELS = {
  repeat_cancel: 'تكرار إلغاء الرحلات',
  late: 'عدم الالتزام بالمواعيد',
  misbehavior: 'سلوك غير لائق',
  rules_violation: 'مخالفة قواعد المنصة',
  driver_complaint: 'شكوى من راكب',
  severe_repeat: 'انتهاكات متكررة جسيمة',
  dangerous_behavior: 'سلوك خطير أثناء الرحلة',
  tos_violation: 'انتهاك شروط الاستخدام',
  other: 'أخرى',
};

function humanReason(reason) {
  return REASON_LABELS[reason] || reason;
}

function durationLabel(endsAt) {
  if (!endsAt) return 'غير محدد';
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return String(endsAt);
  return new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

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
  const {
    user_id: userId,
    type,
    reason,
    details,
    complaint_id: complaintId,
    ends_at: endsAt,
    allow_open_suspension: allowOpenSuspension,
  } = payload;

  if (type === PENALTY_TYPES.SUSPENSION && !endsAt && !allowOpenSuspension) {
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
  const currentRank = STATUS_RANK[user.status] ?? 0;
  if (newStatus && (STATUS_RANK[newStatus] ?? 0) > currentRank) {
    await user.update({ status: newStatus });
  }

  let blockedInventory = null;
  if (type !== PENALTY_TYPES.WARNING) {
    try {
      blockedInventory = await blockAccountInventory(actorId, user, humanReason(reason));
    } catch (err) {
      console.warn('[penaltyService] account inventory block failed:', err.message);
    }
  }

  const template =
    type === PENALTY_TYPES.WARNING
      ? 'ACCOUNT_WARNING'
      : type === PENALTY_TYPES.SUSPENSION
        ? 'ACCOUNT_SUSPENDED'
        : 'ACCOUNT_BANNED';
  const channels =
    type === PENALTY_TYPES.WARNING
      ? ['in_app', 'push']
      : ['in_app', 'push', 'sms'];
  try {
    await notificationService.sendToUser(user, template, {
      channels,
      vars: {
        reason: humanReason(reason),
        duration: durationLabel(endsAt),
      },
      data: {
        penalty_id: penalty.id,
        type,
        ends_at: endsAt || null,
      },
    });
  } catch (err) {
    console.warn('[penaltyService] penalty notification failed:', err.message);
  }

  // Realtime enforcement: suspensions and bans revoke live sessions so the
  // penalty takes effect immediately (Requirement 8). Best-effort, never
  // blocks the penalty write.
  try {
    const plan = revocationForPenalty(type);
    if (plan.applies) {
      revoke(userId, {
        action: plan.action,
        reason: humanReason(reason),
        actorId,
        duration: type === PENALTY_TYPES.SUSPENSION && endsAt ? String(endsAt) : null,
      });
      // Bans are terminal for the session: invalidate every HTTP access token
      // immediately. Suspensions keep read-only access, so only their sockets
      // are revoked above.
      if (type === PENALTY_TYPES.BAN) {
        await revokeUserSessions(userId);
      }
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
    ...(blockedInventory ? { inventory: blockedInventory } : {}),
  };
}

module.exports = { listForDriver, issue };
export { listForDriver, issue };
export default module.exports;