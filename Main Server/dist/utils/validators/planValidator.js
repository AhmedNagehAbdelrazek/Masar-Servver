"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodIdValidation = exports.updatePaymentMethodValidation = exports.createPaymentMethodValidation = exports.planIdValidation = exports.updatePlanValidation = exports.createPlanValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
function validateStatus(value) {
    if (value === undefined || value === null || value === '')
        return true;
    if (!Object.values(constants_1.PLAN_STATUS).includes(value)) {
        throw new Error(`Status must be one of: ${Object.values(constants_1.PLAN_STATUS).join(', ')} or null`);
    }
    return true;
}
function validateFreeOffer(value, { req }) {
    const isFree = req.body.is_free === true;
    if (isFree) {
        if (value === undefined || value === null || typeof value !== 'object') {
            throw new Error(validation_keys_1.VALIDATION_KEYS.FREE_OFFER_IS_REQUIRED_FOR_A_FREE_PLAN);
        }
        return validateFreeOfferShape(value);
    }
    if (value !== undefined && value !== null && typeof value === 'object') {
        return validateFreeOfferShape(value);
    }
    return true;
}
function validateFreeOfferShape(offer) {
    if (!Object.values(constants_1.FREE_OFFER_TYPE).includes(offer.type)) {
        throw new Error(`free_offer.type must be one of: ${Object.values(constants_1.FREE_OFFER_TYPE).join(', ')}`);
    }
    const v = Number(offer.value);
    if (!Number.isFinite(v) || v <= 0) {
        throw new Error(validation_keys_1.VALIDATION_KEYS.FREE_OFFER_VALUE_MUST_BE_A_POSITIVE_NUMBER);
    }
    return true;
}
function validateEmail(value) {
    if (value === undefined || value === null || value === '')
        return true;
    if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error(validation_keys_1.VALIDATION_KEYS.EMAIL_MUST_BE_VALID);
    }
    return true;
}
exports.createPlanValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PLAN_NAME_IS_REQUIRED)
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.PLAN_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('period_days')
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PERIOD_DAYS_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.body)('percentage_cut')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(validation_keys_1.VALIDATION_KEYS.PERCENTAGE_CUT_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const n = parseFloat(String(value));
        if (n < 0 || n > 100)
            throw new Error(validation_keys_1.VALIDATION_KEYS.PERCENTAGE_CUT_MUST_BE_BETWEEN_0_AND_100);
        return true;
    }),
    (0, express_validator_1.body)('cost')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(validation_keys_1.VALIDATION_KEYS.COST_MUST_BE_A_DECIMAL)
        .custom((value) => {
        if (parseFloat(String(value)) < 0)
            throw new Error(validation_keys_1.VALIDATION_KEYS.COST_CANNOT_BE_NEGATIVE);
        return true;
    }),
    (0, express_validator_1.body)('status')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateStatus),
    (0, express_validator_1.body)('features')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.FEATURES_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!Array.isArray(arr) || !arr.every((f) => typeof f === 'string' && f.trim().length <= 200)) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.EACH_FEATURE_MUST_BE_A_STRING_OF_AT_MOST_200_CHARACTERS);
        }
        return true;
    })
        .customSanitizer((arr) => arr.map((f) => f.trim())),
    (0, express_validator_1.body)('is_free')
        .optional()
        .isBoolean().withMessage(validation_keys_1.VALIDATION_KEYS.IS_FREE_MUST_BE_A_BOOLEAN)
        .toBoolean(),
    (0, express_validator_1.body)('free_offer')
        .custom(validateFreeOffer)
        .customSanitizer((value, { req }) => {
        if (req.body.is_free !== true || !value || typeof value !== 'object')
            return value;
        const v = Number(value.value);
        return { ...value, value: v };
    }),
];
exports.updatePlanValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.PLAN_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('period_days')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PERIOD_DAYS_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.body)('percentage_cut')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(validation_keys_1.VALIDATION_KEYS.PERCENTAGE_CUT_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const n = parseFloat(String(value));
        if (n < 0 || n > 100)
            throw new Error(validation_keys_1.VALIDATION_KEYS.PERCENTAGE_CUT_MUST_BE_BETWEEN_0_AND_100);
        return true;
    }),
    (0, express_validator_1.body)('cost')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(validation_keys_1.VALIDATION_KEYS.COST_MUST_BE_A_DECIMAL)
        .custom((value) => {
        if (parseFloat(String(value)) < 0)
            throw new Error(validation_keys_1.VALIDATION_KEYS.COST_CANNOT_BE_NEGATIVE);
        return true;
    }),
    (0, express_validator_1.body)('status')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateStatus),
    (0, express_validator_1.body)('features')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.FEATURES_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!Array.isArray(arr) || !arr.every((f) => typeof f === 'string' && f.trim().length <= 200)) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.EACH_FEATURE_MUST_BE_A_STRING_OF_AT_MOST_200_CHARACTERS);
        }
        return true;
    })
        .customSanitizer((arr) => arr.map((f) => f.trim())),
    (0, express_validator_1.body)('is_free')
        .optional()
        .isBoolean().withMessage(validation_keys_1.VALIDATION_KEYS.IS_FREE_MUST_BE_A_BOOLEAN)
        .toBoolean(),
    (0, express_validator_1.body)('free_offer')
        .optional({ nullable: true })
        .custom(validateFreeOffer),
];
exports.planIdValidation = [
    (0, express_validator_1.param)('plan_id').isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.PLAN_ID_MUST_BE_A_VALID_UUID),
];
exports.createPaymentMethodValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.METHOD_NAME_IS_REQUIRED)
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.METHOD_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('account_number')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.ACCOUNT_NUMBER_IS_REQUIRED_2)
        .isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS_2),
    (0, express_validator_1.body)('type')
        .isIn(Object.values(constants_1.PAYMENT_METHOD_TYPE)).withMessage(validation_keys_1.VALIDATION_KEYS.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY_2),
    (0, express_validator_1.body)('email')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateEmail),
];
exports.updatePaymentMethodValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.METHOD_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('account_number')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS_2),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(Object.values(constants_1.PAYMENT_METHOD_TYPE)).withMessage(validation_keys_1.VALIDATION_KEYS.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY_2),
    (0, express_validator_1.body)('email')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateEmail),
];
exports.paymentMethodIdValidation = [
    (0, express_validator_1.param)('method_id').isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.PAYMENT_METHOD_ID_MUST_BE_A_VALID_UUID),
];
const _exported = { createPlanValidation: exports.createPlanValidation, updatePlanValidation: exports.updatePlanValidation, planIdValidation: exports.planIdValidation, createPaymentMethodValidation: exports.createPaymentMethodValidation, updatePaymentMethodValidation: exports.updatePaymentMethodValidation, paymentMethodIdValidation: exports.paymentMethodIdValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { createPlanValidation: exports.createPlanValidation, updatePlanValidation: exports.updatePlanValidation, planIdValidation: exports.planIdValidation, createPaymentMethodValidation: exports.createPaymentMethodValidation, updatePaymentMethodValidation: exports.updatePaymentMethodValidation, paymentMethodIdValidation: exports.paymentMethodIdValidation };
    // @ts-ignore
    module.exports.createPlanValidation = exports.createPlanValidation;
    // @ts-ignore
    module.exports.updatePlanValidation = exports.updatePlanValidation;
    // @ts-ignore
    module.exports.planIdValidation = exports.planIdValidation;
    // @ts-ignore
    module.exports.createPaymentMethodValidation = exports.createPaymentMethodValidation;
    // @ts-ignore
    module.exports.updatePaymentMethodValidation = exports.updatePaymentMethodValidation;
    // @ts-ignore
    module.exports.paymentMethodIdValidation = exports.paymentMethodIdValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=planValidator.js.map