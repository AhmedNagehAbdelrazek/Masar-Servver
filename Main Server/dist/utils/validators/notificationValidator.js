"use strict";
const { body } = require('express-validator');
const { NOTIFICATION_TYPE } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');
const VALID_TYPES = Object.values(NOTIFICATION_TYPE);
const updateNotificationSettingsValidation = [
    body('settings')
        .isArray({ min: 1 }).withMessage(V.SETTINGS_MUST_BE_A_NON_EMPTY_ARRAY),
    body('settings.*.type')
        .notEmpty().withMessage(V.NOTIFICATION_TYPE_IS_REQUIRED)
        .isIn(VALID_TYPES).withMessage(V.NOTIFICATION_TYPE_MUST_BE_ONE_OF_BOOKING_CONFIRMED_BOOKING_CANCELLED_TRIP_REMINDER),
    body('settings.*.enabled_in_app')
        .optional()
        .isBoolean().withMessage(V.ENABLED_IN_APP_MUST_BE_A_BOOLEAN),
    body('settings.*.enabled_push')
        .optional()
        .isBoolean().withMessage(V.ENABLED_PUSH_MUST_BE_A_BOOLEAN),
];
module.exports = { updateNotificationSettingsValidation };
// Grouped settings screen (spec 010): either a master switch overwrite or
// per-type channel toggles.
const updateGroupedNotificationValidation = [
    body('master_switch')
        .optional()
        .isBoolean().withMessage(V.MASTER_SWITCH_MUST_BE_A_BOOLEAN)
        .custom((value, { req }) => {
        if (req.body.updates !== undefined) {
            throw new Error(V.SEND_EITHER_MASTER_SWITCH_OR_UPDATES_NOT_BOTH);
        }
        return true;
    }),
    body('updates')
        .optional()
        .isArray({ min: 1 }).withMessage(V.UPDATES_MUST_BE_A_NON_EMPTY_ARRAY),
    body('updates.*.type')
        .if(body('updates').exists())
        .notEmpty().withMessage(V.NOTIFICATION_TYPE_IS_REQUIRED)
        .isIn(VALID_TYPES).withMessage(V.NOTIFICATION_TYPE_MUST_BE_ONE_OF_BOOKING_CONFIRMED_BOOKING_CANCELLED_TRIP_REMINDER),
    body('updates.*.channel')
        .if(body('updates').exists())
        .optional()
        .isIn(['in_app', 'push']).withMessage(V.CHANNEL_MUST_BE_IN_APP_OR_PUSH),
    body('updates.*.enabled')
        .if(body('updates').exists())
        .notEmpty().withMessage(V.ENABLED_IS_REQUIRED)
        .isBoolean({ strict: true }).withMessage(V.ENABLED_MUST_BE_A_BOOLEAN),
];
module.exports.updateGroupedNotificationValidation = updateGroupedNotificationValidation;
//# sourceMappingURL=notificationValidator.js.map