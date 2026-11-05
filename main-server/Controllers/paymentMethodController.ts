import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as planService from '../Services/planService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listActiveMethods = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const methods = await (planService as unknown as { getActivePaymentMethods: () => Promise<unknown> }).getActivePaymentMethods();
  successResponse(res, { methods });
});

const listAllMethods = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const methods = await (planService as unknown as { listPaymentMethods: () => Promise<unknown> }).listPaymentMethods();
  successResponse(res, { methods });
});

const createMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const method = await (planService as unknown as { createPaymentMethod: (body: unknown, actorId: string) => Promise<{ id: string }> }).createPaymentMethod(req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method.id });
  successResponse(res, { payment_method: method }, 201);
});

const updateMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { method_id } = req.params as { method_id: string };
  const method = await (planService as unknown as { updatePaymentMethod: (id: string, body: unknown, actorId: string) => Promise<{ id: string }> }).updatePaymentMethod(method_id, req.body, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method.id });
  successResponse(res, { payment_method: method });
});

const deactivateMethod = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { method_id } = req.params as { method_id: string };
  const result = await (planService as unknown as { deactivatePaymentMethod: (id: string, actorId: string) => Promise<unknown> }).deactivatePaymentMethod(method_id, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'payment_method', id: method_id });
  successResponse(res, result);
});

export { listActiveMethods, listAllMethods, createMethod, updateMethod, deactivateMethod };
export default { listActiveMethods, listAllMethods, createMethod, updateMethod, deactivateMethod };
