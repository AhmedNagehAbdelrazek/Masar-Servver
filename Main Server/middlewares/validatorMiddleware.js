const { validationResult } = require('express-validator');
const { ApiErrors } = require('../utils/ApiError');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return next(ApiErrors.validation('Validation failed', details));
  }

  next();
}

module.exports = validate;
