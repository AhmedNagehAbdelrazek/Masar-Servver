import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as ratingService from '../Services/ratingService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createRating = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (ratingService as unknown as { create: (userId: string, body: unknown) => Promise<{ rating: { id: string } }> }).create(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'rating', id: result.rating.id });
  successResponse(res, result);
});

export { createRating };
export default { createRating };
