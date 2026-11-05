import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as subscriptionService from '../Services/subscriptionService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createSubscription = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const sub = await (subscriptionService as unknown as { createSubscription: (userId: string, body: unknown) => Promise<{ id: string; status: string }> }).createSubscription(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver_subscription', id: sub.id });
  successResponse(res, { subscription_id: sub.id, status: sub.status, message: 'SUBSCRIPTION_PENDING_ADMIN_APPROVAL' }, 201);
});

const getMySubscriptions = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const subscriptions = await (subscriptionService as unknown as { getMySubscriptions: (userId: string) => Promise<unknown> }).getMySubscriptions(String(authReq.user?.id));
  successResponse(res, { subscriptions });
});

const getCurrentSubscription = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (subscriptionService as unknown as { getCurrentSubscription: (userId: string) => Promise<unknown> }).getCurrentSubscription(String(authReq.user?.id));
  successResponse(res, result);
});

export { createSubscription, getMySubscriptions, getCurrentSubscription };
export default { createSubscription, getMySubscriptions, getCurrentSubscription };
