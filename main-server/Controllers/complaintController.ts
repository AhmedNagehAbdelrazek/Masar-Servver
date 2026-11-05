import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as complaintService from '../Services/complaintService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createComplaint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (complaintService as unknown as { create: (userId: string, body: unknown) => Promise<{ complaint: { id: string } }> }).create(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'complaint', id: result.complaint.id });
  successResponse(res, result);
});

export { createComplaint };
export default { createComplaint };
