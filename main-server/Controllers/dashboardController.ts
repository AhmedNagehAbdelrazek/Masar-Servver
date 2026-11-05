import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as dashboardService from '../Services/dashboardService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getDashboard = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (dashboardService as unknown as { getDashboard: (userId: string) => Promise<unknown> }).getDashboard(String(authReq.user?.id));
  successResponse(res, result);
});

export { getDashboard };
export default { getDashboard };
