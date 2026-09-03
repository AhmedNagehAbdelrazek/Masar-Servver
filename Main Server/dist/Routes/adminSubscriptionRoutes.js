"use strict";
const router = require('express').Router();
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/adminPlanController');
const { createPlanValidation, updatePlanValidation, planIdValidation, createPaymentMethodValidation, updatePaymentMethodValidation, paymentMethodIdValidation, } = require('../utils/validators/planValidator');
const { subscriptionIdValidation, rejectSubscriptionValidation, } = require('../utils/validators/subscriptionValidator');
const admin = [protect, roleGuard(['admin'])];
// ===== Plan management =====
router.get('/plans', ...admin, c.listPlans);
router.post('/plans', ...admin, ...createPlanValidation, validate, c.createPlan);
router.put('/plans/:plan_id', ...admin, ...planIdValidation, ...updatePlanValidation, validate, c.updatePlan);
router.delete('/plans/:plan_id', ...admin, ...planIdValidation, c.deactivatePlan);
// ===== Payment method management =====
router.get('/payment-methods', ...admin, c.listPaymentMethods);
router.post('/payment-methods', ...admin, ...createPaymentMethodValidation, validate, c.createPaymentMethod);
router.put('/payment-methods/:method_id', ...admin, ...paymentMethodIdValidation, ...updatePaymentMethodValidation, validate, c.updatePaymentMethod);
router.delete('/payment-methods/:method_id', ...admin, ...paymentMethodIdValidation, c.deactivatePaymentMethod);
// ===== Subscription admin workflow (US2) =====
router.get('/subscriptions/pending', ...admin, c.listPendingSubscriptions);
router.post('/subscriptions/:subscription_id/approve', ...admin, ...subscriptionIdValidation, validate, c.approveSubscription);
router.post('/subscriptions/:subscription_id/reject', ...admin, ...rejectSubscriptionValidation, validate, c.rejectSubscription);
module.exports = router;
//# sourceMappingURL=adminSubscriptionRoutes.js.map