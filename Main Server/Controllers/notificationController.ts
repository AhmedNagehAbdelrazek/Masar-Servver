import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import { parsePagination, buildPagination } from '../utils/pagination';
import * as notificationService from '../Services/notificationService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { page, limit } = parsePagination(req.query as Record<string, string | number | undefined>);
  let unread: boolean | null = null;
  const { unread: unreadQuery } = req.query as { unread?: string };
  if (unreadQuery === 'true') unread = true;
  else if (unreadQuery === 'false') unread = false;
  const { rows, count } = await (notificationService as unknown as { listForUser: (userId: string, opts: unknown) => Promise<{ rows: Array<Record<string, unknown>>; count: number }> }).listForUser(String(authReq.user?.id), { unread, page, limit });
  const data = rows.map((n: Record<string, unknown>) => ({
    id: n['id'],
    type: n['type'],
    title: n['title'],
    body: n['body'],
    data: n['data'],
    is_read: n['isRead'],
    created_at: (n['createdat'] as string) || (n['createdAt'] as string),
  }));
  successResponse(res, { data, pagination: buildPagination(count, page, limit) });
});

const markRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { notification_id } = req.params as { notification_id: string };
  const notification = await (notificationService as unknown as { markRead: (userId: string, id: string) => Promise<Record<string, unknown>> }).markRead(String(authReq.user?.id), notification_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'notification', id: notification['id'] });
  successResponse(res, { notification: { id: notification['id'], is_read: notification['isRead'] } });
});

const registerDevice = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { fcm_token } = (req.body || {}) as { fcm_token: string };
  const result = await (notificationService as unknown as { registerDevice: (userId: string, token: string) => Promise<{ registered: boolean }> }).registerDevice(String(authReq.user?.id), fcm_token);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: String(authReq.user?.id) });
  successResponse(res, { device: result });
});

const unregisterDevice = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { fcm_token } = (req.body || {}) as { fcm_token?: string };
  const result = await (notificationService as unknown as { unregisterDevice: (userId: string, token?: string | null) => Promise<{ registered: boolean }> }).unregisterDevice(String(authReq.user?.id), fcm_token ?? null);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: String(authReq.user?.id) });
  successResponse(res, { device: result });
});

export { listNotifications, markRead, registerDevice, unregisterDevice };
export default { listNotifications, markRead, registerDevice, unregisterDevice };
