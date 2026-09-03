"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = round;
exports.maskNationalID = maskNationalID;
exports.createSubscription = createSubscription;
exports.getMySubscriptions = getMySubscriptions;
exports.getCurrentSubscription = getCurrentSubscription;
exports.listPending = listPending;
exports.approve = approve;
exports.reject = reject;
exports.getCurrentActivePlan = getCurrentActivePlan;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const ApiError_1 = require("../utils/ApiError");
const balanceService_1 = __importDefault(require("./balanceService"));
const notificationService_1 = __importDefault(require("./notificationService"));
const auditService_1 = __importDefault(require("./auditService"));
const freeTrips_1 = require("../utils/freeTrips");
const homeService_1 = __importDefault(require("./homeService"));
const DAY_MS = 24 * 60 * 60 * 1000;
function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
function maskNationalID(nationalID) {
    if (!nationalID)
        return null;
    const s = String(nationalID);
    if (s.length <= 4)
        return '****';
    return `****${s.slice(-4)}`;
}
function logMutation({ action, actorId, resourceType, resourceId, payload }) {
    auditService_1.default.track({
        eventType: 'admin.action',
        action,
        actorId,
        resourceType,
        resourceId,
        payload,
    });
}
function toSubscriptionDTO(sub) {
    const dto = {
        id: sub.id,
        plan: {
            name: sub.planName,
            period_days: Number(sub.planPeriodDays),
        },
        balance: Number(sub.balance),
        status: sub.status,
        rejection_reason: sub.adminNotes || null,
        created_at: sub.createdat || sub.createdAt,
        approved_at: sub.approvedAt || null,
        expires_at: sub.expiresAt || null,
    };
    // Show free trips info from the snapshot on the subscription.
    if ((0, freeTrips_1.hasFreeTripsOffer)(sub)) {
        const limit = (0, freeTrips_1.freeTripsLimit)(sub);
        const used = Number(sub.freeTripsUsed) || 0;
        dto.free_trips = {
            max: limit,
            used,
            remaining: Math.max(0, limit - used),
        };
    }
    return dto;
}
function toCurrentDTO(sub, user) {
    const result = {
        subscription: sub
            ? {
                id: sub.id,
                plan: {
                    name: sub.planName,
                    percentage_cut: Number(sub.planPercentageCut),
                },
                balance: Number(sub.balance),
                expires_at: sub.expiresAt,
            }
            : null,
        total_balance: Number(user.totalBalance),
        is_in_debt: user.isInDebt,
    };
    // Show free trips info from the snapshot on the subscription.
    if ((0, freeTrips_1.hasFreeTripsOffer)(sub)) {
        const limit = (0, freeTrips_1.freeTripsLimit)(sub);
        const used = Number(sub.freeTripsUsed) || 0;
        result.subscription.free_trips = {
            max: limit,
            used,
            remaining: Math.max(0, limit - used),
        };
    }
    return result;
}
/**
 * Create a subscription request (US2).
 * - Idempotency: a pending request for the same plan returns 409 unless the
 *   driver explicitly resubmits, in which case older pending rows are
 *   cancelled and a new one is created.
 * - Free plans cannot be subscribed to manually; they are auto-assigned on signup.
 */
async function createSubscription(driverId, data) {
    const plan = await Models_1.SubscriptionPlan.findByPk(data.plan_id);
    if (!plan || !plan.isActive) {
        throw ApiError_1.ApiErrors.custom('THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE', 422, 'PLAN_INACTIVE');
    }
    if (plan.isFree) {
        throw ApiError_1.ApiErrors.custom('FREE_PLANS_ARE_AUTOMATICALLY_ASSIGNED_AT_SIGNUP_AND_CANNOT_BE', 422, 'FREE_PLAN_NOT_SUBSCRIBABLE');
    }
    const method = await Models_1.PaymentMethod.findByPk(data.payment_method_id);
    if (!method || !method.isActive) {
        throw ApiError_1.ApiErrors.validation('THE_SELECTED_PAYMENT_METHOD_IS_UNAVAILABLE');
    }
    const screenshot = await Models_1.UploadedImage.findByPk(data.screenshot_id);
    if (!screenshot) {
        throw ApiError_1.ApiErrors.validation('THE_SCREENSHOT_IMAGE_ID_IS_INVALID');
    }
    return database_1.default.transaction(async (t) => {
        const existing = await Models_1.DriverSubscription.findAll({
            where: {
                driverId,
                planId: plan.id,
                status: constants_1.SUBSCRIPTION_STATUS.PENDING_APPROVAL,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (existing.length > 0 && data.resubmit !== true) {
            throw ApiError_1.ApiErrors.custom('YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_PLAN', 409, 'DUPLICATE_SUBSCRIPTION_REQUEST');
        }
        if (existing.length > 0) {
            await Promise.all(existing.map((row) => row.update({ status: constants_1.SUBSCRIPTION_STATUS.CANCELLED }, { transaction: t })));
        }
        const sub = await Models_1.DriverSubscription.create({
            driverId,
            planId: plan.id,
            planName: plan.name,
            planPeriodDays: plan.periodDays,
            planPercentageCut: plan.percentageCut,
            planCost: plan.cost,
            balance: 0,
            screenshotId: data.screenshot_id,
            paymentMethod: {
                name: method.name,
                account_number: method.accountNumber,
                type: method.type,
            },
            status: constants_1.SUBSCRIPTION_STATUS.PENDING_APPROVAL,
        }, { transaction: t });
        return sub;
    }).then(async (sub) => {
        const user = await Models_1.User.findByPk(driverId);
        if (user) {
            await notificationService_1.default.sendToUser(user, 'SUBSCRIPTION_SUBMITTED', {
                channels: ['in_app'],
                data: { subscription_id: sub.id, plan_id: plan.id },
            });
        }
        return sub;
    });
}
async function getMySubscriptions(driverId) {
    const subs = await Models_1.DriverSubscription.findAll({
        where: { driverId },
        order: [['createdat', 'DESC']],
    });
    return subs.map(toSubscriptionDTO);
}
async function getCurrentSubscription(driverId) {
    const user = await Models_1.User.findByPk(driverId);
    if (!user)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    const current = await balanceService_1.default.findCurrentSubscription(driverId);
    return toCurrentDTO(current, user);
}
/**
 * Admin queue: pending requests with masked national ID.
 * The raw national ID is selected on the server but never returned — it is
 * masked before it leaves this service.
 */
async function listPending({ status = constants_1.SUBSCRIPTION_STATUS.PENDING_APPROVAL, sort = 'newest' } = {}) {
    const validStatuses = Object.values(constants_1.SUBSCRIPTION_STATUS);
    if (!validStatuses.includes(status)) {
        throw ApiError_1.ApiErrors.validation('INVALID_SUBSCRIPTION_STATUS_FILTER');
    }
    const order = sort === 'oldest'
        ? [['createdat', 'ASC']]
        : [['createdat', 'DESC']];
    const rows = await Models_1.DriverSubscription.findAll({
        where: { status },
        include: [
            {
                model: Models_1.User,
                as: 'driver',
                attributes: ['id', 'fullName', 'phone'],
                include: [
                    { model: Models_1.DriverProfile, as: 'driverProfile', attributes: ['nationalID'] },
                ],
            },
            { model: Models_1.SubscriptionPlan, as: 'plan', attributes: ['name', 'cost', 'isActive'] },
            { model: Models_1.UploadedImage, as: 'screenshot', attributes: ['id', 'url'] },
        ],
        order,
    });
    return rows.map((sub) => {
        const driver = sub.driver || {};
        const profile = driver.driverProfile || {};
        return {
            subscription_id: sub.id,
            driver: {
                id: driver.id,
                full_name: driver.fullName || null,
                phone: driver.phone || null,
                national_id_masked: maskNationalID(profile.nationalID),
            },
            plan: {
                name: sub.plan ? sub.plan.name : sub.planName,
                cost: sub.plan ? Number(sub.plan.cost) : Number(sub.planCost),
                is_active: sub.plan ? sub.plan.isActive : null,
            },
            payment_method: {
                name: (sub.paymentMethod && sub.paymentMethod.name) || null,
            },
            screenshot_id: sub.screenshotId || null,
            screenshot_url: (sub.screenshot && sub.screenshot.url) || null,
            submitted_at: sub.createdat || sub.createdAt,
        };
    });
}
/**
 * Approve a pending request (US2). Atomic conditional update guarantees
 * first-action-wins. Credits balance (debt cleared first), sets activation
 * timestamps, merges an existing same-plan subscription balance (renewal),
 * and notifies the driver.
 */
async function approve(subscriptionId, actorId) {
    const result = await database_1.default.transaction(async (t) => {
        const sub = await Models_1.DriverSubscription.findByPk(subscriptionId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!sub)
            throw ApiError_1.ApiErrors.notFound('SUBSCRIPTION_NOT_FOUND');
        if (sub.status !== constants_1.SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
            throw ApiError_1.ApiErrors.custom('REQUEST_ALREADY_PROCESSED', 409, 'REQUEST_ALREADY_PROCESSED');
        }
        const plan = await Models_1.SubscriptionPlan.findByPk(sub.planId);
        if (!plan || !plan.isActive) {
            throw ApiError_1.ApiErrors.custom('THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE', 409, 'APPROVAL_BLOCKED');
        }
        const now = new Date();
        const expiresAt = new Date(now.getTime() + Number(sub.planPeriodDays) * DAY_MS);
        let extraBalance = 0;
        let merged = null;
        let mergedBalance = 0;
        // Free credit-offer plans credit the offer value (plan cost is 0).
        if (plan.isFree && plan.freeOffer && plan.freeOffer.type === constants_1.FREE_OFFER_TYPE.CREDIT) {
            extraBalance += Number(plan.freeOffer.value) || 0;
        }
        // Renewal: merge an existing active same-plan subscription (T046).
        const existing = await Models_1.DriverSubscription.findOne({
            where: {
                driverId: sub.driverId,
                planId: sub.planId,
                id: { [sequelize_1.Op.ne]: sub.id },
                status: constants_1.SUBSCRIPTION_STATUS.ACTIVE,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (existing) {
            const remaining = Number(existing.balance) || 0;
            extraBalance += remaining;
            mergedBalance = remaining;
            await existing.update({ status: constants_1.SUBSCRIPTION_STATUS.EXPIRED, balance: 0 }, { transaction: t });
            merged = { id: existing.id, balance: remaining };
        }
        await sub.update({
            status: constants_1.SUBSCRIPTION_STATUS.ACTIVE,
            approvedAt: now,
            activatedAt: now,
            expiresAt,
        }, { transaction: t });
        const credit = await balanceService_1.default.creditOnApproval(sub, {
            transaction: t,
            actorId,
            extraBalance,
            mergedBalance,
        });
        logMutation({
            action: 'subscription.approve',
            actorId,
            resourceType: 'driver_subscription',
            resourceId: sub.id,
            payload: {
                driver_id: sub.driverId,
                plan_id: sub.planId,
                balance_added: credit.balanceAdded,
                expires_at: expiresAt,
                merged: merged ? { subscription_id: merged.id, balance: merged.balance } : null,
            },
        });
        return {
            subscriptionId: sub.id,
            balanceAdded: credit.balanceAdded,
            totalBalance: credit.totalBalance,
            isInDebt: credit.isInDebt,
            planName: sub.planName,
            driverId: sub.driverId,
        };
    });
    // Notify outside the transaction (best-effort, never throws).
    try {
        const user = await Models_1.User.findByPk(result.driverId);
        if (user) {
            await notificationService_1.default.sendToUser(user, 'SUBSCRIPTION_APPROVED', {
                channels: ['sms', 'in_app'],
                vars: {
                    plan: result.planName,
                    balance: Number(result.totalBalance).toFixed(2),
                },
                data: { subscription_id: result.subscriptionId, balance_added: result.balanceAdded },
            });
        }
    }
    catch (err) {
        console.warn('[subscriptionService] approval notification failed:', err.message);
    }
    // Best-effort: the approved plan changes the driver-home `subscription`
    // section and free-trips gating. Lazy require avoids a require cycle
    // (homeService already requires this module).
    try {
        await homeService_1.default.invalidateHomeCache(result.driverId);
    }
    catch (err) {
        console.warn('[subscriptionService] driver home cache invalidation failed:', err.message);
    }
    return {
        message: 'SUBSCRIPTION_APPROVED_PLAN_ACTIVATED',
        subscription_id: result.subscriptionId,
        balance_added: result.balanceAdded,
    };
}
/**
 * Reject a pending request with a reason. First-action-wins.
 */
async function reject(subscriptionId, reason, actorId) {
    const result = await database_1.default.transaction(async (t) => {
        const sub = await Models_1.DriverSubscription.findByPk(subscriptionId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!sub)
            throw ApiError_1.ApiErrors.notFound('SUBSCRIPTION_NOT_FOUND');
        if (sub.status !== constants_1.SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
            throw ApiError_1.ApiErrors.custom('REQUEST_ALREADY_PROCESSED', 409, 'REQUEST_ALREADY_PROCESSED');
        }
        await sub.update({ status: constants_1.SUBSCRIPTION_STATUS.REJECTED, adminNotes: reason }, { transaction: t });
        logMutation({
            action: 'subscription.reject',
            actorId,
            resourceType: 'driver_subscription',
            resourceId: sub.id,
            payload: { driver_id: sub.driverId, plan_id: sub.planId, reason },
        });
        return { subscriptionId: sub.id, planName: sub.planName, driverId: sub.driverId };
    });
    try {
        const user = await Models_1.User.findByPk(result.driverId);
        if (user) {
            await notificationService_1.default.sendToUser(user, 'SUBSCRIPTION_REJECTED', {
                channels: ['sms', 'in_app'],
                vars: { reason },
                data: { subscription_id: result.subscriptionId },
            });
        }
    }
    catch (err) {
        console.warn('[subscriptionService] rejection notification failed:', err.message);
    }
    return { message: 'SUBSCRIPTION_REJECTED', subscription_id: result.subscriptionId };
}
async function getCurrentActivePlan(driverId) {
    return balanceService_1.default.findCurrentSubscription(driverId);
}
module.exports = {
    round,
    maskNationalID,
    createSubscription,
    getMySubscriptions,
    getCurrentSubscription,
    listPending,
    approve,
    reject,
    getCurrentActivePlan,
};
exports.default = module.exports;
//# sourceMappingURL=subscriptionService.js.map