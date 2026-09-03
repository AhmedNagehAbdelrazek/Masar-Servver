"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMethodValidation = exports.createMethodValidation = exports.methodParamValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
exports.methodParamValidation = [
    (0, express_validator_1.param)('method_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.METHOD_ID_MUST_BE_A_VALID_UUID),
];
exports.createMethodValidation = [
    (0, express_validator_1.body)('name')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NAME_IS_REQUIRED)
        .isString().trim().isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('account_number')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.ACCOUNT_NUMBER_IS_REQUIRED)
        .isString().trim().isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS),
    (0, express_validator_1.body)('type')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.TYPE_IS_REQUIRED)
        .isIn(Object.values(constants_1.PAYMENT_METHOD_TYPE)).withMessage(validation_keys_1.VALIDATION_KEYS.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail().withMessage(validation_keys_1.VALIDATION_KEYS.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS),
];
exports.updateMethodValidation = [
    ...exports.methodParamValidation,
    (0, express_validator_1.body)('name')
        .optional()
        .isString().trim().isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('account_number')
        .optional()
        .isString().trim().isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(Object.values(constants_1.PAYMENT_METHOD_TYPE)).withMessage(validation_keys_1.VALIDATION_KEYS.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail().withMessage(validation_keys_1.VALIDATION_KEYS.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS),
];
const _exported = { methodParamValidation: exports.methodParamValidation, createMethodValidation: exports.createMethodValidation, updateMethodValidation: exports.updateMethodValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { methodParamValidation: exports.methodParamValidation, createMethodValidation: exports.createMethodValidation, updateMethodValidation: exports.updateMethodValidation };
    // @ts-ignore
    module.exports.methodParamValidation = exports.methodParamValidation;
    // @ts-ignore
    module.exports.createMethodValidation = exports.createMethodValidation;
    // @ts-ignore
    module.exports.updateMethodValidation = exports.updateMethodValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=paymentMethodValidator.js.map