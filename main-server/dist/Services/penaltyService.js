"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listForDriver = listForDriver;
exports.issue = issue;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const constants_1 = require("../config/constants");
const pagination_1 = require("../utils/pagination");
const enforcementService_1 = require("./enforcementService");
const enforcementService_2 = require("./enforcementService");
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
    const { page, limit, offset } = (0, pagination_1.parsePagination)(filters);
    const where = { userId };
    if (active === 'true' || active === true) {
        const now = new Date();
        where.startsAt = { [sequelize_1.Op.lte]: now };
        where[sequelize_1.Op.or] = [{ endsAt: { [sequelize_1.Op.is]: null } }, { endsAt: { [sequelize_1.Op.gte]: now } }];
    }
    const { rows, count } = await Models_1.Penalty.findAndCountAll({
        where,
        include: [{ model: Models_1.User, as: 'user', attributes: ['id', 'status'], required: false }],
        order: [['startsAt', 'DESC']],
        offset,
        limit,
    });
    return {
        data: rows.map((p) => serializePenalty(p, p.user)),
        pagination: (0, pagination_1.buildPagination)(count, page, limit),
    };
}
const STATUS_BY_TYPE = {
    [constants_1.PENALTY_TYPES.WARNING]: constants_1.USER_STATUS.WARNED,
    [constants_1.PENALTY_TYPES.SUSPENSION]: constants_1.USER_STATUS.SUSPENDED,
    [constants_1.PENALTY_TYPES.BAN]: constants_1.USER_STATUS.BANNED,
};
/**
 * Issue a penalty (contract A11). Append-only: inserts a new Penalty row and
 * syncs `users.status` to reflect the enforcement level. Throws when the user
 * does not exist or a suspension is missing `ends_at` / a ban provides one.
 */
async function issue(actorId, payload) {
    const { user_id: userId, type, reason, details, complaint_id: complaintId, ends_at: endsAt } = payload;
    if (type === constants_1.PENALTY_TYPES.SUSPENSION && !endsAt) {
        throw ApiError_1.ApiErrors.validation('ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION');
    }
    if (type === constants_1.PENALTY_TYPES.BAN && endsAt) {
        throw ApiError_1.ApiErrors.validation('ENDS_AT_IS_FORBIDDEN_FOR_A_BAN');
    }
    const user = await Models_1.User.findByPk(userId);
    if (!user)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    const penalty = await Models_1.Penalty.create({
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
        const plan = (0, enforcementService_2.revocationForPenalty)(type);
        if (plan.applies) {
            (0, enforcementService_1.revoke)(userId, {
                action: plan.action,
                reason,
                actorId,
                duration: type === constants_1.PENALTY_TYPES.SUSPENSION && endsAt ? String(endsAt) : null,
            });
        }
    }
    catch (err) {
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
exports.default = module.exports;
//# sourceMappingURL=penaltyService.js.map