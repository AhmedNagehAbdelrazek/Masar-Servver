const { validationResult } = require('express-validator');
const { ApiErrors } = require('../utils/ApiError');
const { tValidation, modeFor } = require('../utils/i18n');

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const mode = modeFor(req);
    const details = errors.array().map((err) => ({
      field: err.path,
      message: tValidation(err.msg, mode),
      value: err.value,
    }));

    return next(ApiErrors.validation('VALIDATION_FAILED', details));
  }

  next();
}

module.exports = validate;
