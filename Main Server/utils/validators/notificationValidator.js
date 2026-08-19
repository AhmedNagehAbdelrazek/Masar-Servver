const { body } = require('express-validator');
const { NOTIFICATION_TYPE } = require('../../config/constants');

const VALID_TYPES = Object.values(NOTIFICATION_TYPE);

const updateNotificationSettingsValidation = [
  body('settings')
    .isArray({ min: 1 }).withMessage('Settings must be a non-empty array'),
  body('settings.*.type')
    .notEmpty().withMessage('Notification type is required')
    .isIn(VALID_TYPES).withMessage(`Notification type must be one of: ${VALID_TYPES.join(', ')}`),
  body('settings.*.enabled_in_app')
    .optional()
    .isBoolean().withMessage('enabled_in_app must be a boolean'),
  body('settings.*.enabled_push')
    .optional()
    .isBoolean().withMessage('enabled_push must be a boolean'),
];

module.exports = { updateNotificationSettingsValidation };
