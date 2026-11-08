import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as service from '../Services/adminRideRequestService';

const getStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { getStats: () => Promise<unknown> }).getStats());
});

const listRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { listRequests: (q: unknown) => Promise<unknown> }).listRequests(req.query));
});

const getDetail = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { request_id } = req.params as { request_id: string };
  successResponse(res, await (service as unknown as { getDetail: (id: string) => Promise<unknown> }).getDetail(request_id));
});

export { getStats, listRequests, getDetail };
export default { getStats, listRequests, getDetail };
