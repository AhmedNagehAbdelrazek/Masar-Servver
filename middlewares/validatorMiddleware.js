const { validationResult } = require('express-validator');
const { ApiErrors } = require('../utils/ApiError');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    const error = ApiErrors.validation('Validation failed');
    error.message = formattedErrors;
    return next(error);
  }

  next();
}

module.exports = validate;
