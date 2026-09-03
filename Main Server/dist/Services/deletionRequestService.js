"use strict";
const { DeletionRequest, User } = require('../Models');
const ApiError = require('../utils/ApiError');
const { ApiErrors } = ApiError;
const { loadDriverUser, ensureOperational } = require('../utils/userAccess');
const notificationService = require('./notificationService');
const auditService = require('./auditService');
/** 5-business-day review window, skipping Friday & Saturday (research D8). */
function addBusinessDays(from, days) {
    const date = new Date(from.getTime());
    let remaining = days;
    while (remaining > 0) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay(); // 5 = Friday, 6 = Saturday
        if (day !== 5 && day !== 6)
            remaining -= 1;
    }
    return date;
}
async function hasPendingRequest(userId) {
    const pending = await DeletionRequest.findOne({
        where: { userId, status: 'pending' },
    });
    return pending != null;
}
async function alertAdminsOfNewDeletionRequest({ driverId, fullName, phone }) {
    try {
        const admins = await User.findAll({ where: { role: 'admin', status: 'active' } });
        for (const admin of admins) {
            await notificationService.sendToUser(admin, 'ADMIN_DELETION_NEW', {
                channels: ['in_app'],
                vars: { driver_name: fullName || 'A driver', phone: phone || '' },
                data: { driver_id: driverId },
            });
        }
        return admins.length;
    }
    catch (err) {
        console.warn('[deletion-request] admin alert failed:', err.message);
        return 0;
    }
}
/**
 * Record a reviewed deletion request — nothing is erased here (spec 010).
 * Clears the FCM token so push delivery stops immediately.
 */
async function requestDeletion(userId, { reason = null, confirmation = false } = {}) {
    const user = await loadDriverUser(userId);
    ensureOperational(user);
    if (confirmation !== true) {
        throw ApiErrors.validation('CONFIRMATION_IS_REQUIRED_TO_REQUEST_ACCOUNT_DELETION');
    }
    const existing = await DeletionRequest.findOne({
        where: { userId: user.id, status: 'pending' },
    });
    if (existing) {
        throw ApiErrors.custom('A_DELETION_REQUEST_IS_ALREADY_PENDING', 409, 'DELETION_ALREADY_REQUESTED');
    }
    const estimatedCompletion = addBusinessDays(new Date(), 5);
    const request = await DeletionRequest.create({
        userId: user.id,
        reason,
        status: 'pending',
        estimatedCompletion,
    });
    await user.update({ fcmToken: null });
    notificationService.sendToUser(user, 'DELETION_REQUESTED', {
        channels: ['in_app'],
        vars: {},
        data: { request_id: request.id, estimated_completion: request.estimatedCompletion },
    }).catch((err) => console.warn('[deletion-request] user notify failed:', err.message));
    await alertAdminsOfNewDeletionRequest({
        driverId: user.id,
        fullName: user.fullName,
        phone: user.phone,
    });
    auditService.track({
        eventType: 'domain.event',
        action: 'account.deletion_requested',
        resourceType: 'deletion_request',
        resourceId: request.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
        payload: { reason, estimated_completion: request.estimatedCompletion },
    });
    return {
        request_id: request.id,
        status: request.status,
        estimated_completion: request.estimatedCompletion,
    };
}
/** Self-service cancel of a pending deletion request (clarification Q3). */
async function cancelDeletionRequest(userId) {
    const user = await loadDriverUser(userId);
    ensureOperational(user);
    const pending = await DeletionRequest.findOne({
        where: { userId: user.id, status: 'pending' },
    });
    if (!pending) {
        throw ApiErrors.custom('NO_PENDING_DELETION_REQUEST_FOUND', 404, 'NO_PENDING_DELETION_REQUEST');
    }
    await pending.update({ status: 'cancelled' });
    notificationService.sendToUser(user, 'DELETION_REQUEST_CANCELLED', {
        channels: ['in_app'],
        vars: {},
        data: { request_id: pending.id },
    }).catch((err) => console.warn('[deletion-request] cancel notify failed:', err.message));
    auditService.track({
        eventType: 'domain.event',
        action: 'account.deletion_cancelled',
        resourceType: 'deletion_request',
        resourceId: pending.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
        payload: {},
    });
    return {
        request_id: pending.id,
        status: pending.status,
    };
}
module.exports = {
    addBusinessDays,
    hasPendingRequest,
    requestDeletion,
    cancelDeletionRequest,
};
//# sourceMappingURL=deletionRequestService.js.map