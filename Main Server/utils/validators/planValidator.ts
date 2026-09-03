import { body, param, ValidationChain, Meta } from 'express-validator';
import { PLAN_STATUS, PAYMENT_METHOD_TYPE, FREE_OFFER_TYPE } from '../../config/constants';
import V from '../../config/messages/validation-keys';

function validateStatus(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (!(Object.values(PLAN_STATUS) as string[]).includes(value as string)) {
    throw new Error(`Status must be one of: ${Object.values(PLAN_STATUS).join(', ')} or null`);
  }
  return true;
}

function validateFreeOffer(value: unknown, { req }: Meta): boolean {
  const isFree = req.body.is_free === true;

  if (isFree) {
    if (value === undefined || value === null || typeof value !== 'object') {
      throw new Error(V.FREE_OFFER_IS_REQUIRED_FOR_A_FREE_PLAN);
    }
    return validateFreeOfferShape(value as Record<string, unknown>);
  }

  if (value !== undefined && value !== null && typeof value === 'object') {
    return validateFreeOfferShape(value as Record<string, unknown>);
  }

  return true;
}

function validateFreeOfferShape(offer: Record<string, unknown>): boolean {
  if (!(Object.values(FREE_OFFER_TYPE) as string[]).includes(offer.type as string)) {
    throw new Error(`free_offer.type must be one of: ${Object.values(FREE_OFFER_TYPE).join(', ')}`);
  }
  const v = Number(offer.value);
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error(V.FREE_OFFER_VALUE_MUST_BE_A_POSITIVE_NUMBER);
  }
  return true;
}

function validateEmail(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(V.EMAIL_MUST_BE_VALID);
  }
  return true;
}

export const createPlanValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage(V.PLAN_NAME_IS_REQUIRED)
    .isLength({ max: 100 }).withMessage(V.PLAN_NAME_MUST_BE_AT_MOST_100_CHARACTERS),

  body('period_days')
    .isInt({ min: 1 }).withMessage(V.PERIOD_DAYS_MUST_BE_A_POSITIVE_INTEGER),

  body('percentage_cut')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage(V.PERCENTAGE_CUT_MUST_BE_A_DECIMAL)
    .custom((value: unknown) => {
      const n = parseFloat(String(value));
      if (n < 0 || n > 100) throw new Error(V.PERCENTAGE_CUT_MUST_BE_BETWEEN_0_AND_100);
      return true;
    }),

  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage(V.COST_MUST_BE_A_DECIMAL)
    .custom((value: unknown) => {
      if (parseFloat(String(value)) < 0) throw new Error(V.COST_CANNOT_BE_NEGATIVE);
      return true;
    }),

  body('status')
    .optional({ nullable: true })
    .customSanitizer((value: unknown) => (value === '' ? null : value))
    .custom(validateStatus),

  body('features')
    .optional()
    .isArray().withMessage(V.FEATURES_MUST_BE_AN_ARRAY)
    .custom((arr: unknown) => {
      if (!Array.isArray(arr) || !(arr as unknown[]).every((f) => typeof f === 'string' && (f as string).trim().length <= 200)) {
        throw new Error(V.EACH_FEATURE_MUST_BE_A_STRING_OF_AT_MOST_200_CHARACTERS);
      }
      return true;
    })
    .customSanitizer((arr: unknown) => (arr as string[]).map((f) => f.trim())),

  body('is_free')
    .optional()
    .isBoolean().withMessage(V.IS_FREE_MUST_BE_A_BOOLEAN)
    .toBoolean(),

  body('free_offer')
    .custom(validateFreeOffer)
    .customSanitizer((value: unknown, { req }: Meta) => {
      if ((req as unknown as { body: Record<string, unknown> }).body.is_free !== true || !value || typeof value !== 'object') return value;
      const v = Number((value as Record<string, unknown>).value);
      return { ...value, value: v };
    }),
];

export const updatePlanValidation: ValidationChain[] = [
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
    .custom((value: unknown) => {
      const n = parseFloat(String(value));
      if (n < 0 || n > 100) throw new Error(V.PERCENTAGE_CUT_MUST_BE_BETWEEN_0_AND_100);
      return true;
    }),

  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage(V.COST_MUST_BE_A_DECIMAL)
    .custom((value: unknown) => {
      if (parseFloat(String(value)) < 0) throw new Error(V.COST_CANNOT_BE_NEGATIVE);
      return true;
    }),

  body('status')
    .optional({ nullable: true })
    .customSanitizer((value: unknown) => (value === '' ? null : value))
    .custom(validateStatus),

  body('features')
    .optional()
    .isArray().withMessage(V.FEATURES_MUST_BE_AN_ARRAY)
    .custom((arr: unknown) => {
      if (!Array.isArray(arr) || !(arr as unknown[]).every((f) => typeof f === 'string' && (f as string).trim().length <= 200)) {
        throw new Error(V.EACH_FEATURE_MUST_BE_A_STRING_OF_AT_MOST_200_CHARACTERS);
      }
      return true;
    })
    .customSanitizer((arr: unknown) => (arr as string[]).map((f) => f.trim())),

  body('is_free')
    .optional()
    .isBoolean().withMessage(V.IS_FREE_MUST_BE_A_BOOLEAN)
    .toBoolean(),

  body('free_offer')
    .optional({ nullable: true })
    .custom(validateFreeOffer),
];

export const planIdValidation: ValidationChain[] = [
  param('plan_id').isUUID().withMessage(V.PLAN_ID_MUST_BE_A_VALID_UUID),
];

export const createPaymentMethodValidation: ValidationChain[] = [
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
    .customSanitizer((value: unknown) => (value === '' ? null : value))
    .custom(validateEmail),
];

export const updatePaymentMethodValidation: ValidationChain[] = [
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
    .customSanitizer((value: unknown) => (value === '' ? null : value))
    .custom(validateEmail),
];

export const paymentMethodIdValidation: ValidationChain[] = [
  param('method_id').isUUID().withMessage(V.PAYMENT_METHOD_ID_MUST_BE_A_VALID_UUID),
];




const _exported = { createPlanValidation, updatePlanValidation, planIdValidation, createPaymentMethodValidation, updatePaymentMethodValidation, paymentMethodIdValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { createPlanValidation, updatePlanValidation, planIdValidation, createPaymentMethodValidation, updatePaymentMethodValidation, paymentMethodIdValidation };
  // @ts-ignore
  module.exports.createPlanValidation = createPlanValidation;
  // @ts-ignore
  module.exports.updatePlanValidation = updatePlanValidation;
  // @ts-ignore
  module.exports.planIdValidation = planIdValidation;
  // @ts-ignore
  module.exports.createPaymentMethodValidation = createPaymentMethodValidation;
  // @ts-ignore
  module.exports.updatePaymentMethodValidation = updatePaymentMethodValidation;
  // @ts-ignore
  module.exports.paymentMethodIdValidation = paymentMethodIdValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
