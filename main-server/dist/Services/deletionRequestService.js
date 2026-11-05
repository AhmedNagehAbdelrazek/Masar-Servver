"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBusinessDays = addBusinessDays;
exports.hasPendingRequest = hasPendingRequest;
exports.requestDeletion = requestDeletion;
exports.cancelDeletionRequest = cancelDeletionRequest;
// @ts-nocheck
const Models_1 = require("../Models");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const userAccess_1 = require("../utils/userAccess");
const notificationService_1 = __importDefault(require("./notificationService"));
const auditService_1 = __importDefault(require("./auditService"));
const { ApiErrors } = ApiError_1.default;
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
    const pending = await Models_1.DeletionRequest.findOne({
        where: { userId, status: 'pending' },
    });
    return pending != null;
}
async function alertAdminsOfNewDeletionRequest({ driverId, fullName, phone }) {
    try {
        const admins = await Models_1.User.findAll({ where: { role: 'admin', status: 'active' } });
        for (const admin of admins) {
            await notificationService_1.default.sendToUser(admin, 'ADMIN_DELETION_NEW', {
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
    const user = await (0, userAccess_1.loadDriverUser)(userId);
    (0, userAccess_1.ensureOperational)(user);
    if (confirmation !== true) {
        throw ApiErrors.validation('CONFIRMATION_IS_REQUIRED_TO_REQUEST_ACCOUNT_DELETION');
    }
    const existing = await Models_1.DeletionRequest.findOne({
        where: { userId: user.id, status: 'pending' },
    });
    if (existing) {
        throw ApiErrors.custom('A_DELETION_REQUEST_IS_ALREADY_PENDING', 409, 'DELETION_ALREADY_REQUESTED');
    }
    const estimatedCompletion = addBusinessDays(new Date(), 5);
    const request = await Models_1.DeletionRequest.create({
        userId: user.id,
        reason,
        status: 'pending',
        estimatedCompletion,
    });
    await user.update({ fcmToken: null });
    notificationService_1.default.sendToUser(user, 'DELETION_REQUESTED', {
        channels: ['in_app'],
        vars: {},
        data: { request_id: request.id, estimated_completion: request.estimatedCompletion },
    }).catch((err) => console.warn('[deletion-request] user notify failed:', err.message));
    await alertAdminsOfNewDeletionRequest({
        driverId: user.id,
        fullName: user.fullName,
        phone: user.phone,
    });
    auditService_1.default.track({
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
    const user = await (0, userAccess_1.loadDriverUser)(userId);
    (0, userAccess_1.ensureOperational)(user);
    const pending = await Models_1.DeletionRequest.findOne({
        where: { userId: user.id, status: 'pending' },
    });
    if (!pending) {
        throw ApiErrors.custom('NO_PENDING_DELETION_REQUEST_FOUND', 404, 'NO_PENDING_DELETION_REQUEST');
    }
    await pending.update({ status: 'cancelled' });
    notificationService_1.default.sendToUser(user, 'DELETION_REQUEST_CANCELLED', {
        channels: ['in_app'],
        vars: {},
        data: { request_id: pending.id },
    }).catch((err) => console.warn('[deletion-request] cancel notify failed:', err.message));
    auditService_1.default.track({
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
exports.default = module.exports;
//# sourceMappingURL=deletionRequestService.js.map