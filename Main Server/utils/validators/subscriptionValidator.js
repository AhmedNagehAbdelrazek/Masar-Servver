const { body, param } = require('express-validator');
const V = require('../../config/messages/validation-keys');

const createSubscriptionValidation = [
  body('plan_id')
    .isUUID().withMessage(V.PLAN_ID_MUST_BE_A_VALID_UUID),

  body('payment_method_id')
    .isUUID().withMessage(V.PAYMENT_METHOD_ID_MUST_BE_A_VALID_UUID),

  body('screenshot_id')
    .notEmpty().withMessage(V.SCREENSHOT_ID_IS_REQUIRED)
    .isInt({ min: 1 }).withMessage(V.SCREENSHOT_ID_MUST_BE_A_VALID_UPLOADED_IMAGE_ID)
    .toInt(),

  body('resubmit')
    .optional()
    .isBoolean().withMessage(V.RESUBMIT_MUST_BE_A_BOOLEAN)
    .toBoolean(),
];

const subscriptionIdValidation = [
  param('subscription_id').isUUID().withMessage(V.SUBSCRIPTION_ID_MUST_BE_A_VALID_UUID),
];

const rejectSubscriptionValidation = [
  param('subscription_id').isUUID().withMessage(V.SUBSCRIPTION_ID_MUST_BE_A_VALID_UUID),
  body('reason')
    .trim()
    .notEmpty().withMessage(V.REJECTION_REASON_IS_REQUIRED)
    .isLength({ max: 500 }).withMessage(V.REJECTION_REASON_MUST_BE_AT_MOST_500_CHARACTERS),
];

module.exports = {
  createSubscriptionValidation,
  subscriptionIdValidation,
  rejectSubscriptionValidation,
};
