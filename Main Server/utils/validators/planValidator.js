const { body, param } = require('express-validator');
const { PLAN_STATUS, PAYMENT_METHOD_TYPE, FREE_OFFER_TYPE } = require('../../config/constants');

function validateStatus(value) {
  if (value === undefined || value === null || value === '') return true;
  if (!Object.values(PLAN_STATUS).includes(value)) {
    throw new Error(`Status must be one of: ${Object.values(PLAN_STATUS).join(', ')} or null`);
  }
  return true;
}

function validateFreeOffer(value, { req }) {
  const isFree = req.body.is_free === true;

  if (isFree) {
    if (value === undefined || value === null || typeof value !== 'object') {
      throw new Error('free_offer is required for a free plan');
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
    throw new Error('free_offer.value must be a positive number');
  }
  return true;
}

function validateEmail(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error('Email must be valid');
  }
  return true;
}

const createPlanValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Plan name is required')
    .isLength({ max: 100 }).withMessage('Plan name must be at most 100 characters'),

  body('period_days')
    .isInt({ min: 1 }).withMessage('Period days must be a positive integer'),

  body('percentage_cut')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage('Percentage cut must be a decimal')
    .custom((value) => {
      const n = parseFloat(value);
      if (n < 0 || n > 100) throw new Error('Percentage cut must be between 0 and 100');
      return true;
    }),

  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage('Cost must be a decimal')
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error('Cost cannot be negative');
      return true;
    }),

  body('status')
    .optional({ nullable: true })
    .customSanitizer((value) => (value === '' ? null : value))
    .custom(validateStatus),

  body('features')
    .optional()
    .isArray().withMessage('Features must be an array')
    .custom((arr) => {
      if (!arr.every((f) => typeof f === 'string' && f.trim().length <= 200)) {
        throw new Error('Each feature must be a string of at most 200 characters');
      }
      return true;
    })
    .customSanitizer((arr) => arr.map((f) => f.trim())),

  body('is_free')
    .optional()
    .isBoolean().withMessage('is_free must be a boolean')
    .toBoolean(),

  body('free_offer')
    .custom(validateFreeOffer)
    .customSanitizer((value, { req }) => {
      if (req.body.is_free !== true || !value || typeof value !== 'object') return value;
      const v = Number(value.value);
      return { ...value, value: v };
    }),
];

const updatePlanValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Plan name must be at most 100 characters'),

  body('period_days')
    .optional()
    .isInt({ min: 1 }).withMessage('Period days must be a positive integer'),

  body('percentage_cut')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage('Percentage cut must be a decimal')
    .custom((value) => {
      const n = parseFloat(value);
      if (n < 0 || n > 100) throw new Error('Percentage cut must be between 0 and 100');
      return true;
    }),

  body('cost')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage('Cost must be a decimal')
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error('Cost cannot be negative');
      return true;
    }),

  body('status')
    .optional({ nullable: true })
    .customSanitizer((value) => (value === '' ? null : value))
    .custom(validateStatus),

  body('features')
    .optional()
    .isArray().withMessage('Features must be an array')
    .custom((arr) => {
      if (!arr.every((f) => typeof f === 'string' && f.trim().length <= 200)) {
        throw new Error('Each feature must be a string of at most 200 characters');
      }
      return true;
    })
    .customSanitizer((arr) => arr.map((f) => f.trim())),

  body('is_free')
    .optional()
    .isBoolean().withMessage('is_free must be a boolean')
    .toBoolean(),

  body('free_offer')
    .optional({ nullable: true })
    .custom(validateFreeOffer),
];

const planIdValidation = [
  param('plan_id').isUUID().withMessage('Plan ID must be a valid UUID'),
];

const createPaymentMethodValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Method name is required')
    .isLength({ max: 100 }).withMessage('Method name must be at most 100 characters'),

  body('account_number')
    .trim()
    .notEmpty().withMessage('Account number is required')
    .isLength({ max: 50 }).withMessage('Account number must be at most 50 characters'),

  body('type')
    .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(`Type must be one of: ${Object.values(PAYMENT_METHOD_TYPE).join(', ')}`),

  body('email')
    .optional({ nullable: true })
    .customSanitizer((value) => (value === '' ? null : value))
    .custom(validateEmail),
];

const updatePaymentMethodValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Method name must be at most 100 characters'),

  body('account_number')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Account number must be at most 50 characters'),

  body('type')
    .optional()
    .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(`Type must be one of: ${Object.values(PAYMENT_METHOD_TYPE).join(', ')}`),

  body('email')
    .optional({ nullable: true })
    .customSanitizer((value) => (value === '' ? null : value))
    .custom(validateEmail),
];

const paymentMethodIdValidation = [
  param('method_id').isUUID().withMessage('Payment method ID must be a valid UUID'),
];

module.exports = {
  createPlanValidation,
  updatePlanValidation,
  planIdValidation,
  createPaymentMethodValidation,
  updatePaymentMethodValidation,
  paymentMethodIdValidation,
};
