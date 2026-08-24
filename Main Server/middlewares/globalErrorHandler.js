const ApiError = require('../utils/ApiError');
const multer = require('multer');
const { ValidationError, UniqueConstraintError } = require('sequelize');

function globalErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path).join(', ');
    return res.status(409).json({
      status: 'error',
      message: `Duplicate value for: ${fields}`,
      code: 'CONFLICT',
    });
  }

  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'error',
        message: 'File too large. Maximum allowed size is 10 MB.',
        code: 'FILE_TOO_LARGE',
      });
    }

    return res.status(400).json({
      status: 'error',
      message: err.message || 'Invalid upload.',
      code: 'INVALID_UPLOAD',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token.',
      code: 'UNAUTHORIZED',
    });
  }

  console.error('Unhandled error:', err);

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const rawMessage =
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  const message = typeof rawMessage === 'string' ? rawMessage : 'Internal server error';

  return res.status(statusCode).json({
    status: 'error',
    message,
    code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = globalErrorHandler;
