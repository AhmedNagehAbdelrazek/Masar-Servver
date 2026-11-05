import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { envelopeResponse } from '../utils/httpResponse';
import * as driverVerificationService from '../Services/driverVerificationService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (driverVerificationService as unknown as { getStatus: (id: string) => Promise<unknown> }).getStatus(String(authReq.user?.id));
  envelopeResponse(res, result);
});

const getSubmission = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (driverVerificationService as unknown as { getSubmission: (id: string) => Promise<unknown> }).getSubmission(String(authReq.user?.id));
  envelopeResponse(res, result);
});

const submit = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (driverVerificationService as unknown as { submitOrResubmit: (id: string, body: unknown) => Promise<unknown> }).submitOrResubmit(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: authReq.user?.id });
  envelopeResponse(res, result);
});

export { getStatus, getSubmission, submit };
export default { getStatus, getSubmission, submit };
