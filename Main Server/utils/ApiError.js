class ApiError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: 'error',
      message: this.message,
      code: this.code,
    };
  }
}

const ApiErrors = {
  badRequest: (message = 'Bad request') =>
    new ApiError(message, 400, 'BAD_REQUEST'),

  unauthorized: (message = 'Unauthorized') =>
    new ApiError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new ApiError(message, 403, 'FORBIDDEN'),

  notFound: (message = 'Resource not found') =>
    new ApiError(message, 404, 'NOT_FOUND'),

  conflict: (message = 'Conflict') =>
    new ApiError(message, 409, 'CONFLICT'),

  validation: (message = 'Validation error') =>
    new ApiError(message, 422, 'VALIDATION_ERROR'),

  serverError: (message = 'Internal server error') =>
    new ApiError(message, 500, 'INTERNAL_ERROR'),
};

module.exports = ApiError;
module.exports.ApiErrors = ApiErrors;
