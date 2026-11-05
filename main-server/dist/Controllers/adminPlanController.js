"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSubscription = exports.approveSubscription = exports.listPendingSubscriptions = exports.deactivatePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.listPaymentMethods = exports.deactivatePlan = exports.updatePlan = exports.createPlan = exports.listPlans = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const planService = __importStar(require("../Services/planService"));
const subscriptionService = __importStar(require("../Services/subscriptionService"));
const auditService = __importStar(require("../Services/auditService"));
const listPlans = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const plans = await planService.listPlans();
    (0, httpResponse_1.successResponse)(res, { plans });
});
exports.listPlans = listPlans;
const createPlan = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const plan = await planService.createPlan(req.body, String(authReq.user?.id));
    auditService.markResource(res, { type: 'subscription_plan', id: plan.id });
    (0, httpResponse_1.successResponse)(res, { plan }, 201);
});
exports.createPlan = createPlan;
const updatePlan = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { plan_id } = req.params;
    const plan = await planService.updatePlan(plan_id, req.body, String(authReq.user?.id));
    auditService.markResource(res, { type: 'subscription_plan', id: plan.id });
    (0, httpResponse_1.successResponse)(res, { plan });
});
exports.updatePlan = updatePlan;
const deactivatePlan = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { plan_id } = req.params;
    const result = await planService.deactivatePlan(plan_id, String(authReq.user?.id));
    auditService.markResource(res, { type: 'subscription_plan', id: plan_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.deactivatePlan = deactivatePlan;
const listPaymentMethods = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const methods = await planService.listPaymentMethods();
    (0, httpResponse_1.successResponse)(res, { methods });
});
exports.listPaymentMethods = listPaymentMethods;
const createPaymentMethod = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const method = await planService.createPaymentMethod(req.body, String(authReq.user?.id));
    auditService.markResource(res, { type: 'payment_method', id: method.id });
    (0, httpResponse_1.successResponse)(res, { method }, 201);
});
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { method_id } = req.params;
    const method = await planService.updatePaymentMethod(method_id, req.body, String(authReq.user?.id));
    auditService.markResource(res, { type: 'payment_method', id: method.id });
    (0, httpResponse_1.successResponse)(res, { method });
});
exports.updatePaymentMethod = updatePaymentMethod;
const deactivatePaymentMethod = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { method_id } = req.params;
    const result = await planService.deactivatePaymentMethod(method_id, String(authReq.user?.id));
    auditService.markResource(res, { type: 'payment_method', id: method_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.deactivatePaymentMethod = deactivatePaymentMethod;
const listPendingSubscriptions = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { status, sort } = req.query;
    const pending = await subscriptionService.listPending({ status, sort });
    (0, httpResponse_1.successResponse)(res, { pending });
});
exports.listPendingSubscriptions = listPendingSubscriptions;
const approveSubscription = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { subscription_id } = req.params;
    const result = await subscriptionService.approve(subscription_id, String(authReq.user?.id));
    auditService.markResource(res, { type: 'driver_subscription', id: subscription_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.approveSubscription = approveSubscription;
const rejectSubscription = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { subscription_id } = req.params;
    const { reason } = req.body;
    const result = await subscriptionService.reject(subscription_id, reason, String(authReq.user?.id));
    auditService.markResource(res, { type: 'driver_subscription', id: subscription_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.rejectSubscription = rejectSubscription;
exports.default = {
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
//# sourceMappingURL=adminPlanController.js.map