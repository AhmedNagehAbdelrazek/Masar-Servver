import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiErrors } from '../utils/ApiError';
import { isAccessTokenBlacklisted } from '../Services/authService';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface AccessTokenPayload {
  id: string;
  role: string;
  type: string;
  exp?: number;
  iat?: number;
}

async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader: string | undefined = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiErrors.unauthorized('AUTH_NO_TOKEN'));
  }

  const token: string | undefined = authHeader.split(' ')[1];
  if (!token) {
    return next(ApiErrors.unauthorized('AUTH_NO_TOKEN'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

    if (decoded.type !== 'access') {
      return next(ApiErrors.unauthorized('AUTH_INVALID_TOKEN_TYPE'));
    }

    const blacklisted: boolean = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(ApiErrors.unauthorized('AUTH_TOKEN_REVOKED'));
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err: unknown) {
    const error = err as Error & { name?: string };
    if (error.name === 'TokenExpiredError') {
      return next(ApiErrors.unauthorized('AUTH_TOKEN_EXPIRED'));
    }
    return next(ApiErrors.unauthorized('AUTH_INVALID_TOKEN'));
  }
}

export default protect;
// CommonJS interop for remaining JS files that use require()
module.exports = protect;
