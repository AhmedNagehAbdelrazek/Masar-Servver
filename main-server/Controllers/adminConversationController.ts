import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as service from '../Services/adminConversationService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { getStats: () => Promise<unknown> }).getStats());
});

const listConversations = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { listConversations: (q: unknown) => Promise<unknown> }).listConversations(req.query));
});

const getTripThread = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { booking_id } = req.params as { booking_id: string };
  successResponse(res, await (service as unknown as { getTripThread: (id: string, q: unknown) => Promise<unknown> }).getTripThread(booking_id, req.query));
});

const penalize = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (service as unknown as { penalize: (a: string, id: string, dto: unknown) => Promise<unknown> }).penalize(String(authReq.user?.id), booking_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'admin.conversation.penalty',
    resourceType: 'booking',
    resourceId: booking_id,
    actorId: authReq.user?.id,
    payload: req.body,
  });
  successResponse(res, result);
});

export { getStats, listConversations, getTripThread, penalize };
export default { getStats, listConversations, getTripThread, penalize };
