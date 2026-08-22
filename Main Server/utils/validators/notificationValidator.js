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

// Grouped settings screen (spec 010): either a master switch overwrite or
// per-type channel toggles.
const updateGroupedNotificationValidation = [
  body('master_switch')
    .optional()
    .isBoolean().withMessage('master_switch must be a boolean')
    .custom((value, { req }) => {
      if (req.body.updates !== undefined) {
        throw new Error('Send either master_switch or updates, not both');
      }
      return true;
    }),
  body('updates')
    .optional()
    .isArray({ min: 1 }).withMessage('Updates must be a non-empty array'),
  body('updates.*.type')
    .if(body('updates').exists())
    .notEmpty().withMessage('Notification type is required')
    .isIn(VALID_TYPES).withMessage(`Notification type must be one of: ${VALID_TYPES.join(', ')}`),
  body('updates.*.channel')
    .if(body('updates').exists())
    .optional()
    .isIn(['in_app', 'push']).withMessage('Channel must be in_app or push'),
  body('updates.*.enabled')
    .if(body('updates').exists())
    .notEmpty().withMessage('Enabled is required')
    .isBoolean({ strict: true }).withMessage('Enabled must be a boolean'),
];

module.exports.updateGroupedNotificationValidation = updateGroupedNotificationValidation;
