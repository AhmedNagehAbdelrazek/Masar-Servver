"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPlanDTO = toPlanDTO;
exports.toMethodDTO = toMethodDTO;
exports.getActivePlans = getActivePlans;
exports.getActivePaymentMethods = getActivePaymentMethods;
exports.listPlans = listPlans;
exports.createPlan = createPlan;
exports.updatePlan = updatePlan;
exports.deactivatePlan = deactivatePlan;
exports.listPaymentMethods = listPaymentMethods;
exports.createPaymentMethod = createPaymentMethod;
exports.updatePaymentMethod = updatePaymentMethod;
exports.deactivatePaymentMethod = deactivatePaymentMethod;
// @ts-nocheck
const Models_1 = require("../Models");
const sequelize_1 = require("sequelize");
const ApiError_1 = require("../utils/ApiError");
const redisKeys_1 = require("../utils/redisKeys");
const redis_1 = require("../config/redis");
const auditService_1 = __importDefault(require("./auditService"));
function toPlanDTO(plan) {
    const dto = {
        id: plan.id,
        name: plan.name,
        period_days: Number(plan.periodDays),
        percentage_cut: Number(plan.percentageCut),
        cost: Number(plan.cost),
        status: plan.status || null,
        features: plan.features || [],
        is_free: plan.isFree,
        free_offer: plan.isFree ? plan.freeOffer || null : null,
    };
    if (plan.isActive !== undefined)
        dto.is_active = plan.isActive;
    return dto;
}
function toMethodDTO(method) {
    const dto = {
        id: method.id,
        name: method.name,
        account_number: method.accountNumber,
        type: method.type,
        email: method.email || null,
    };
    if (method.isActive !== undefined)
        dto.is_active = method.isActive;
    return dto;
}
function auditMutation({ action, actorId, resourceType, resourceId, payload }) {
    auditService_1.default.track({
        eventType: 'admin.action',
        action,
        actorId,
        resourceType,
        resourceId,
        payload,
    });
}
async function invalidatePlansCache() {
    try {
        await (0, redis_1.deleteKey)(redisKeys_1.REDIS_KEYS.PLANS_ACTIVE);
    }
    catch (err) {
        console.warn('[planService] cache invalidation failed:', err.message);
    }
}
/**
 * Active plan catalog for drivers (Redis-cached).
 * Free plans are excluded since they are auto-assigned at signup.
 */
async function getActivePlans() {
    try {
        const cached = await (0, redis_1.getKey)(redisKeys_1.REDIS_KEYS.PLANS_ACTIVE);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.warn('[planService] cache read failed:', err.message);
    }
    const plans = await Models_1.SubscriptionPlan.findAll({
        where: { isActive: true, isFree: false },
        order: [['createdat', 'ASC']],
    });
    const dto = plans.map(toPlanDTO);
    try {
        await (0, redis_1.setKey)(redisKeys_1.REDIS_KEYS.PLANS_ACTIVE, JSON.stringify(dto), redisKeys_1.CACHE_TTL.PLANS);
    }
    catch (err) {
        console.warn('[planService] cache write failed:', err.message);
    }
    return dto;
}
async function getActivePaymentMethods() {
    const methods = await Models_1.PaymentMethod.findAll({
        where: { isActive: true },
        order: [['createdat', 'ASC']],
    });
    return methods.map(toMethodDTO);
}
/**
 * Admin: list all plans including inactive.
 */
async function listPlans() {
    const plans = await Models_1.SubscriptionPlan.findAll({ order: [['createdat', 'ASC']] });
    return plans.map(toPlanDTO);
}
async function ensureSingleFreePlan({ isFree, excludeId = null }) {
    if (!isFree)
        return;
    const where = { isFree: true, isActive: true };
    if (excludeId)
        where.id = { [sequelize_1.Op.ne]: excludeId };
    const existing = await Models_1.SubscriptionPlan.findOne({ where });
    if (existing) {
        throw ApiError_1.ApiErrors.custom('A_FREE_PLAN_ALREADY_EXISTS_ONLY_ONE_FREE_PLAN_CAN', 409, 'FREE_PLAN_EXISTS');
    }
}
async function createPlan(data, actorId) {
    const isFree = Boolean(data.is_free);
    await ensureSingleFreePlan({ isFree });
    const plan = await Models_1.SubscriptionPlan.create({
        name: data.name,
        periodDays: data.period_days,
        percentageCut: data.percentage_cut ?? 0,
        cost: data.cost ?? 0,
        status: data.status || null,
        features: data.features || [],
        isFree,
        freeOffer: isFree ? data.free_offer : null,
        isActive: true,
    });
    auditMutation({
        action: 'plan.create',
        actorId,
        resourceType: 'subscription_plan',
        resourceId: plan.id,
        payload: toPlanDTO(plan),
    });
    await invalidatePlansCache();
    return toPlanDTO(plan);
}
async function updatePlan(planId, data, actorId) {
    const plan = await Models_1.SubscriptionPlan.findByPk(planId);
    if (!plan)
        throw ApiError_1.ApiErrors.notFound('PLAN_NOT_FOUND');
    const isFree = data.is_free !== undefined ? Boolean(data.is_free) : plan.isFree;
    await ensureSingleFreePlan({ isFree, excludeId: planId });
    if (data.name !== undefined)
        plan.name = data.name;
    if (data.period_days !== undefined)
        plan.periodDays = data.period_days;
    if (data.percentage_cut !== undefined)
        plan.percentageCut = data.percentage_cut;
    if (data.cost !== undefined)
        plan.cost = data.cost;
    if (data.status !== undefined)
        plan.status = data.status || null;
    if (data.features !== undefined)
        plan.features = data.features || [];
    if (data.is_free !== undefined)
        plan.isFree = isFree;
    if (data.free_offer !== undefined)
        plan.freeOffer = isFree ? data.free_offer : null;
    await plan.save();
    auditMutation({
        action: 'plan.update',
        actorId,
        resourceType: 'subscription_plan',
        resourceId: plan.id,
        payload: toPlanDTO(plan),
    });
    await invalidatePlansCache();
    return toPlanDTO(plan);
}
async function deactivatePlan(planId, actorId) {
    const plan = await Models_1.SubscriptionPlan.findByPk(planId);
    if (!plan)
        throw ApiError_1.ApiErrors.notFound('PLAN_NOT_FOUND');
    plan.isActive = false;
    await plan.save();
    auditMutation({
        action: 'plan.deactivate',
        actorId,
        resourceType: 'subscription_plan',
        resourceId: plan.id,
        payload: { is_active: false },
    });
    await invalidatePlansCache();
    return { message: 'PLAN_DEACTIVATED' };
}
async function listPaymentMethods() {
    const methods = await Models_1.PaymentMethod.findAll({ order: [['createdat', 'ASC']] });
    return methods.map(toMethodDTO);
}
async function createPaymentMethod(data, actorId) {
    const method = await Models_1.PaymentMethod.create({
        name: data.name,
        accountNumber: data.account_number,
        type: data.type,
        email: data.email || null,
        isActive: true,
    });
    auditMutation({
        action: 'payment_method.create',
        actorId,
        resourceType: 'payment_method',
        resourceId: method.id,
        payload: toMethodDTO(method),
    });
    return toMethodDTO(method);
}
async function updatePaymentMethod(methodId, data, actorId) {
    const method = await Models_1.PaymentMethod.findByPk(methodId);
    if (!method)
        throw ApiError_1.ApiErrors.notFound('PAYMENT_METHOD_NOT_FOUND');
    if (data.name !== undefined)
        method.name = data.name;
    if (data.account_number !== undefined)
        method.accountNumber = data.account_number;
    if (data.type !== undefined)
        method.type = data.type;
    if (data.email !== undefined)
        method.email = data.email || null;
    await method.save();
    auditMutation({
        action: 'payment_method.update',
        actorId,
        resourceType: 'payment_method',
        resourceId: method.id,
        payload: toMethodDTO(method),
    });
    return toMethodDTO(method);
}
async function deactivatePaymentMethod(methodId, actorId) {
    const method = await Models_1.PaymentMethod.findByPk(methodId);
    if (!method)
        throw ApiError_1.ApiErrors.notFound('PAYMENT_METHOD_NOT_FOUND');
    method.isActive = false;
    await method.save();
    auditMutation({
        action: 'payment_method.deactivate',
        actorId,
        resourceType: 'payment_method',
        resourceId: method.id,
        payload: { is_active: false },
    });
    return { message: 'PAYMENT_METHOD_DEACTIVATED' };
}
module.exports = {
    toPlanDTO,
    toMethodDTO,
    getActivePlans,
    getActivePaymentMethods,
    listPlans,
    createPlan,
    updatePlan,
    deactivatePlan,
    listPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deactivatePaymentMethod,
};
exports.default = module.exports;
//# sourceMappingURL=planService.js.map