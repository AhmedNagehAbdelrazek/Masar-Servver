import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiErrors } from '../utils/ApiError';

function roleGuard(allowedRoles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiErrors.unauthorized('AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiErrors.forbidden('AUTH_INSUFFICIENT_ROLE'));
    }

    next();
  };
}

export default roleGuard;
export { roleGuard };
module.exports = roleGuard;
// Preserve named export for require() destructuring
(module.exports as unknown as { roleGuard: typeof roleGuard }).roleGuard = roleGuard;
