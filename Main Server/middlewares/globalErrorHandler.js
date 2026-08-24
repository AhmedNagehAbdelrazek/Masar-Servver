const ApiError = require('../utils/ApiError');
const { modeFor, shape, tValidation } = require('../utils/i18n');
const multer = require('multer');
const { ValidationError, UniqueConstraintError } = require('sequelize');

function globalErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const mode = modeFor(req);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toResponse(mode));
  }

  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path).join(', ');
    return res.status(409).json({
      status: 'error',
      ...shape('DUPLICATE_VALUE_FOR', { fields }, mode),
      code: 'CONFLICT',
    });
  }

  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: tValidation(e.message, mode),
      value: e.value,
    }));
    return res.status(422).json({
      status: 'error',
      ...shape('VALIDATION_FAILED', null, mode),
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'error',
        ...shape('FILE_TOO_LARGE_10MB', null, mode),
        code: 'FILE_TOO_LARGE',
      });
    }

    return res.status(400).json({
      status: 'error',
      message: tValidation(err.message, mode) || shape('INVALID_UPLOAD', null, mode).message,
      code: 'INVALID_UPLOAD',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      ...shape('INVALID_OR_EXPIRED_TOKEN', null, mode),
      code: 'UNAUTHORIZED',
    });
  }

  console.error('Unhandled error:', err);

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const rawMessage =
    process.env.NODE_ENV === 'development' ? err.message : null;
  const message = typeof rawMessage === 'string' ? rawMessage : shape('INTERNAL_ERROR', null, mode).message;

  return res.status(statusCode).json({
    status: 'error',
    message,
    code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = globalErrorHandler;
