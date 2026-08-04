const { param, query, body } = require('express-validator');
const { SOS_STATUS } = require('../../config/constants');

const sosListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(SOS_STATUS)).withMessage(`status must be one of: ${Object.values(SOS_STATUS).join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const sosIdParamValidation = [
  param('id')
    .isUUID().withMessage('SOS event ID must be a valid UUID'),
];

const resolveSosValidation = [
  param('id')
    .isUUID().withMessage('SOS event ID must be a valid UUID'),
  body('resolution_note')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage('resolution_note must be at most 500 characters'),
];

module.exports = { sosListValidation, sosIdParamValidation, resolveSosValidation };
