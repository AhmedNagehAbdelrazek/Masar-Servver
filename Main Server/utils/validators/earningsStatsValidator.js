const { query } = require('express-validator');

const earningsQueryValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month']).withMessage('period must be day, week, or month'),
  query('from')
    .optional()
    .isISO8601().withMessage('from must be a valid ISO-8601 date'),
  query('to')
    .optional()
    .isISO8601().withMessage('to must be a valid ISO-8601 date'),
];

module.exports = { earningsQueryValidation };
