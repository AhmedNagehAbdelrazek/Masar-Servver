"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateTripValidation = exports.updateUserStatusValidation = exports.adminUserListValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.adminUserListValidation = [
    (0, express_validator_1.query)('role')
        .optional()
        .isIn(Object.values(constants_1.ROLES)).withMessage(validation_keys_1.default.ROLE_MUST_BE_ONE_OF_PASSENGER_DRIVER_ADMIN_SUPPORT_MODERATOR),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.USER_STATUS)).withMessage(validation_keys_1.default.STATUS_MUST_BE_ONE_OF_ACTIVE_WARNED_SUSPENDED_BANNED),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.updateUserStatusValidation = [
    (0, express_validator_1.param)('user_id').isUUID().withMessage(validation_keys_1.default.USER_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('status')
        .notEmpty().withMessage(validation_keys_1.default.STATUS_IS_REQUIRED)
        .isIn(Object.values(constants_1.USER_STATUS)).withMessage(validation_keys_1.default.STATUS_MUST_BE_ONE_OF_ACTIVE_WARNED_SUSPENDED_BANNED),
    (0, express_validator_1.body)('reason')
        .optional()
        .isString().trim().isLength({ max: 500 }).withMessage(validation_keys_1.default.REASON_MUST_BE_A_STRING_500_CHARACTERS),
];
exports.moderateTripValidation = [
    (0, express_validator_1.param)('trip_id').isUUID().withMessage(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('action')
        .notEmpty().withMessage(validation_keys_1.default.ACTION_IS_REQUIRED)
        .isIn(['unpublish', 'block', 'restore']).withMessage(validation_keys_1.default.ACTION_MUST_BE_ONE_OF_UNPUBLISH_BLOCK_RESTORE),
    (0, express_validator_1.body)('reason')
        .optional()
        .isString().trim().isLength({ max: 500 }).withMessage(validation_keys_1.default.REASON_MUST_BE_A_STRING_500_CHARACTERS),
];
const _exported = { adminUserListValidation: exports.adminUserListValidation, updateUserStatusValidation: exports.updateUserStatusValidation, moderateTripValidation: exports.moderateTripValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { adminUserListValidation: exports.adminUserListValidation, updateUserStatusValidation: exports.updateUserStatusValidation, moderateTripValidation: exports.moderateTripValidation };
    // @ts-ignore
    module.exports.adminUserListValidation = exports.adminUserListValidation;
    // @ts-ignore
    module.exports.updateUserStatusValidation = exports.updateUserStatusValidation;
    // @ts-ignore
    module.exports.moderateTripValidation = exports.moderateTripValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=adminModerationValidator.js.map