const { body, param } = require('express-validator');

const createSubscriptionValidation = [
  body('plan_id')
    .isUUID().withMessage('Plan ID must be a valid UUID'),

  body('payment_method_id')
    .isUUID().withMessage('Payment method ID must be a valid UUID'),

  body('screenshot_id')
    .notEmpty().withMessage('Screenshot ID is required')
    .isInt({ min: 1 }).withMessage('Screenshot ID must be a valid uploaded image ID')
    .toInt(),

  body('resubmit')
    .optional()
    .isBoolean().withMessage('resubmit must be a boolean')
    .toBoolean(),
];

const subscriptionIdValidation = [
  param('subscription_id').isUUID().withMessage('Subscription ID must be a valid UUID'),
];

const rejectSubscriptionValidation = [
  param('subscription_id').isUUID().withMessage('Subscription ID must be a valid UUID'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 500 }).withMessage('Rejection reason must be at most 500 characters'),
];

module.exports = {
  createSubscriptionValidation,
  subscriptionIdValidation,
  rejectSubscriptionValidation,
};
