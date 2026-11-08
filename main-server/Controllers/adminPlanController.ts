import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as planService from '../Services/planService';
import * as subscriptionService from '../Services/subscriptionService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listPlans = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const plans = await (planService as unknown as { listPlans: () => Promise<unknown> }).listPlans();
  successResponse(res, { plans });
});

const getFreePlan = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const plan = await (planService as unknown as { getFreePlan: () => Promise<unknown> }).getFreePlan();
  successResponse(res, { plan });
});

const updateFreePlan = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const plan = await (planService as unknown as { updateFreePlan: (body: unknown, actorId: string) => Promise<{ id: string }> }).updateFreePlan(req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'subscription_plan', id: plan.id });
  successResponse(res, { plan });
});

const createPlan = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const plan = await (planService as unknown as { createPlan: (body: unknown, actorId: string) => Promise<{ id: string }> }).createPlan(req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'subscription_plan', id: plan.id });
  successResponse(res, { plan }, 201);
});

const updatePlan = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { plan_id } = req.params as { plan_id: string };
  const plan = await (planService as unknown as { updatePlan: (id: string, body: unknown, actorId: string) => Promise<{ id: string }> }).updatePlan(plan_id, req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'subscription_plan', id: plan.id });
  successResponse(res, { plan });
});

const deactivatePlan = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { plan_id } = req.params as { plan_id: string };
  const result = await (planService as unknown as { deactivatePlan: (id: string, actorId: string) => Promise<unknown> }).deactivatePlan(plan_id, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'subscription_plan', id: plan_id });
  successResponse(res, result);
});

const listPaymentMethods = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const methods = await (planService as unknown as { listPaymentMethods: () => Promise<unknown> }).listPaymentMethods();
  successResponse(res, { methods });
});

const createPaymentMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const method = await (planService as unknown as { createPaymentMethod: (body: unknown, actorId: string) => Promise<{ id: string }> }).createPaymentMethod(req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method.id });
  successResponse(res, { method }, 201);
});

const updatePaymentMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { method_id } = req.params as { method_id: string };
  const method = await (planService as unknown as { updatePaymentMethod: (id: string, body: unknown, actorId: string) => Promise<{ id: string }> }).updatePaymentMethod(method_id, req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method.id });
  successResponse(res, { method });
});

const deactivatePaymentMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { method_id } = req.params as { method_id: string };
  const result = await (planService as unknown as { deactivatePaymentMethod: (id: string, actorId: string) => Promise<unknown> }).deactivatePaymentMethod(method_id, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method_id });
  successResponse(res, result);
});

const permanentlyDeletePaymentMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { method_id } = req.params as { method_id: string };
  const result = await (planService as unknown as { permanentlyDeletePaymentMethod: (id: string, actorId: string) => Promise<unknown> }).permanentlyDeletePaymentMethod(method_id, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method_id });
  successResponse(res, result);
});

const listPendingSubscriptions = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { status, sort } = req.query as { status?: string; sort?: string };
  const pending = await (subscriptionService as unknown as { listPending: (opts: unknown) => Promise<unknown> }).listPending({ status, sort });
  successResponse(res, { pending });
});

const getSubscriptionStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (subscriptionService as unknown as { getStats: () => Promise<unknown> }).getStats());
});

const getSubscriptionDetail = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { subscription_id } = req.params as { subscription_id: string };
  successResponse(res, await (subscriptionService as unknown as { getDetail: (id: string) => Promise<unknown> }).getDetail(subscription_id));
});

const approveSubscription = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { subscription_id } = req.params as { subscription_id: string };
  const result = await (subscriptionService as unknown as { approve: (id: string, actorId: string) => Promise<unknown> }).approve(subscription_id, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver_subscription', id: subscription_id });
  successResponse(res, result);
});

const rejectSubscription = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { subscription_id } = req.params as { subscription_id: string };
  const { reason } = req.body as { reason: string };
  const result = await (subscriptionService as unknown as { reject: (id: string, reason: string, actorId: string) => Promise<unknown> }).reject(subscription_id, reason, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver_subscription', id: subscription_id });
  successResponse(res, result);
});

export {
  listPlans,
  getFreePlan,
  updateFreePlan,
  createPlan,
  updatePlan,
  deactivatePlan,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deactivatePaymentMethod,
  permanentlyDeletePaymentMethod,
  listPendingSubscriptions,
  getSubscriptionStats,
  getSubscriptionDetail,
  approveSubscription,
  rejectSubscription,
};
export default {
  listPlans,
  getFreePlan,
  updateFreePlan,
  createPlan,
  updatePlan,
  deactivatePlan,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deactivatePaymentMethod,
  permanentlyDeletePaymentMethod,
  listPendingSubscriptions,
  getSubscriptionStats,
  getSubscriptionDetail,
  approveSubscription,
  rejectSubscription,
};
