const { query, param } = require('express-validator');

const notificationListValidation = [
  query('unread')
    .optional()
    .isIn(['true', 'false']).withMessage('unread must be true or false'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const notificationParamValidation = [
  param('notification_id')
    .isUUID().withMessage('Notification ID must be a valid UUID'),
];

module.exports = {
  notificationListValidation,
  notificationParamValidation,
};
