"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupedNotificationValidation = exports.updateNotificationSettingsValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
const VALID_TYPES = Object.values(constants_1.NOTIFICATION_TYPE);
exports.updateNotificationSettingsValidation = [
    (0, express_validator_1.body)('settings')
        .isArray({ min: 1 }).withMessage(validation_keys_1.default.SETTINGS_MUST_BE_A_NON_EMPTY_ARRAY),
    (0, express_validator_1.body)('settings.*.type')
        .notEmpty().withMessage(validation_keys_1.default.NOTIFICATION_TYPE_IS_REQUIRED)
        .isIn(VALID_TYPES).withMessage(validation_keys_1.default.NOTIFICATION_TYPE_MUST_BE_ONE_OF_BOOKING_CONFIRMED_BOOKING_CANCELLED_TRIP_REMINDER),
    (0, express_validator_1.body)('settings.*.enabled_in_app')
        .optional()
        .isBoolean().withMessage(validation_keys_1.default.ENABLED_IN_APP_MUST_BE_A_BOOLEAN),
    (0, express_validator_1.body)('settings.*.enabled_push')
        .optional()
        .isBoolean().withMessage(validation_keys_1.default.ENABLED_PUSH_MUST_BE_A_BOOLEAN),
];
// Grouped settings screen (spec 010): either a master switch overwrite or
// per-type channel toggles.
exports.updateGroupedNotificationValidation = [
    (0, express_validator_1.body)('master_switch')
        .optional()
        .isBoolean().withMessage(validation_keys_1.default.MASTER_SWITCH_MUST_BE_A_BOOLEAN)
        .custom((value, { req }) => {
        if (req.body.updates !== undefined) {
            throw new Error(validation_keys_1.default.SEND_EITHER_MASTER_SWITCH_OR_UPDATES_NOT_BOTH);
        }
        return true;
    }),
    (0, express_validator_1.body)('updates')
        .optional()
        .isArray({ min: 1 }).withMessage(validation_keys_1.default.UPDATES_MUST_BE_A_NON_EMPTY_ARRAY),
    (0, express_validator_1.body)('updates.*.type')
        .if((0, express_validator_1.body)('updates').exists())
        .notEmpty().withMessage(validation_keys_1.default.NOTIFICATION_TYPE_IS_REQUIRED)
        .isIn(VALID_TYPES).withMessage(validation_keys_1.default.NOTIFICATION_TYPE_MUST_BE_ONE_OF_BOOKING_CONFIRMED_BOOKING_CANCELLED_TRIP_REMINDER),
    (0, express_validator_1.body)('updates.*.channel')
        .if((0, express_validator_1.body)('updates').exists())
        .optional()
        .isIn(['in_app', 'push']).withMessage(validation_keys_1.default.CHANNEL_MUST_BE_IN_APP_OR_PUSH),
    (0, express_validator_1.body)('updates.*.enabled')
        .if((0, express_validator_1.body)('updates').exists())
        .notEmpty().withMessage(validation_keys_1.default.ENABLED_IS_REQUIRED)
        .isBoolean({ strict: true }).withMessage(validation_keys_1.default.ENABLED_MUST_BE_A_BOOLEAN),
];
const _exported = { updateNotificationSettingsValidation: exports.updateNotificationSettingsValidation, updateGroupedNotificationValidation: exports.updateGroupedNotificationValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { updateNotificationSettingsValidation: exports.updateNotificationSettingsValidation, updateGroupedNotificationValidation: exports.updateGroupedNotificationValidation };
    // @ts-ignore
    module.exports.updateNotificationSettingsValidation = exports.updateNotificationSettingsValidation;
    // @ts-ignore
    module.exports.updateGroupedNotificationValidation = exports.updateGroupedNotificationValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=notificationValidator.js.map