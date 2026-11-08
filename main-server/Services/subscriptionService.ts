// @ts-nocheck
import { Op, fn, col } from 'sequelize';
import sequelize from '../config/database';
import { User, SubscriptionPlan, PaymentMethod, DriverSubscription, UploadedImage, DriverProfile } from '../Models';
import { toAbsoluteMediaUrl } from '../utils/mediaUrl';
import { SUBSCRIPTION_STATUS, FREE_OFFER_TYPE } from '../config/constants';
import { ApiErrors } from '../utils/ApiError';
import balanceService from './balanceService';
import notificationService from './notificationService';
import auditService from './auditService';
import { hasFreeTripsOffer, freeTripsLimit } from '../utils/freeTrips';
import homeService from './homeService';

const DAY_MS = 24 * 60 * 60 * 1000;

function round(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function maskNationalID(nationalID) {
  if (!nationalID) return null;
  const s = String(nationalID);
  if (s.length <= 4) return '****';
  return `****${s.slice(-4)}`;
}

function logMutation({ action, actorId, resourceType, resourceId, payload }) {
  auditService.track({
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
  if (hasFreeTripsOffer(sub)) {
    const limit = freeTripsLimit(sub);
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
  if (hasFreeTripsOffer(sub)) {
    const limit = freeTripsLimit(sub);
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
  const plan = await SubscriptionPlan.findByPk(data.plan_id);
  if (!plan || !plan.isActive) {
    throw ApiErrors.custom('THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE', 422, 'PLAN_INACTIVE');
  }

  if (plan.isFree) {
    throw ApiErrors.custom(
      'FREE_PLANS_ARE_AUTOMATICALLY_ASSIGNED_AT_SIGNUP_AND_CANNOT_BE',
      422,
      'FREE_PLAN_NOT_SUBSCRIBABLE'
    );
  }

  const method = await PaymentMethod.findByPk(data.payment_method_id);
  if (!method || !method.isActive) {
    throw ApiErrors.validation('THE_SELECTED_PAYMENT_METHOD_IS_UNAVAILABLE');
  }

  const screenshot = await UploadedImage.findByPk(data.screenshot_id);
  if (!screenshot) {
    throw ApiErrors.validation('THE_SCREENSHOT_IMAGE_ID_IS_INVALID');
  }

  return sequelize.transaction(async (t) => {
    const existing = await DriverSubscription.findAll({
      where: {
        driverId,
        planId: plan.id,
        status: SUBSCRIPTION_STATUS.PENDING_APPROVAL,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existing.length > 0 && data.resubmit !== true) {
      throw ApiErrors.custom(
        'YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_PLAN',
        409,
        'DUPLICATE_SUBSCRIPTION_REQUEST'
      );
    }

    if (existing.length > 0) {
      await Promise.all(
        existing.map((row) =>
          row.update({ status: SUBSCRIPTION_STATUS.CANCELLED }, { transaction: t })
        )
      );
    }

    const sub = await DriverSubscription.create(
      {
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
        status: SUBSCRIPTION_STATUS.PENDING_APPROVAL,
      },
      { transaction: t }
    );

    return sub;
  }).then(async (sub) => {
    const user = await User.findByPk(driverId);
    if (user) {
      await notificationService.sendToUser(user, 'SUBSCRIPTION_SUBMITTED', {
        channels: ['in_app'],
        data: { subscription_id: sub.id, plan_id: plan.id },
      });
    }
    return sub;
  });
}

async function getMySubscriptions(driverId) {
  const subs = await DriverSubscription.findAll({
    where: { driverId },
    order: [['createdat', 'DESC']],
  });
  return subs.map(toSubscriptionDTO);
}

async function getCurrentSubscription(driverId) {
  const user = await User.findByPk(driverId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

  const current = await balanceService.findCurrentSubscription(driverId);
  return toCurrentDTO(current, user);
}

/**
 * Admin queue: pending requests with masked national ID.
 * The raw national ID is selected on the server but never returned — it is
 * masked before it leaves this service.
 */
async function listPending({ status = SUBSCRIPTION_STATUS.PENDING_APPROVAL, sort = 'newest' } = {}) {
  const validStatuses = Object.values(SUBSCRIPTION_STATUS);
  if (!validStatuses.includes(status)) {
    throw ApiErrors.validation('INVALID_SUBSCRIPTION_STATUS_FILTER');
  }

  const order =
    sort === 'oldest'
      ? [['createdat', 'ASC']]
      : [['createdat', 'DESC']];

  const rows = await DriverSubscription.findAll({
    where: { status },
    include: [
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'fullName', 'phone'],
        include: [
          { model: DriverProfile, as: 'driverProfile', attributes: ['nationalID'] },
        ],
      },
      { model: SubscriptionPlan, as: 'plan', attributes: ['name', 'cost', 'isActive'] },
      { model: UploadedImage, as: 'screenshot', attributes: ['id', 'url'] },
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
      screenshot_url: toAbsoluteMediaUrl((sub.screenshot && sub.screenshot.url) || null),
      submitted_at: sub.createdat || sub.createdAt,
    };
  });
}

/**
 * Admin cards: إجمالي المشتركين (distinct drivers with an active
 * subscription) / النشطة / قيد المراجعة / المرفوضة.
 */
async function getStats() {
  const [drivers, active, pending, rejected] = await Promise.all([
    DriverSubscription.findAll({
      attributes: [[fn('COUNT', fn('DISTINCT', col('driver_id'))), 'count']],
      where: { status: SUBSCRIPTION_STATUS.ACTIVE },
      raw: true,
    }),
    DriverSubscription.count({ where: { status: SUBSCRIPTION_STATUS.ACTIVE } }),
    DriverSubscription.count({ where: { status: SUBSCRIPTION_STATUS.PENDING_APPROVAL } }),
    DriverSubscription.count({ where: { status: SUBSCRIPTION_STATUS.REJECTED } }),
  ]);
  return {
    total_subscribers: Number(drivers?.[0]?.count || 0),
    active_subscriptions: active,
    pending_review: pending,
    rejected,
  };
}

/**
 * Review dossier used by the payment review page: plan, driver, transfer
 * receipt and the submitted→decided history.
 */
async function getDetail(subscriptionId) {
  const sub = await DriverSubscription.findByPk(subscriptionId, {
    include: [
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'fullName', 'phone', 'status', 'createdat'],
        include: [{ model: DriverProfile, as: 'driverProfile', attributes: ['nationalID'] }],
      },
      { model: SubscriptionPlan, as: 'plan' },
      { model: UploadedImage, as: 'screenshot', attributes: ['id', 'url'] },
    ],
  });
  if (!sub) throw ApiErrors.notFound('SUBSCRIPTION_NOT_FOUND');

  const driver = sub.driver || null;
  const profile = driver?.driverProfile || null;
  const plan = sub.plan || null;
  const screenshot = sub.screenshot || null;
  const payment = sub.paymentMethod || null;
  const history = [{ event: 'submitted', at: sub.createdat || sub.createdAt }];
  if (sub.status === SUBSCRIPTION_STATUS.ACTIVE && sub.activatedAt) {
    history.push({ event: 'approved', at: sub.activatedAt, approved_at: sub.approvedAt });
  } else if (sub.status === SUBSCRIPTION_STATUS.REJECTED) {
    history.push({ event: 'rejected', at: sub.updatedat, reason: sub.adminNotes });
  } else if (sub.status !== SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
    history.push({ event: sub.status, at: sub.updatedat });
  }

  return {
    subscription: {
      id: sub.id,
      status: sub.status,
      submitted_at: sub.createdat || sub.createdAt,
      approved_at: sub.approvedAt,
      activated_at: sub.activatedAt,
      expires_at: sub.expiresAt,
      rejection_reason: sub.adminNotes,
      balance: Number(sub.balance),
      free_trips_used: sub.freeTripsUsed,
    },
    driver: driver
      ? {
        id: driver.id,
        full_name: driver.fullName,
        phone: maskNationalIDPhone(driver.phone),
        account_status: driver.status,
        national_id_masked: maskNationalID(profile?.nationalID),
        registered_at: driver.createdat || driver.createdAt,
      }
      : null,
    plan: plan
      ? {
        id: plan.id,
        name: plan.name,
        period_days: plan.periodDays,
        percentage_cut: Number(plan.percentageCut),
        cost: Number(plan.cost),
        is_active: plan.isActive,
      }
      : {
        name: sub.planName,
        period_days: sub.planPeriodDays,
        percentage_cut: Number(sub.planPercentageCut),
        cost: Number(sub.planCost),
      },
    transfer: {
      method: payment,
      screenshot_id: sub.screenshotId,
      screenshot_url: toAbsoluteMediaUrl(screenshot?.url || null),
    },
    history,
  };
}

// Driver phones are masked on admin list/detail surfaces (PII policy).
function maskNationalIDPhone(phone) {
  if (!phone) return null;
  const s = String(phone);
  if (s.length <= 7) return '***';
  return `${s.slice(0, s.length - 7)}***${s.slice(-4)}`;
}


async function approve(subscriptionId, actorId) {
  const result = await sequelize.transaction(async (t) => {
    const sub = await DriverSubscription.findByPk(subscriptionId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!sub) throw ApiErrors.notFound('SUBSCRIPTION_NOT_FOUND');

    if (sub.status !== SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
      throw ApiErrors.custom('REQUEST_ALREADY_PROCESSED', 409, 'REQUEST_ALREADY_PROCESSED');
    }

    const plan = await SubscriptionPlan.findByPk(sub.planId);
    if (!plan || !plan.isActive) {
      throw ApiErrors.custom('THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE', 409, 'APPROVAL_BLOCKED');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(sub.planPeriodDays) * DAY_MS);

    let extraBalance = 0;
    let merged = null;
    let mergedBalance = 0;

    // Free credit-offer plans credit the offer value (plan cost is 0).
    if (plan.isFree && plan.freeOffer && plan.freeOffer.type === FREE_OFFER_TYPE.CREDIT) {
      extraBalance += Number(plan.freeOffer.value) || 0;
    }

    // Renewal: merge an existing active same-plan subscription (T046).
    const existing = await DriverSubscription.findOne({
      where: {
        driverId: sub.driverId,
        planId: sub.planId,
        id: { [Op.ne]: sub.id },
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existing) {
      const remaining = Number(existing.balance) || 0;
      extraBalance += remaining;
      mergedBalance = remaining;
      await existing.update(
        { status: SUBSCRIPTION_STATUS.EXPIRED, balance: 0 },
        { transaction: t }
      );
      merged = { id: existing.id, balance: remaining };
    }

    await sub.update(
      {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        approvedAt: now,
        activatedAt: now,
        expiresAt,
      },
      { transaction: t }
    );

    const credit = await balanceService.creditOnApproval(sub, {
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
    const user = await User.findByPk(result.driverId);
    if (user) {
      await notificationService.sendToUser(user, 'SUBSCRIPTION_APPROVED', {
        channels: ['sms', 'in_app'],
        vars: {
          plan: result.planName,
          balance: Number(result.totalBalance).toFixed(2),
        },
        data: { subscription_id: result.subscriptionId, balance_added: result.balanceAdded },
      });
    }
  } catch (err) {
    console.warn('[subscriptionService] approval notification failed:', err.message);
  }

  // Best-effort: the approved plan changes the driver-home `subscription`
  // section and free-trips gating. Lazy require avoids a require cycle
  // (homeService already requires this module).
  try {
    await homeService.invalidateHomeCache(result.driverId);
  } catch (err) {
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
  const result = await sequelize.transaction(async (t) => {
    const sub = await DriverSubscription.findByPk(subscriptionId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!sub) throw ApiErrors.notFound('SUBSCRIPTION_NOT_FOUND');

    if (sub.status !== SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
      throw ApiErrors.custom('REQUEST_ALREADY_PROCESSED', 409, 'REQUEST_ALREADY_PROCESSED');
    }

    await sub.update(
      { status: SUBSCRIPTION_STATUS.REJECTED, adminNotes: reason },
      { transaction: t }
    );

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
    const user = await User.findByPk(result.driverId);
    if (user) {
      await notificationService.sendToUser(user, 'SUBSCRIPTION_REJECTED', {
        channels: ['sms', 'in_app'],
        vars: { reason },
        data: { subscription_id: result.subscriptionId },
      });
    }
  } catch (err) {
    console.warn('[subscriptionService] rejection notification failed:', err.message);
  }

  return { message: 'SUBSCRIPTION_REJECTED', subscription_id: result.subscriptionId };
}

async function getCurrentActivePlan(driverId) {
  return balanceService.findCurrentSubscription(driverId);
}

module.exports = {
  round,
  maskNationalID,
  createSubscription,
  getMySubscriptions,
  getCurrentSubscription,
  listPending,
  getStats,
  getDetail,
  approve,
  reject,
  getCurrentActivePlan,
};
export { round, maskNationalID, createSubscription, getMySubscriptions, getCurrentSubscription, listPending, getStats, getDetail, approve, reject, getCurrentActivePlan };
export default module.exports;