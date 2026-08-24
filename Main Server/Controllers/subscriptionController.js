const subscriptionService = require('../Services/subscriptionService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const createSubscription = catchAsync(async (req, res) => {
  const sub = await subscriptionService.createSubscription(req.user.id, req.body);
  markResource(res, { type: 'driver_subscription', id: sub.id });
  successResponse(
    res,
    {
      subscription_id: sub.id,
      status: sub.status,
      message: 'Your subscription is pending admin approval.',
    },
    201
  );
});

const getMySubscriptions = catchAsync(async (req, res) => {
  const subscriptions = await subscriptionService.getMySubscriptions(req.user.id);
  successResponse(res, { subscriptions });
});

const getCurrentSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.getCurrentSubscription(req.user.id);
  successResponse(res, result);
});

module.exports = {
  createSubscription,
  getMySubscriptions,
  getCurrentSubscription,
};
