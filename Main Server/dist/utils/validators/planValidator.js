"use strict";
const { body, param } = require('express-validator');
const { PLAN_STATUS, PAYMENT_METHOD_TYPE, FREE_OFFER_TYPE } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');
function validateStatus(value) {
    if (value === undefined || value === null || value === '')
        return true;
    if (!Object.values(PLAN_STATUS).includes(value)) {
        throw new Error(`Status must be one of: ${Object.values(PLAN_STATUS).join(', ')} or null`);
    }
    return true;
}
function validateFreeOffer(value, { req }) {
    const isFree = req.body.is_free === true;
    if (isFree) {
        if (value === undefined || value === null || typeof value !== 'object') {
            throw new Error(V.FREE_OFFER_IS_REQUIRED_FOR_A_FREE_PLAN);
        }
        return validateFreeOfferShape(value);
    }
    if (value !== undefined && value !== null && typeof value === 'object') {
        return validateFreeOfferShape(value);
    }
    return true;
}
function validateFreeOfferShape(offer) {
    if (!Object.values(FREE_OFFER_TYPE).includes(offer.type)) {
        throw new Error(`free_offer.type must be one of: ${Object.values(FREE_OFFER_TYPE).join(', ')}`);
    }
    const v = Number(offer.value);
    if (!Number.isFinite(v) || v <= 0) {
        throw new Error(V.FREE_OFFER_VALUE_MUST_BE_A_POSITIVE_NUMBER);
    }
    return true;
}
function validateEmail(value) {
    if (value === undefined || value === null || value === '')
        return true;
    if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error(V.EMAIL_MUST_BE_VALID);
    }
    return true;
}
const createPlanValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage(V.PLAN_NAME_IS_REQUIRED)
        .isLength({ max: 100 }).withMessage(V.PLAN_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    body('period_days')
        .isInt({ min: 1 }).withMessage(V.PERIOD_DAYS_MUST_BE_A_POSITIVE_INTEGER),
    body('percentage_cut')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(V.PERCENTAGE_CUT_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const n = parseFloat(value);
        if (n < 0 || n > 100)
            throw new Error(V.PERCENTAGE_CUT_MUST_BE_BETWEEN_0_AND_100);
        return true;
    }),
    body('cost')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(V.COST_MUST_BE_A_DECIMAL)
        .custom((value) => {
        if (parseFloat(value) < 0)
            throw new Error(V.COST_CANNOT_BE_NEGATIVE);
        return true;
    }),
    body('status')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateStatus),
    body('features')
        .optional()
        .isArray().withMessage(V.FEATURES_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!arr.every((f) => typeof f === 'string' && f.trim().length <= 200)) {
            throw new Error(V.EACH_FEATURE_MUST_BE_A_STRING_OF_AT_MOST_200_CHARACTERS);
        }
        return true;
    })
        .customSanitizer((arr) => arr.map((f) => f.trim())),
    body('is_free')
        .optional()
        .isBoolean().withMessage(V.IS_FREE_MUST_BE_A_BOOLEAN)
        .toBoolean(),
    body('free_offer')
        .custom(validateFreeOffer)
        .customSanitizer((value, { req }) => {
        if (req.body.is_free !== true || !value || typeof value !== 'object')
            return value;
        const v = Number(value.value);
        return { ...value, value: v };
    }),
];
const updatePlanValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(V.PLAN_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    body('period_days')
        .optional()
        .isInt({ min: 1 }).withMessage(V.PERIOD_DAYS_MUST_BE_A_POSITIVE_INTEGER),
    body('percentage_cut')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(V.PERCENTAGE_CUT_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const n = parseFloat(value);
        if (n < 0 || n > 100)
            throw new Error(V.PERCENTAGE_CUT_MUST_BE_BETWEEN_0_AND_100);
        return true;
    }),
    body('cost')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(V.COST_MUST_BE_A_DECIMAL)
        .custom((value) => {
        if (parseFloat(value) < 0)
            throw new Error(V.COST_CANNOT_BE_NEGATIVE);
        return true;
    }),
    body('status')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateStatus),
    body('features')
        .optional()
        .isArray().withMessage(V.FEATURES_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!arr.every((f) => typeof f === 'string' && f.trim().length <= 200)) {
            throw new Error(V.EACH_FEATURE_MUST_BE_A_STRING_OF_AT_MOST_200_CHARACTERS);
        }
        return true;
    })
        .customSanitizer((arr) => arr.map((f) => f.trim())),
    body('is_free')
        .optional()
        .isBoolean().withMessage(V.IS_FREE_MUST_BE_A_BOOLEAN)
        .toBoolean(),
    body('free_offer')
        .optional({ nullable: true })
        .custom(validateFreeOffer),
];
const planIdValidation = [
    param('plan_id').isUUID().withMessage(V.PLAN_ID_MUST_BE_A_VALID_UUID),
];
const createPaymentMethodValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage(V.METHOD_NAME_IS_REQUIRED)
        .isLength({ max: 100 }).withMessage(V.METHOD_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    body('account_number')
        .trim()
        .notEmpty().withMessage(V.ACCOUNT_NUMBER_IS_REQUIRED_2)
        .isLength({ max: 50 }).withMessage(V.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS_2),
    body('type')
        .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(V.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY_2),
    body('email')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateEmail),
];
const updatePaymentMethodValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(V.METHOD_NAME_MUST_BE_AT_MOST_100_CHARACTERS),
    body('account_number')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage(V.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS_2),
    body('type')
        .optional()
        .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(V.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY_2),
    body('email')
        .optional({ nullable: true })
        .customSanitizer((value) => (value === '' ? null : value))
        .custom(validateEmail),
];
const paymentMethodIdValidation = [
    param('method_id').isUUID().withMessage(V.PAYMENT_METHOD_ID_MUST_BE_A_VALID_UUID),
];
module.exports = {
    createPlanValidation,
    updatePlanValidation,
    planIdValidation,
    createPaymentMethodValidation,
    updatePaymentMethodValidation,
    paymentMethodIdValidation,
};
//# sourceMappingURL=planValidator.js.map