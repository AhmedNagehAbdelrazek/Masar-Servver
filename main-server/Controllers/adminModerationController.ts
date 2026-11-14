import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import { parsePagination, buildPagination } from '../utils/pagination';
import { maskPhone } from '../utils/masking';
import { ApiErrors } from '../utils/ApiError';
import { TRIP_STATUS } from '../config/constants';
import { Op } from 'sequelize';
import * as complaintService from '../Services/complaintService';
import * as penaltyService from '../Services/penaltyService';
import * as deletionRequestService from '../Services/deletionRequestService';
import * as adminUserService from '../Services/adminUserService';
import * as auditService from '../Services/auditService';
import * as tripEventService from '../Services/tripEventService';
import { DeletionRequest, User, Trip } from '../Models';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listComplaints = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (complaintService as unknown as { listAdmin: (q: unknown) => Promise<unknown> }).listAdmin(req.query);
  successResponse(res, result);
});

const getComplaintStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (complaintService as unknown as { getStats: () => Promise<unknown> }).getStats());
});

const getComplaintDetail = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { complaint_id } = req.params as { complaint_id: string };
  successResponse(res, await (complaintService as unknown as { getDetail: (id: string) => Promise<unknown> }).getDetail(complaint_id));
});

const penalizeComplaint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { complaint_id } = req.params as { complaint_id: string };
  const result = await (complaintService as unknown as { penalize: (actorId: string, id: string, body: unknown) => Promise<unknown> }).penalize(String(authReq.user?.id), complaint_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'complaint.penalty',
    resourceType: 'complaint',
    resourceId: complaint_id,
    actorId: authReq.user?.id,
    payload: req.body,
  });
  successResponse(res, result);
});

const reopenComplaint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { complaint_id } = req.params as { complaint_id: string };
  const { reason } = req.body as { reason?: string };
  const result = await (complaintService as unknown as { reopen: (actorId: string, id: string, reason?: string) => Promise<unknown> }).reopen(String(authReq.user?.id), complaint_id, reason);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'complaint.reopen',
    resourceType: 'complaint',
    resourceId: complaint_id,
    actorId: authReq.user?.id,
    payload: { reason: reason || null },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'complaint', id: complaint_id });
  successResponse(res, result);
});

const closeComplaint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { complaint_id } = req.params as { complaint_id: string };
  const result = await (complaintService as unknown as { close: (actorId: string, id: string, body: unknown) => Promise<unknown> }).close(String(authReq.user?.id), complaint_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'complaint.closed',
    resourceType: 'complaint',
    resourceId: complaint_id,
    actorId: authReq.user?.id,
    payload: req.body,
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'complaint', id: complaint_id });
  successResponse(res, result);
});

const resolveComplaint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { complaint_id } = req.params as { complaint_id: string };
  const body = req.body as { status: string };
  const result = await (complaintService as unknown as { resolve: (actorId: string, id: string, body: unknown) => Promise<unknown> }).resolve(String(authReq.user?.id), complaint_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: `complaint.${body.status}`,
    resourceType: 'complaint',
    resourceId: complaint_id,
    actorId: authReq.user?.id,
    payload: req.body,
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'complaint', id: complaint_id });
  successResponse(res, result);
});

const listUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { role, status } = req.query as { role?: string; status?: string };
  const { page, limit, offset } = parsePagination(req.query as Record<string, string | number | undefined>);
  const where: Record<string, unknown> = {};
  if (role) where['role'] = role;
  if (status) where['status'] = status;

  // Soft-deleted accounts stay in the database for history/audit but are no
  // longer part of the active user directory.
  const deletionRows = await (DeletionRequest as unknown as {
    findAll: (opts: unknown) => Promise<Array<{ userId: string }>>;
  }).findAll({
    where: { status: { [Op.in]: ['pending', 'approved'] } },
    attributes: ['userId'],
    raw: true,
  });
  const deletionIds = deletionRows.map((row) => row.userId).filter(Boolean);
  if (deletionIds.length) where['id'] = { [Op.notIn]: deletionIds };

  const { rows, count } = await (User as unknown as { findAndCountAll: (opts: unknown) => Promise<{ rows: Array<Record<string, unknown>>; count: number }> }).findAndCountAll({
    where,
    attributes: [
      'id', 'fullName', 'phone', 'email', 'age', 'gender', 'role', 'status',
      'verificationStatus', 'isVerified', 'avgRating', 'lastLoginAt', 'createdat',
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  successResponse(res, {
    data: rows.map((u: Record<string, unknown>) => ({
      id: u['id'],
      full_name: u['fullName'],
      phone: maskPhone(u['phone'] as string),
      email: u['email'] ?? null,
      age: u['age'] == null ? null : Number(u['age']),
      gender: u['gender'] ?? null,
      role: u['role'],
      status: u['status'],
      verification_status: u['verificationStatus'] ?? null,
      is_verified: u['isVerified'] === true,
      avg_rating: Number((u['avgRating'] as number) || 0),
      last_login_at: u['lastLoginAt'] ?? null,
      created_at: u['createdAt'] ?? u['createdat'],
    })),
    pagination: buildPagination(count, page, limit),
  });
});

const getUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { user_id } = req.params as { user_id: string };
  const result = await (adminUserService as unknown as {
    getUser: (id: string) => Promise<unknown>;
  }).getUser(user_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: user_id });
  successResponse(res, result);
});

const updateUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { user_id } = req.params as { user_id: string };
  const result = await (adminUserService as unknown as {
    updateUser: (actorId: string, id: string, payload: unknown) => Promise<unknown>;
  }).updateUser(String(authReq.user?.id), user_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: user_id });
  successResponse(res, result);
});

const permanentlyDeleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { user_id } = req.params as { user_id: string };
  const result = await (adminUserService as unknown as {
    deleteUser: (actorId: string, id: string, payload: unknown) => Promise<unknown>;
  }).deleteUser(String(authReq.user?.id), user_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: user_id });
  successResponse(res, result);
});

const listDeletionRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (deletionRequestService as unknown as {
    listAdmin: (query: unknown) => Promise<unknown>;
  }).listAdmin(req.query);
  successResponse(res, result);
});

const reviewDeletionRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { request_id } = req.params as { request_id: string };
  const result = await (deletionRequestService as unknown as {
    review: (actorId: string, id: string, body: unknown) => Promise<unknown>;
  }).review(String(authReq.user?.id), request_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'deletion_request', id: request_id });
  successResponse(res, result);
});

const moderateTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const trip = await (Trip as unknown as { findByPk: (id: string) => Promise<Record<string, unknown> | null> }).findByPk(trip_id);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  const { action, reason } = req.body as { action: string; reason?: string };
  const previousStatus = trip['status'];
  if (action === 'restore') {
    await (trip as unknown as { update: (data: unknown) => Promise<void> }).update({
      isModerated: false,
      moderationReason: null,
      moderatedBy: null,
      status: TRIP_STATUS.PUBLISHED,
    });
  } else {
    await (trip as unknown as { update: (data: unknown) => Promise<void> }).update({
      isModerated: true,
      moderationReason: reason || null,
      moderatedBy: authReq.user?.id,
      ...(action === 'block' ? { status: TRIP_STATUS.CANCELLED } : {}),
    });
  }
  await tripEventService.record({
    tripId: trip_id,
    eventType: action === 'block' ? 'trip.cancelled' : 'trip.moderated',
    fromStatus: previousStatus ? String(previousStatus) : null,
    toStatus: trip['status'] ? String(trip['status']) : null,
    actorId: authReq.user?.id,
    actorRole: 'admin',
    details: { action, reason: reason || null, source: 'admin_moderation' },
  });
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: `trip.${action}`,
    resourceType: 'trip',
    resourceId: (trip as Record<string, unknown>)['id'],
    actorId: authReq.user?.id,
    payload: { reason: reason || null },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: (trip as Record<string, unknown>)['id'] });
  successResponse(res, {
    trip: {
      id: (trip as Record<string, unknown>)['id'],
      status: (trip as Record<string, unknown>)['status'],
      is_blocked_by_balance: (trip as Record<string, unknown>)['isBlockedByBalance'],
      moderated: (trip as Record<string, unknown>)['isModerated'],
    },
  });
});

const issuePenalty = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const body = req.body as { type: string };
  const result = await (penaltyService as unknown as { issue: (actorId: string, body: unknown) => Promise<{ penalty: { id: string } }> }).issue(String(authReq.user?.id), req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: `penalty.${body.type}`,
    resourceType: 'penalty',
    resourceId: result.penalty.id,
    actorId: authReq.user?.id,
    payload: req.body,
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'penalty', id: result.penalty.id });
  successResponse(res, result);
});

export { listComplaints, getComplaintStats, getComplaintDetail, penalizeComplaint, reopenComplaint, closeComplaint, resolveComplaint, listUsers, getUser, updateUserStatus, permanentlyDeleteUser, listDeletionRequests, reviewDeletionRequest, moderateTrip, issuePenalty };
export default { listComplaints, getComplaintStats, getComplaintDetail, penalizeComplaint, reopenComplaint, closeComplaint, resolveComplaint, listUsers, getUser, updateUserStatus, permanentlyDeleteUser, listDeletionRequests, reviewDeletionRequest, moderateTrip, issuePenalty };
