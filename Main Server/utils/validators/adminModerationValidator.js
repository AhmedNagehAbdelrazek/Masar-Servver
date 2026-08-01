const { body, query, param } = require('express-validator');
const { ROLES, USER_STATUS } = require('../../config/constants');

const adminUserListValidation = [
  query('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  query('status')
    .optional()
    .isIn(Object.values(USER_STATUS)).withMessage(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const updateUserStatusValidation = [
  param('user_id').isUUID().withMessage('User ID must be a valid UUID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(USER_STATUS)).withMessage(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 500 }).withMessage('Reason must be a string ≤ 500 characters'),
];

const moderateTripValidation = [
  param('trip_id').isUUID().withMessage('Trip ID must be a valid UUID'),
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['unpublish', 'block', 'restore']).withMessage('Action must be one of: unpublish, block, restore'),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 500 }).withMessage('Reason must be a string ≤ 500 characters'),
];

module.exports = {
  adminUserListValidation,
  updateUserStatusValidation,
  moderateTripValidation,
};
