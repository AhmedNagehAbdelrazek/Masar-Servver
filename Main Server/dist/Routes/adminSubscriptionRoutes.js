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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const c = __importStar(require("../Controllers/adminPlanController"));
const planValidator_1 = require("../utils/validators/planValidator");
const subscriptionValidator_1 = require("../utils/validators/subscriptionValidator");
const admin = [protect_1.default, (0, roleGuard_1.roleGuard)(['admin'])];
// ===== Plan management =====
router.get('/plans', ...admin, c.listPlans);
router.post('/plans', ...admin, ...planValidator_1.createPlanValidation, validatorMiddleware_1.default, c.createPlan);
router.put('/plans/:plan_id', ...admin, ...planValidator_1.planIdValidation, ...planValidator_1.updatePlanValidation, validatorMiddleware_1.default, c.updatePlan);
router.delete('/plans/:plan_id', ...admin, ...planValidator_1.planIdValidation, c.deactivatePlan);
// ===== Payment method management =====
router.get('/payment-methods', ...admin, c.listPaymentMethods);
router.post('/payment-methods', ...admin, ...planValidator_1.createPaymentMethodValidation, validatorMiddleware_1.default, c.createPaymentMethod);
router.put('/payment-methods/:method_id', ...admin, ...planValidator_1.paymentMethodIdValidation, ...planValidator_1.updatePaymentMethodValidation, validatorMiddleware_1.default, c.updatePaymentMethod);
router.delete('/payment-methods/:method_id', ...admin, ...planValidator_1.paymentMethodIdValidation, c.deactivatePaymentMethod);
// ===== Subscription admin workflow (US2) =====
router.get('/subscriptions/pending', ...admin, c.listPendingSubscriptions);
router.post('/subscriptions/:subscription_id/approve', ...admin, ...subscriptionValidator_1.subscriptionIdValidation, validatorMiddleware_1.default, c.approveSubscription);
router.post('/subscriptions/:subscription_id/reject', ...admin, ...subscriptionValidator_1.rejectSubscriptionValidation, validatorMiddleware_1.default, c.rejectSubscription);
exports.default = router;
module.exports = router;
//# sourceMappingURL=adminSubscriptionRoutes.js.map