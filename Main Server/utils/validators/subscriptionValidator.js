const { body, param } = require('express-validator');

const createSubscriptionValidation = [
  body('plan_id')
    .isUUID().withMessage('Plan ID must be a valid UUID'),

  body('payment_method_id')
    .isUUID().withMessage('Payment method ID must be a valid UUID'),

  body('screenshot_url')
    .trim()
    .notEmpty().withMessage('Screenshot URL is required')
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('Screenshot URL must be a valid http(s) URL'),

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
