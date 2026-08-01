const subscriptionService = require('../Services/subscriptionService');
const { successResponse } = require('../utils/httpResponse');

const createSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.createSubscription(req.user.id, req.body);
    successResponse(
      res,
      {
        subscription_id: sub.id,
        status: sub.status,
        message: 'Your subscription is pending admin approval.',
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getMySubscriptions(req.user.id);
    successResponse(res, { subscriptions });
  } catch (err) {
    next(err);
  }
};

const getCurrentSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.getCurrentSubscription(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSubscription,
  getMySubscriptions,
  getCurrentSubscription,
};
