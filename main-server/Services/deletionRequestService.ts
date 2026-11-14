// @ts-nocheck
import { Op } from 'sequelize';
import { DeletionRequest, User } from '../Models';
import ApiError from '../utils/ApiError';
import { loadDriverUser, ensureOperational } from '../utils/userAccess';
import { parsePagination, buildPagination } from '../utils/pagination';
import { maskPhone } from '../utils/masking';
import notificationService from './notificationService';
import auditService from './auditService';
import * as adminUserService from './adminUserService';
import * as adminAuditService from './adminAuditService';
const { ApiErrors } = ApiError;

/** 5-business-day review window, skipping Friday & Saturday (research D8). */
function addBusinessDays(from, days) {
    const date = new Date(from.getTime());
    let remaining = days;
    while (remaining > 0) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay(); // 5 = Friday, 6 = Saturday
        if (day !== 5 && day !== 6) remaining -= 1;
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
    } catch (err) {
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

/**
 * Admin deletion-request review queue.
 * Pending requests are the default; status=all exposes the reviewed history.
 */
async function listAdmin(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.search) {
        const term = `%${String(query.search).trim()}%`;
        where[Op.or] = [
            { '$user.full_name$': { [Op.iLike]: term } },
            { '$user.phone$': { [Op.iLike]: term } },
        ];
    }

    const { rows, count } = await DeletionRequest.findAndCountAll({
        where,
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'phone', 'email', 'role', 'status', 'verificationStatus'],
            required: true,
        }],
        order: [['createdat', 'DESC']],
        offset,
        limit,
        subQuery: false,
        distinct: true,
    });

    return {
        data: rows.map((request) => ({
            id: request.id,
            user_id: request.userId,
            reason: request.reason || null,
            status: request.status,
            requested_at: request.createdAt ?? request.createdat,
            estimated_completion: request.estimatedCompletion || null,
            review_notes: request.reviewNotes || null,
            reviewed_by: request.reviewedBy || null,
            reviewed_at: request.updatedAt ?? request.updatedat ?? null,
            user: request.user ? {
                id: request.user.id,
                name: request.user.fullName,
                phone: maskPhone(request.user.phone),
                phone_full: request.user.phone,
                email: request.user.email || null,
                role: request.user.role,
                status: request.user.status,
                verification_status: request.user.verificationStatus || null,
            } : null,
        })),
        pagination: buildPagination(count, page, limit),
    };
}

async function review(actorId, requestId, { status, review_notes: reviewNotes = null } = {}) {
    if (!['approved', 'rejected'].includes(status)) {
        throw ApiErrors.validation('DELETION_REQUEST_REVIEW_STATUS_MUST_BE_APPROVED_OR_REJECTED');
    }

    const request = await DeletionRequest.findByPk(requestId, {
        include: [{ model: User, as: 'user', required: true }],
    });
    if (!request) throw ApiErrors.notFound('DELETION_REQUEST_NOT_FOUND');
    if (request.status !== 'pending') {
        throw ApiErrors.conflict('DELETION_REQUEST_ALREADY_REVIEWED');
    }

    const user = request.user;
    const note = reviewNotes || request.reason || null;
    let deletion = null;

    if (status === 'approved') {
        // Approve = soft delete. The account is hidden and blocked, while the
        // historical rows remain available for arbitration.
        deletion = await adminUserService.softDeleteUser(
            actorId,
            user,
            note || 'Account deletion request approved',
        );
    }

    await request.update({
        status,
        reviewNotes: note,
        reviewedBy: actorId,
        estimatedCompletion: status === 'approved' ? new Date() : request.estimatedCompletion,
    });

    if (status === 'rejected') {
        try {
            await notificationService.sendToUser(user, 'ADMIN_NOTICE', {
                channels: ['in_app', 'push'],
                vars: {
                    title: 'تم رفض طلب حذف الحساب',
                    body: `تمت مراجعة طلب حذف حسابك ورفضه.${note ? ` الملاحظات: ${note}` : ''}`,
                },
                data: { deletion_request_id: request.id, status },
            });
        } catch (err) {
            console.warn('[deletion-request] rejection notification failed:', err.message);
        }
    }

    auditService.track({
        eventType: 'domain.event',
        action: `account.deletion_${status}`,
        resourceType: 'deletion_request',
        resourceId: request.id,
        resourceLabel: user.phone,
        actorId,
        actorType: 'admin',
        payload: { user_id: user.id, status, review_notes: note },
    });

    await adminAuditService.record({
        actorId,
        userId: user.id,
        action: status === 'approved' ? 'deletion_request_approved' : 'deletion_request_rejected',
        before: { status: 'pending' },
        after: { status },
        reason: note,
        source: 'admin_deletion_review',
    });

    return {
        request: {
            id: request.id,
            status: request.status,
            review_notes: request.reviewNotes,
            reviewed_by: request.reviewedBy,
            reviewed_at: request.updatedAt ?? request.updatedat,
        },
        user: {
            id: user.id,
            status: deletion ? 'banned' : user.status,
        },
        ...(deletion ? { deletion } : {}),
    };
}

module.exports = {
    addBusinessDays,
    hasPendingRequest,
    requestDeletion,
    cancelDeletionRequest,
    listAdmin,
    review,
};
export { addBusinessDays, hasPendingRequest, requestDeletion, cancelDeletionRequest, listAdmin, review };
export default module.exports;