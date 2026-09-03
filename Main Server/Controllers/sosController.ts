import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as sosService from '../Services/sosService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listSos = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (sosService as unknown as { listAdmin: (user: { id: string; role: string } | undefined, q: unknown) => Promise<unknown> }).listAdmin(authReq.user as { id: string; role: string }, req.query);
  successResponse(res, result);
});

const ackSos = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { id } = req.params as { id: string };
  const result = await (sosService as unknown as { acknowledge: (user: { id: string; role: string } | undefined, id: string) => Promise<unknown> }).acknowledge(authReq.user as { id: string; role: string }, id);
  successResponse(res, result);
});

const resolveSos = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { id } = req.params as { id: string };
  const { resolution_note } = req.body as { resolution_note: string };
  const result = await (sosService as unknown as { resolve: (user: { id: string; role: string } | undefined, id: string, note: string) => Promise<unknown> }).resolve(authReq.user as { id: string; role: string }, id, resolution_note);
  successResponse(res, result);
});

export { listSos, ackSos, resolveSos };
export default { listSos, ackSos, resolveSos };
