import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as adminSearchService from '../Services/adminSearchService';

const search = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(
    res,
    await (adminSearchService as unknown as {
      search: (query: unknown) => Promise<unknown>;
    }).search(req.query),
  );
});

export { search };
export default { search };
