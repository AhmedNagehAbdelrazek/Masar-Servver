"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.issuePenalty = exports.moderateTrip = exports.updateUserStatus = exports.listUsers = exports.resolveComplaint = exports.listComplaints = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const pagination_1 = require("../utils/pagination");
const masking_1 = require("../utils/masking");
const ApiError_1 = require("../utils/ApiError");
const constants_1 = require("../config/constants");
const complaintService = __importStar(require("../Services/complaintService"));
const penaltyService = __importStar(require("../Services/penaltyService"));
const auditService = __importStar(require("../Services/auditService"));
const Models_1 = require("../Models");
const listComplaints = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await complaintService.listAdmin(req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listComplaints = listComplaints;
const resolveComplaint = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { complaint_id } = req.params;
    const body = req.body;
    const result = await complaintService.resolve(String(authReq.user?.id), complaint_id, req.body);
    auditService.track({
        action: `complaint.${body.status}`,
        resourceType: 'complaint',
        resourceId: complaint_id,
        actorId: authReq.user?.id,
        payload: req.body,
    });
    auditService.markResource(res, { type: 'complaint', id: complaint_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.resolveComplaint = resolveComplaint;
const listUsers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { role, status } = req.query;
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query);
    const where = {};
    if (role)
        where['role'] = role;
    if (status)
        where['status'] = status;
    const { rows, count } = await Models_1.User.findAndCountAll({
        where,
        attributes: ['id', 'fullName', 'phone', 'role', 'status', 'avgRating', 'createdat'],
        order: [['createdat', 'DESC']],
        offset,
        limit,
    });
    (0, httpResponse_1.successResponse)(res, {
        data: rows.map((u) => ({
            id: u['id'],
            full_name: u['fullName'],
            phone: (0, masking_1.maskPhone)(u['phone']),
            role: u['role'],
            status: u['status'],
            avg_rating: Number(u['avgRating'] || 0),
            created_at: u['createdat'],
        })),
        pagination: (0, pagination_1.buildPagination)(count, page, limit),
    });
});
exports.listUsers = listUsers;
const updateUserStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { user_id } = req.params;
    const { status, reason } = req.body;
    const user = await Models_1.User.findByPk(user_id);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    await user.update({ status });
    auditService.track({
        action: `user.status.${status}`,
        resourceType: 'user',
        resourceId: user['id'],
        actorId: authReq.user?.id,
        payload: { reason: reason || null },
    });
    auditService.markResource(res, { type: 'user', id: user['id'] });
    if (reason) {
        await Models_1.Notification.create({
            userId: user['id'],
            type: 'VERIFICATION_REJECTED',
            title: 'Account status updated',
            body: `Your account status was changed to ${status}. Reason: ${reason}`,
            data: { status },
            sentVia: ['in_app'],
        });
    }
    (0, httpResponse_1.successResponse)(res, {
        user: { id: user['id'], status: user['status'], updated_by: authReq.user?.id },
    });
});
exports.updateUserStatus = updateUserStatus;
const moderateTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const trip = await Models_1.Trip.findByPk(trip_id);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    const { action, reason } = req.body;
    if (action === 'restore') {
        await trip.update({
            isModerated: false,
            moderationReason: null,
            moderatedBy: null,
            status: constants_1.TRIP_STATUS.PUBLISHED,
        });
    }
    else {
        await trip.update({
            isModerated: true,
            moderationReason: reason || null,
            moderatedBy: authReq.user?.id,
            ...(action === 'block' ? { status: constants_1.TRIP_STATUS.CANCELLED } : {}),
        });
    }
    auditService.track({
        action: `trip.${action}`,
        resourceType: 'trip',
        resourceId: trip['id'],
        actorId: authReq.user?.id,
        payload: { reason: reason || null },
    });
    auditService.markResource(res, { type: 'trip', id: trip['id'] });
    (0, httpResponse_1.successResponse)(res, {
        trip: {
            id: trip['id'],
            status: trip['status'],
            is_blocked_by_balance: trip['isBlockedByBalance'],
            moderated: trip['isModerated'],
        },
    });
});
exports.moderateTrip = moderateTrip;
const issuePenalty = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const body = req.body;
    const result = await penaltyService.issue(String(authReq.user?.id), req.body);
    auditService.track({
        action: `penalty.${body.type}`,
        resourceType: 'penalty',
        resourceId: result.penalty.id,
        actorId: authReq.user?.id,
        payload: req.body,
    });
    auditService.markResource(res, { type: 'penalty', id: result.penalty.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.issuePenalty = issuePenalty;
exports.default = { listComplaints, resolveComplaint, listUsers, updateUserStatus, moderateTrip, issuePenalty };
//# sourceMappingURL=adminModerationController.js.map