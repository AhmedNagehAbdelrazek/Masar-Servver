import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import { parsePagination, buildPagination } from '../utils/pagination';
import { maskPhone } from '../utils/masking';
import { ApiErrors } from '../utils/ApiError';
import { TRIP_STATUS } from '../config/constants';
import * as complaintService from '../Services/complaintService';
import * as penaltyService from '../Services/penaltyService';
import * as auditService from '../Services/auditService';
import { User, Notification, Trip } from '../Models';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listComplaints = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (complaintService as unknown as { listAdmin: (q: unknown) => Promise<unknown> }).listAdmin(req.query);
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
  const { rows, count } = await (User as unknown as { findAndCountAll: (opts: unknown) => Promise<{ rows: Array<Record<string, unknown>>; count: number }> }).findAndCountAll({
    where,
    attributes: ['id', 'fullName', 'phone', 'role', 'status', 'avgRating', 'createdat'],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  successResponse(res, {
    data: rows.map((u: Record<string, unknown>) => ({
      id: u['id'],
      full_name: u['fullName'],
      phone: maskPhone(u['phone'] as string),
      role: u['role'],
      status: u['status'],
      avg_rating: Number((u['avgRating'] as number) || 0),
      created_at: u['createdat'],
    })),
    pagination: buildPagination(count, page, limit),
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { user_id } = req.params as { user_id: string };
  const { status, reason } = req.body as { status: string; reason?: string };
  const user = await (User as unknown as { findByPk: (id: string) => Promise<Record<string, unknown> | null> }).findByPk(user_id);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }
  await (user as unknown as { update: (data: unknown) => Promise<void> }).update({ status });
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: `user.status.${status}`,
    resourceType: 'user',
    resourceId: user['id'],
    actorId: authReq.user?.id,
    payload: { reason: reason || null },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: user['id'] });
  if (reason) {
    await (Notification as unknown as { create: (data: unknown) => Promise<unknown> }).create({
      userId: user['id'],
      type: 'VERIFICATION_REJECTED',
      title: 'Account status updated',
      body: `Your account status was changed to ${status}. Reason: ${reason}`,
      data: { status },
      sentVia: ['in_app'],
    });
  }
  successResponse(res, {
    user: { id: user['id'], status: (user as Record<string, unknown>)['status'], updated_by: authReq.user?.id },
  });
});

const moderateTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const trip = await (Trip as unknown as { findByPk: (id: string) => Promise<Record<string, unknown> | null> }).findByPk(trip_id);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  const { action, reason } = req.body as { action: string; reason?: string };
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

export { listComplaints, resolveComplaint, listUsers, updateUserStatus, moderateTrip, issuePenalty };
export default { listComplaints, resolveComplaint, listUsers, updateUserStatus, moderateTrip, issuePenalty };
