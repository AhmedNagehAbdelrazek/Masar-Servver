import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import ApiError from '../utils/ApiError';
import { modeFor, shape, tValidation } from '../utils/i18n';
import type { LocaleMode } from '../utils/i18n';

interface ExtendedError extends Error {
  statusCode?: number;
  code?: string;
  stack?: string;
}

const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    return next(err);
  }

  const mode: LocaleMode = modeFor(req as unknown as Parameters<typeof modeFor>[0]);
  const error = err as ExtendedError & {
    errors?: Array<{ path: string; message: string; value: unknown }>;
    name?: string;
  };

  if (error instanceof ApiError) {
    res.status(error.statusCode).json(error.toResponse(mode));
    return;
  }

  if (error instanceof UniqueConstraintError) {
    const fields: string = error.errors.map((e) => (e as { path: string }).path).join(', ');
    res.status(409).json({
      status: 'error',
      ...shape('DUPLICATE_VALUE_FOR', { fields }, mode),
      code: 'CONFLICT',
    });
    return;
  }

  if (error instanceof ValidationError) {
    const details: Array<{ field: string; message: string; value: unknown }> = error.errors.map(
      (e) => ({
        field: (e as { path: string }).path,
        message: tValidation((e as { message: string }).message, mode),
        value: (e as { value: unknown }).value,
      }),
    );
    res.status(422).json({
      status: 'error',
      ...shape('VALIDATION_FAILED', null, mode),
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        status: 'error',
        ...shape('FILE_TOO_LARGE_10MB', null, mode),
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    res.status(400).json({
      status: 'error',
      message: tValidation(error.message, mode) || shape('INVALID_UPLOAD', null, mode).message,
      code: 'INVALID_UPLOAD',
    });
    return;
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      ...shape('INVALID_OR_EXPIRED_TOKEN', null, mode),
      code: 'UNAUTHORIZED',
    });
    return;
  }

  console.error('Unhandled error:', err);

  const statusCode: number = typeof error.statusCode === 'number' ? error.statusCode : 500;
  const rawMessage: string | null =
    process.env.NODE_ENV === 'development' ? error.message : null;
  const message: string =
    typeof rawMessage === 'string' ? rawMessage : shape('INTERNAL_ERROR', null, mode).message;

  res.status(statusCode).json({
    status: 'error',
    message,
    code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default globalErrorHandler;
module.exports = globalErrorHandler;
