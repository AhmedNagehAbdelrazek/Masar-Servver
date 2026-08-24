const planService = require('../Services/planService');
const subscriptionService = require('../Services/subscriptionService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const listPlans = catchAsync(async (req, res) => {
  const plans = await planService.listPlans();
  successResponse(res, { plans });
});

const createPlan = catchAsync(async (req, res) => {
  const plan = await planService.createPlan(req.body, req.user.id);
  markResource(res, { type: 'subscription_plan', id: plan.id });
  successResponse(res, { plan }, 201);
});

const updatePlan = catchAsync(async (req, res) => {
  const plan = await planService.updatePlan(req.params.plan_id, req.body, req.user.id);
  markResource(res, { type: 'subscription_plan', id: plan.id });
  successResponse(res, { plan });
});

const deactivatePlan = catchAsync(async (req, res) => {
  const result = await planService.deactivatePlan(req.params.plan_id, req.user.id);
  markResource(res, { type: 'subscription_plan', id: req.params.plan_id });
  successResponse(res, result);
});

const listPaymentMethods = catchAsync(async (req, res) => {
  const methods = await planService.listPaymentMethods();
  successResponse(res, { methods });
});

const createPaymentMethod = catchAsync(async (req, res) => {
  const method = await planService.createPaymentMethod(req.body, req.user.id);
  markResource(res, { type: 'payment_method', id: method.id });
  successResponse(res, { method }, 201);
});

const updatePaymentMethod = catchAsync(async (req, res) => {
  const method = await planService.updatePaymentMethod(req.params.method_id, req.body, req.user.id);
  markResource(res, { type: 'payment_method', id: method.id });
  successResponse(res, { method });
});

const deactivatePaymentMethod = catchAsync(async (req, res) => {
  const result = await planService.deactivatePaymentMethod(req.params.method_id, req.user.id);
  markResource(res, { type: 'payment_method', id: req.params.method_id });
  successResponse(res, result);
});

// ===== Subscription admin workflow (US2) =====

const listPendingSubscriptions = catchAsync(async (req, res) => {
  const { status, sort } = req.query;
  const pending = await subscriptionService.listPending({ status, sort });
  successResponse(res, { pending });
});

const approveSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.approve(req.params.subscription_id, req.user.id);
  markResource(res, { type: 'driver_subscription', id: req.params.subscription_id });
  successResponse(res, result);
});

const rejectSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.reject(
    req.params.subscription_id,
    req.body.reason,
    req.user.id
  );
  markResource(res, { type: 'driver_subscription', id: req.params.subscription_id });
  successResponse(res, result);
});

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
