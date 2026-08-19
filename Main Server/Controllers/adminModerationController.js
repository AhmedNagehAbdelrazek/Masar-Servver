const complaintService = require('../Services/complaintService');
const penaltyService = require('../Services/penaltyService');
const auditService = require('../Services/auditService');
const { markResource } = auditService;
const { successResponse } = require('../utils/httpResponse');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { maskPhone } = require('../utils/masking');

const listComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.listAdmin(req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const resolveComplaint = async (req, res, next) => {
  try {
    const result = await complaintService.resolve(req.user.id, req.params.complaint_id, req.body);
    auditService.track({
      action: `complaint.${req.body.status}`,
      resourceType: 'complaint',
      resourceId: req.params.complaint_id,
      actorId: req.user.id,
      payload: req.body,
    });
    markResource(res, { type: 'complaint', id: req.params.complaint_id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { User } = require('../Models');
    const { role, status } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'fullName', 'phone', 'role', 'status', 'avgRating', 'createdat'],
      order: [['createdat', 'DESC']],
      offset,
      limit,
    });

    successResponse(res, {
      data: rows.map((u) => ({
        id: u.id,
        full_name: u.fullName,
        phone: maskPhone(u.phone),
        role: u.role,
        status: u.status,
        avg_rating: Number(u.avgRating || 0),
        created_at: u.createdat,
      })),
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { User } = require('../Models');
    const { Notification } = require('../Models');

    const user = await User.findByPk(req.params.user_id);
    if (!user) {
      const { ApiErrors } = require('../utils/ApiError');
      throw ApiErrors.notFound('User not found');
    }

    await user.update({ status: req.body.status });

    auditService.track({
      action: `user.status.${req.body.status}`,
      resourceType: 'user',
      resourceId: user.id,
      actorId: req.user.id,
      payload: { reason: req.body.reason || null },
    });

    markResource(res, { type: 'user', id: user.id });

    if (req.body.reason) {
      await Notification.create({
        userId: user.id,
        type: 'VERIFICATION_REJECTED',
        title: 'Account status updated',
        body: `Your account status was changed to ${req.body.status}. Reason: ${req.body.reason}`,
        data: { status: req.body.status },
        sentVia: ['in_app'],
      });
    }

    successResponse(res, {
      user: { id: user.id, status: user.status, updated_by: req.user.id },
    });
  } catch (err) {
    next(err);
  }
};

const moderateTrip = async (req, res, next) => {
  try {
    const { Trip } = require('../Models');
    const { ApiErrors } = require('../utils/ApiError');
    const { TRIP_STATUS } = require('../config/constants');

    const trip = await Trip.findByPk(req.params.trip_id);
    if (!trip) throw ApiErrors.notFound('Trip not found');

    const { action, reason } = req.body;

    if (action === 'restore') {
      await trip.update({
        isModerated: false,
        moderationReason: null,
        moderatedBy: null,
        status: TRIP_STATUS.PUBLISHED,
      });
    } else {
      await trip.update({
        isModerated: true,
        moderationReason: reason || null,
        moderatedBy: req.user.id,
        ...(action === 'block' ? { status: TRIP_STATUS.CANCELLED } : {}),
      });
    }

    auditService.track({
      action: `trip.${action}`,
      resourceType: 'trip',
      resourceId: trip.id,
      actorId: req.user.id,
      payload: { reason: reason || null },
    });

    markResource(res, { type: 'trip', id: trip.id });

    successResponse(res, {
      trip: {
        id: trip.id,
        status: trip.status,
        is_blocked_by_balance: trip.isBlockedByBalance,
        moderated: trip.isModerated,
      },
    });
  } catch (err) {
    next(err);
  }
};

const issuePenalty = async (req, res, next) => {
  try {
    const result = await penaltyService.issue(req.user.id, req.body);
    auditService.track({
      action: `penalty.${req.body.type}`,
      resourceType: 'penalty',
      resourceId: result.penalty.id,
      actorId: req.user.id,
      payload: req.body,
    });
    markResource(res, { type: 'penalty', id: result.penalty.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listComplaints,
  resolveComplaint,
  listUsers,
  updateUserStatus,
  moderateTrip,
  issuePenalty,
};
