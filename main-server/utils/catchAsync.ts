import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

const catchAsync =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;
export { catchAsync };

// CommonJS compatibility: `const catchAsync = require('../utils/catchAsync')` should be the function itself
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = catchAsync;
  // @ts-ignore
  module.exports.default = catchAsync;
  // @ts-ignore
  module.exports.catchAsync = catchAsync;
}
