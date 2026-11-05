import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as planService from '../Services/planService';

const listActivePlans = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const plans = await (planService as unknown as { getActivePlans: () => Promise<unknown> }).getActivePlans();
  successResponse(res, { plans });
});

export { listActivePlans };
export default { listActivePlans };
