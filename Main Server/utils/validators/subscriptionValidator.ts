import { body, param, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

export const createSubscriptionValidation: ValidationChain[] = [
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

export const subscriptionIdValidation: ValidationChain[] = [
  param('subscription_id').isUUID().withMessage(V.SUBSCRIPTION_ID_MUST_BE_A_VALID_UUID),
];

export const rejectSubscriptionValidation: ValidationChain[] = [
  param('subscription_id').isUUID().withMessage(V.SUBSCRIPTION_ID_MUST_BE_A_VALID_UUID),
  body('reason')
    .trim()
    .notEmpty().withMessage(V.REJECTION_REASON_IS_REQUIRED)
    .isLength({ max: 500 }).withMessage(V.REJECTION_REASON_MUST_BE_AT_MOST_500_CHARACTERS),
];




const _exported = { createSubscriptionValidation, subscriptionIdValidation, rejectSubscriptionValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { createSubscriptionValidation, subscriptionIdValidation, rejectSubscriptionValidation };
  // @ts-ignore
  module.exports.createSubscriptionValidation = createSubscriptionValidation;
  // @ts-ignore
  module.exports.subscriptionIdValidation = subscriptionIdValidation;
  // @ts-ignore
  module.exports.rejectSubscriptionValidation = rejectSubscriptionValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
