const { query } = require('express-validator');
const V = require('../../config/messages/validation-keys');

const earningsQueryValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month']).withMessage(V.PERIOD_MUST_BE_DAY_WEEK_OR_MONTH),
  query('from')
    .optional()
    .isISO8601().withMessage(V.FROM_MUST_BE_A_VALID_ISO_8601_DATE),
  query('to')
    .optional()
    .isISO8601().withMessage(V.TO_MUST_BE_A_VALID_ISO_8601_DATE),
];

module.exports = { earningsQueryValidation };
