"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSubscriptionValidation = exports.subscriptionIdValidation = exports.createSubscriptionValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.createSubscriptionValidation = [
    (0, express_validator_1.body)('plan_id')
        .isUUID().withMessage(validation_keys_1.default.PLAN_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('payment_method_id')
        .isUUID().withMessage(validation_keys_1.default.PAYMENT_METHOD_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('screenshot_id')
        .notEmpty().withMessage(validation_keys_1.default.SCREENSHOT_ID_IS_REQUIRED)
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.SCREENSHOT_ID_MUST_BE_A_VALID_UPLOADED_IMAGE_ID)
        .toInt(),
    (0, express_validator_1.body)('resubmit')
        .optional()
        .isBoolean().withMessage(validation_keys_1.default.RESUBMIT_MUST_BE_A_BOOLEAN)
        .toBoolean(),
];
exports.subscriptionIdValidation = [
    (0, express_validator_1.param)('subscription_id').isUUID().withMessage(validation_keys_1.default.SUBSCRIPTION_ID_MUST_BE_A_VALID_UUID),
];
exports.rejectSubscriptionValidation = [
    (0, express_validator_1.param)('subscription_id').isUUID().withMessage(validation_keys_1.default.SUBSCRIPTION_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('reason')
        .trim()
        .notEmpty().withMessage(validation_keys_1.default.REJECTION_REASON_IS_REQUIRED)
        .isLength({ max: 500 }).withMessage(validation_keys_1.default.REJECTION_REASON_MUST_BE_AT_MOST_500_CHARACTERS),
];
const _exported = { createSubscriptionValidation: exports.createSubscriptionValidation, subscriptionIdValidation: exports.subscriptionIdValidation, rejectSubscriptionValidation: exports.rejectSubscriptionValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { createSubscriptionValidation: exports.createSubscriptionValidation, subscriptionIdValidation: exports.subscriptionIdValidation, rejectSubscriptionValidation: exports.rejectSubscriptionValidation };
    // @ts-ignore
    module.exports.createSubscriptionValidation = exports.createSubscriptionValidation;
    // @ts-ignore
    module.exports.subscriptionIdValidation = exports.subscriptionIdValidation;
    // @ts-ignore
    module.exports.rejectSubscriptionValidation = exports.rejectSubscriptionValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=subscriptionValidator.js.map