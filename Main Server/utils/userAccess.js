const { User } = require('../Models');
const { ApiErrors } = require('./ApiError');
const { USER_STATUS } = require('../config/constants');

/**
 * Shared account access posture for driver profile/settings endpoints
 * (spec 010, research D9):
 *  - banned drivers are blocked from everything, including reads;
 *  - suspended drivers keep read-only access; all writes are forbidden.
 */

async function loadDriverUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw ApiErrors.notFound('User not found');
    return user;
}

function ensureReadable(user) {
    if (user.status === USER_STATUS.BANNED) {
        throw ApiErrors.forbidden('Account is banned');
    }
}

function ensureOperational(user) {
    if (user.status === USER_STATUS.BANNED) {
        throw ApiErrors.forbidden('Account is banned');
    }
    if (user.status === USER_STATUS.SUSPENDED) {
        throw ApiErrors.forbidden('Suspended accounts cannot perform this action');
    }
}

module.exports = { loadDriverUser, ensureReadable, ensureOperational };
