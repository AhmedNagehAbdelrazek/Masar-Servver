const { body, query } = require('express-validator');
const { PENALTY_TYPES } = require('../../config/constants');

const penaltyListValidation = [
  query('active')
    .optional()
    .isIn(['true', 'false']).withMessage('active must be true or false'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const penaltyValidation = [
  body('user_id')
    .isUUID().withMessage('User ID must be a valid UUID'),
  body('type')
    .notEmpty().withMessage('Penalty type is required')
    .isIn(Object.values(PENALTY_TYPES)).withMessage(`Type must be one of: ${Object.values(PENALTY_TYPES).join(', ')}`),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isLength({ max: 2000 }).withMessage('Reason must be at most 2000 characters'),
  body('complaint_id')
    .optional()
    .isUUID().withMessage('Complaint ID must be a valid UUID'),
  body('details')
    .optional()
    .isString().trim().isLength({ max: 4000 }).withMessage('details must be at most 4000 characters'),
  body('ends_at')
    .optional()
    .isISO8601().withMessage('ends_at must be a valid ISO-8601 datetime')
    .custom((value, { req }) => {
      const type = req.body.type;
      if (type === PENALTY_TYPES.SUSPENSION && !value) {
        throw new Error('ends_at is required for a suspension');
      }
      if (type === PENALTY_TYPES.BAN && value) {
        throw new Error('ends_at is forbidden for a ban (permanent)');
      }
      if (value && new Date(value) <= new Date()) {
        throw new Error('ends_at must be in the future');
      }
      return true;
    }),
];

module.exports = {
  penaltyListValidation,
  penaltyValidation,
};
