const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, DriverProfile, SubscriptionPlan, PaymentMethod, DriverSubscription, UploadedImage } = require('../Models');
const { SUBSCRIPTION_STATUS, FREE_OFFER_TYPE } = require('../config/constants');
const { ApiErrors } = require('../utils/ApiError');
const balanceService = require('./balanceService');
const notificationService = require('./notificationService');
const { audit } = require('../config/audit');

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
  try {
    audit.track({
      event_type: 'admin.action',
      action,
      outcome: 'success',
      actor: actorId ? { type: 'admin', id: actorId } : { type: 'system' },
      resource: { type: resourceType, id: resourceId },
      payload,
    });
  } catch (err) {
    console.warn('[audit] subscription mutation log failed:', err.message);
  }
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

  if (sub.freeTripsUsed !== undefined) {
    dto.free_trips_used = Number(sub.freeTripsUsed) || 0;
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

  if (sub && sub.plan && sub.plan.isFree && sub.plan.freeOffer) {
    const offer = sub.plan.freeOffer;
    result.subscription.free_offer = {
      type: offer.type,
      value: Number(offer.value),
      used: Number(sub.freeTripsUsed) || 0,
      remaining: Math.max(0, Number(offer.value) - (Number(sub.freeTripsUsed) || 0)),
    };
  }

  return result;
}

/**
 * Free-plan eligibility: the National ID (from the verified DriverProfile)
 * may only activate a free plan once. Pending/active/expired all count as
 * "used"; rejected and cancelled requests do not.
 */
async function assertFreePlanEligibility(driverId, plan) {
  if (!plan.isFree) return;

  const profile = await DriverProfile.findOne({ where: { driverId } });
  if (!profile || !profile.nationalID) {
    throw ApiErrors.validation(
      'A verified national ID is required to subscribe to the free plan.'
    );
  }

  const used = await DriverSubscription.findOne({
    where: {
      driverId,
      planId: plan.id,
      status: {
        [Op.in]: [
          SUBSCRIPTION_STATUS.PENDING_APPROVAL,
          SUBSCRIPTION_STATUS.ACTIVE,
          SUBSCRIPTION_STATUS.EXPIRED,
        ],
      },
    },
  });

  if (used) {
    throw ApiErrors.custom(
      'This national ID has already used the free plan.',
      422,
      'FREE_PLAN_ALREADY_USED'
    );
  }
}

/**
 * Create a subscription request (US2).
 * - Idempotency: a pending request for the same plan returns 409 unless the
 *   driver explicitly resubmits, in which case older pending rows are
 *   cancelled and a new one is created.
 */
async function createSubscription(driverId, data) {
  const plan = await SubscriptionPlan.findByPk(data.plan_id);
  if (!plan || !plan.isActive) {
    throw ApiErrors.custom('The selected plan is no longer active.', 422, 'PLAN_INACTIVE');
  }

  const method = await PaymentMethod.findByPk(data.payment_method_id);
  if (!method || !method.isActive) {
    throw ApiErrors.validation('The selected payment method is unavailable.');
  }

  const screenshot = await UploadedImage.findByPk(data.screenshot_id);
  if (!screenshot) {
    throw ApiErrors.validation('The screenshot image ID is invalid.');
  }

  await assertFreePlanEligibility(driverId, plan);

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
        'You already have a pending request for this plan.',
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
  if (!user) throw ApiErrors.notFound('User not found');

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
    throw ApiErrors.validation('Invalid subscription status filter.');
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
  const result = await sequelize.transaction(async (t) => {
    const sub = await DriverSubscription.findByPk(subscriptionId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!sub) throw ApiErrors.notFound('Subscription not found');

    if (sub.status !== SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
      throw ApiErrors.custom('Request already processed.', 409, 'REQUEST_ALREADY_PROCESSED');
    }

    const plan = await SubscriptionPlan.findByPk(sub.planId);
    if (!plan || !plan.isActive) {
      throw ApiErrors.custom('The selected plan is no longer active.', 409, 'APPROVAL_BLOCKED');
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

  return {
    message: 'Subscription approved. Plan activated.',
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
    if (!sub) throw ApiErrors.notFound('Subscription not found');

    if (sub.status !== SUBSCRIPTION_STATUS.PENDING_APPROVAL) {
      throw ApiErrors.custom('Request already processed.', 409, 'REQUEST_ALREADY_PROCESSED');
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

  return { message: 'Subscription rejected.', subscription_id: result.subscriptionId };
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
  approve,
  reject,
  getCurrentActivePlan,
};
