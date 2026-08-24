class ApiError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(typeof message === 'string' ? message : String(message));
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = Array.isArray(details) && details.length > 0 ? details : null;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: 'error',
      message: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }
}

const ApiErrors = {
  badRequest: (message = 'Bad request', details = null) =>
    new ApiError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message = 'Unauthorized', details = null) =>
    new ApiError(message, 401, 'UNAUTHORIZED', details),

  forbidden: (message = 'Forbidden', details = null) =>
    new ApiError(message, 403, 'FORBIDDEN', details),

  notFound: (message = 'Resource not found', details = null) =>
    new ApiError(message, 404, 'NOT_FOUND', details),

  conflict: (message = 'Conflict', details = null) =>
    new ApiError(message, 409, 'CONFLICT', details),

  validation: (message = 'Validation failed', details = null) =>
    new ApiError(message, 422, 'VALIDATION_ERROR', details),

  serverError: (message = 'Internal server error', details = null) =>
    new ApiError(message, 500, 'INTERNAL_ERROR', details),

  custom: (message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) =>
    new ApiError(message, statusCode, code, details),
};

module.exports = ApiError;
module.exports.ApiErrors = ApiErrors;
