const ApiError = require('../utils/ApiError');
const { ValidationError, UniqueConstraintError } = require('sequelize');

function globalErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    return res.status(422).json({
      status: 'error',
      message: messages,
      code: 'VALIDATION_ERROR',
    });
  }

  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path).join(', ');
    return res.status(409).json({
      status: 'error',
      message: `Duplicate value for: ${fields}`,
      code: 'CONFLICT',
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

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error';

  return res.status(statusCode).json({
    status: 'error',
    message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = globalErrorHandler;
