const planService = require('../Services/planService');
const subscriptionService = require('../Services/subscriptionService');
const { successResponse } = require('../utils/httpResponse');

const listPlans = async (req, res, next) => {
  try {
    const plans = await planService.listPlans();
    successResponse(res, { plans });
  } catch (err) {
    next(err);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await planService.createPlan(req.body, req.user.id);
    successResponse(res, { plan }, 201);
  } catch (err) {
    next(err);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req.params.plan_id, req.body, req.user.id);
    successResponse(res, { plan });
  } catch (err) {
    next(err);
  }
};

const deactivatePlan = async (req, res, next) => {
  try {
    const result = await planService.deactivatePlan(req.params.plan_id, req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const listPaymentMethods = async (req, res, next) => {
  try {
    const methods = await planService.listPaymentMethods();
    successResponse(res, { methods });
  } catch (err) {
    next(err);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const method = await planService.createPaymentMethod(req.body, req.user.id);
    successResponse(res, { method }, 201);
  } catch (err) {
    next(err);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const method = await planService.updatePaymentMethod(req.params.method_id, req.body, req.user.id);
    successResponse(res, { method });
  } catch (err) {
    next(err);
  }
};

const deactivatePaymentMethod = async (req, res, next) => {
  try {
    const result = await planService.deactivatePaymentMethod(req.params.method_id, req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

// ===== Subscription admin workflow (US2) =====

const listPendingSubscriptions = async (req, res, next) => {
  try {
    const { status, sort } = req.query;
    const pending = await subscriptionService.listPending({ status, sort });
    successResponse(res, { pending });
  } catch (err) {
    next(err);
  }
};

const approveSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.approve(req.params.subscription_id, req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const rejectSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.reject(
      req.params.subscription_id,
      req.body.reason,
      req.user.id
    );
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deactivatePaymentMethod,
  listPendingSubscriptions,
  approveSubscription,
  rejectSubscription,
};
