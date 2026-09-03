"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupedNotificationValidation = exports.updateNotificationSettingsValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
const VALID_TYPES = Object.values(constants_1.NOTIFICATION_TYPE);
exports.updateNotificationSettingsValidation = [
    (0, express_validator_1.body)('settings')
        .isArray({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.SETTINGS_MUST_BE_A_NON_EMPTY_ARRAY),
    (0, express_validator_1.body)('settings.*.type')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NOTIFICATION_TYPE_IS_REQUIRED)
        .isIn(VALID_TYPES).withMessage(validation_keys_1.VALIDATION_KEYS.NOTIFICATION_TYPE_MUST_BE_ONE_OF_BOOKING_CONFIRMED_BOOKING_CANCELLED_TRIP_REMINDER),
    (0, express_validator_1.body)('settings.*.enabled_in_app')
        .optional()
        .isBoolean().withMessage(validation_keys_1.VALIDATION_KEYS.ENABLED_IN_APP_MUST_BE_A_BOOLEAN),
    (0, express_validator_1.body)('settings.*.enabled_push')
        .optional()
        .isBoolean().withMessage(validation_keys_1.VALIDATION_KEYS.ENABLED_PUSH_MUST_BE_A_BOOLEAN),
];
// Grouped settings screen (spec 010): either a master switch overwrite or
// per-type channel toggles.
exports.updateGroupedNotificationValidation = [
    (0, express_validator_1.body)('master_switch')
        .optional()
        .isBoolean().withMessage(validation_keys_1.VALIDATION_KEYS.MASTER_SWITCH_MUST_BE_A_BOOLEAN)
        .custom((value, { req }) => {
        if (req.body.updates !== undefined) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.SEND_EITHER_MASTER_SWITCH_OR_UPDATES_NOT_BOTH);
        }
        return true;
    }),
    (0, express_validator_1.body)('updates')
        .optional()
        .isArray({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.UPDATES_MUST_BE_A_NON_EMPTY_ARRAY),
    (0, express_validator_1.body)('updates.*.type')
        .if((0, express_validator_1.body)('updates').exists())
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NOTIFICATION_TYPE_IS_REQUIRED)
        .isIn(VALID_TYPES).withMessage(validation_keys_1.VALIDATION_KEYS.NOTIFICATION_TYPE_MUST_BE_ONE_OF_BOOKING_CONFIRMED_BOOKING_CANCELLED_TRIP_REMINDER),
    (0, express_validator_1.body)('updates.*.channel')
        .if((0, express_validator_1.body)('updates').exists())
        .optional()
        .isIn(['in_app', 'push']).withMessage(validation_keys_1.VALIDATION_KEYS.CHANNEL_MUST_BE_IN_APP_OR_PUSH),
    (0, express_validator_1.body)('updates.*.enabled')
        .if((0, express_validator_1.body)('updates').exists())
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.ENABLED_IS_REQUIRED)
        .isBoolean({ strict: true }).withMessage(validation_keys_1.VALIDATION_KEYS.ENABLED_MUST_BE_A_BOOLEAN),
];
const _exported = { updateNotificationSettingsValidation: exports.updateNotificationSettingsValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { updateNotificationSettingsValidation: exports.updateNotificationSettingsValidation };
    // @ts-ignore
    module.exports.updateNotificationSettingsValidation = exports.updateNotificationSettingsValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=notificationValidator.js.map