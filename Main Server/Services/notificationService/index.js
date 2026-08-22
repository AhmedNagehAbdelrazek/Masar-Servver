const sms = require('./channels/sms');
const push = require('./channels/push');
const inApp = require('./channels/inApp');
const auditService = require('../auditService');

/**
 * Notification templates keyed by type then locale.
 * Placeholders use {var} and are interpolated at send time.
 */
const TEMPLATES = {
  SUBSCRIPTION_SUBMITTED: {
    ar: {
      title: 'تم استلام طلب الاشتراك',
      body: 'طلب الاشتراك الخاص بك قيد مراجعة الإدارة وسيتم إشعارك عند التفعيل.',
    },
    en: {
      title: 'Subscription submitted',
      body: 'Your subscription request is pending admin review. You will be notified once it is activated.',
    },
  },
  SUBSCRIPTION_APPROVED: {
    ar: {
      title: 'تم تفعيل الاشتراك',
      body: 'تم تفعيل خطة {plan}. رصيدك الحالي: {balance}.',
    },
    en: {
      title: 'Subscription approved',
      body: 'Your {plan} plan is now active. Current balance: {balance}.',
    },
  },
  SUBSCRIPTION_REJECTED: {
    ar: {
      title: 'تم رفض طلب الاشتراك',
      body: 'عذراً، تم رفض طلب الاشتراك الخاص بك. السبب: {reason}',
    },
    en: {
      title: 'Subscription rejected',
      body: 'Your subscription request was rejected. Reason: {reason}',
    },
  },
  INSUFFICIENT_BALANCE_START: {
    ar: {
      title: 'رصيد غير كافٍ',
      body: 'لا يمكن بدء الرحلة لأن رصيدك لا يغطي عمولة المقعد. يرجى الاشتراك في خطة.',
    },
    en: {
      title: 'Insufficient balance',
      body: 'Your trip cannot be started because your balance is insufficient. Please subscribe to a plan.',
    },
  },
  DEBT: {
    ar: {
      title: 'رصيدك بالسالب',
      body: 'رصيدك الحالي: {balance}. تم إيقاف نشر رحلاتك حتى يتم تغطية الرصيد عبر اشتراك جديد.',
    },
    en: {
      title: 'Negative balance',
      body: 'Your current balance is {balance}. Your trips are unpublished until you top up with a new subscription.',
    },
  },
  PLAN_EXPIRING_SOON: {
    ar: {
      title: 'اشتراكك على وشك الانتهاء',
      body: 'تنتهي خطة {plan} خلال 24 ساعة. يرجى التجديد لتجنب إيقاف رحلاتك.',
    },
    en: {
      title: 'Your plan expires soon',
      body: 'Your {plan} plan expires within 24 hours. Renew to avoid your trips being unpublished.',
    },
  },
  PLAN_EXPIRED: {
    ar: {
      title: 'انتهى اشتراكك',
      body: 'انتهت خطة {plan}. تم إيقاف نشر رحلاتك حتى تفعيل اشتراك جديد.',
    },
    en: {
      title: 'Your plan expired',
      body: 'Your {plan} plan has expired. Your trips are unpublished until a new subscription is activated.',
    },
  },
  TRIP_UNAVAILABLE: {
    ar: {
      title: 'الرحلة غير متاحة مؤقتاً',
      body: 'رحلة {route} غير متاحة مؤقتاً. سيتم إشعارك عند عودتها.',
    },
    en: {
      title: 'Trip temporarily unavailable',
      body: 'Your trip {route} is temporarily unavailable. You will be notified when it is republished.',
    },
  },
  TRIP_REPUBLISHED: {
    ar: {
      title: 'الرحلة متاحة من جديد',
      body: 'رحلة {route} متاحة من جديد.',
    },
    en: {
      title: 'Trip republished',
      body: 'Your trip {route} is available again.',
    },
  },
  LOW_BALANCE_WARNING: {
    ar: {
      title: 'تحذير رصيد منخفض',
      body: 'رصيدك قد لا يغطي عمولة رحلتك القادمة في {route}. يرجى تجديد اشتراكك.',
    },
    en: {
      title: 'Low balance warning',
      body: 'Your balance may not cover the commission for your upcoming trip to {route}. Please renew your subscription.',
    },
  },
  TRIP_TIME_CHANGED: {
    ar: {
      title: 'تم تغيير موعد الرحلة',
      body: 'موعد رحلتك {route} أصبح {time}.',
    },
    en: {
      title: 'Trip time updated',
      body: 'Your trip {route} now departs {time}.',
    },
  },
  TRIP_CANCELLED: {
    ar: {
      title: 'تم إلغاء الرحلة',
      body: 'تم إلغاء رحلتك {route}. تم استرداد الحجز الخاص بك.',
    },
    en: {
      title: 'Trip cancelled',
      body: 'Your trip {route} was cancelled. Your booking has been refunded.',
    },
  },
  TRIP_STARTED: {
    ar: {
      title: 'انطلقت رحلتك',
      body: 'انطلقت رحلتك. يمكنك متابعة موقع الرحلة {trip_id}.',
    },
    en: {
      title: 'Your trip has started',
      body: 'Your trip has started. You can track it live: {trip_id}.',
    },
  },
  VERIFICATION_APPROVED: {
    ar: {
      title: 'تم توثيق حسابك',
      body: 'تهانينا! تم توثيق {subject} بنجاح.',
    },
    en: {
      title: 'Account verified',
      body: 'Congratulations! Your {subject} has been verified.',
    },
  },
  VERIFICATION_REJECTED: {
    ar: {
      title: 'تعذر توثيق حسابك',
      body: 'تعذر توثيق {subject}. السبب: {reason}. يرجى إعادة إرسال المستندات الصحيحة.',
    },
    en: {
      title: 'Verification rejected',
      body: 'Your {subject} could not be verified. Reason: {reason}. Please resubmit the correct documents.',
    },
  },
  ADMIN_VERIFICATION_NEW: {
    ar: {
      title: 'طلب توثيق جديد',
      body: 'قام السائق {driver_name} بإرسال طلب توثيق جديد للمراجعة.',
    },
    en: {
      title: 'New verification request',
      body: 'Driver {driver_name} submitted a new verification request for review.',
    },
  },
  PENALTY_ISSUED: {
    ar: {
      title: 'تم تسجيل مخالفة',
      body: 'تم تسجيل {severity} بسبب: {reason}. يرجى مراجعة سياسة المنصة.',
    },
    en: {
      title: 'Penalty issued',
      body: 'A {severity} penalty has been recorded: {reason}. Please review the platform policy.',
    },
  },
  BOOKING_CONFIRMED_DRIVER: {
    ar: {
      title: 'حجز جديد على رحلتك',
      body: 'حجز المسافر {passenger} المقعد {seat_number} في رحلتك {route}.',
    },
    en: {
      title: 'New booking on your trip',
      body: '{passenger} booked seat {seat_number} on your trip {route}.',
    },
  },
  BOOKING_CONFIRMED_PASSENGER: {
    ar: {
      title: 'تم تأكيد حجزك',
      body: 'تم تأكيد حجزك برمز {reference_code}. رحلتك من {origin} إلى {destination}.',
    },
    en: {
      title: 'Booking confirmed',
      body: 'Your booking {reference_code} is confirmed. Trip from {origin} to {destination}.',
    },
  },
  BOOKING_CANCELLED_DRIVER: {
    ar: {
      title: 'إلغاء حجز',
      body: 'ألغى {passenger} حجز المقعد {seat_number} في رحلتك {route}.',
    },
    en: {
      title: 'Booking cancelled',
      body: '{passenger} cancelled seat {seat_number} on your trip {route}.',
    },
  },
  RIDE_REQUEST_NEW: {
    ar: {
      title: 'طلب رحلة جديد',
      body: 'مسافر يبحث عن رحلة من {origin} إلى {destination} بميزانية تصل إلى {budget}.',
    },
    en: {
      title: 'New ride request',
      body: 'A passenger needs a ride from {origin} to {destination} with budget up to {budget}.',
    },
  },
  OFFER_RECEIVED: {
    ar: {
      title: 'عرض جديد على طلبك',
      body: 'قدم السائق {driver} عرضاً بسعر {offered_fare} على طلب رحلتك.',
    },
    en: {
      title: 'New offer on your request',
      body: 'Driver {driver} offered {offered_fare} for your ride request.',
    },
  },
  OFFER_ACCEPTED: {
    ar: {
      title: 'قُبل عرضك',
      body: 'قبل المسافر عرضك. اتفقا على السعر النهائي ثم أرفق العرض برحلة.',
    },
    en: {
      title: 'Your offer was accepted',
      body: 'The passenger accepted your offer. Agree on the final price, then attach the offer to a trip.',
    },
  },
  OFFER_DECLINED: {
    ar: {
      title: 'رُفض عرضك',
      body: 'رفض المسافر عرضك على طلب الرحلة.',
    },
    en: {
      title: 'Offer declined',
      body: 'The passenger declined your offer.',
    },
  },
  OFFER_PRICE_AGREED: {
    ar: {
      title: 'تم الاتفاق على السعر',
      body: 'السعر النهائي المتفق عليه: {agreed_fare}. يمكنك الآن إرفاق العرض برحلتك.',
    },
    en: {
      title: 'Price agreed',
      body: 'Final agreed price: {agreed_fare}. You can now attach the offer to one of your trips.',
    },
  },
  BOOKING_CREATED_FROM_OFFER: {
    ar: {
      title: 'تم إنشاء حجزك',
      body: 'تم تأكيد حجزك برمز {reference_code} بعد إرفاق العرض بالرحلة.',
    },
    en: {
      title: 'Booking created',
      body: 'Your booking {reference_code} is confirmed after attaching the offer to a trip.',
    },
  },
  TRIP_COMPLETED_PROMPT: {
    ar: {
      title: 'انتهت الرحلة',
      body: 'انتهت رحلتكم {route}. لا تنسوا تقييم بعضكم البعض.',
    },
    en: {
      title: 'Trip completed',
      body: 'Your trip {route} has ended. Do not forget to rate each other.',
    },
  },
  SUPPORT_TICKET_NEW: {
    ar: {
      title: 'تذكرة دعم جديدة',
      body: 'تذكرة جديدة {reference_code}: {subject}.',
    },
    en: {
      title: 'New support ticket',
      body: 'New ticket {reference_code}: {subject}.',
    },
  },
  DELAY_REPORTED: {
    ar: {
      title: 'بلاغ تأخير',
      body: 'تم تسجيل تأخير {delay_minutes} دقيقة. السبب: {reason}.',
    },
    en: {
      title: 'Delay reported',
      body: 'A delay of {delay_minutes} minutes was reported. Reason: {reason}.',
    },
  },
};

function interpolate(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

/**
 * @param {object} user User row (or { id, phone, fcmToken, locale })
 * @param {string} type TEMPLATES key
 * @param {object} opts
 *   - channels: ['in_app'|'push'|'sms']
 *   - vars: interpolation variables
 *   - data: JSONB payload persisted with the in-app notification
 */
async function sendToUser(user, type, { channels = ['in_app'], vars = {}, data = {} } = {}) {
  const template = TEMPLATES[type];
  if (!template) {
    console.warn(`[notification] unknown type: ${type}`);
    return null;
  }

  const locale = (user && user.locale) || 'ar';
  const entry = template[locale] || template.en;

  const message = {
    type,
    title: interpolate(entry.title, vars),
    body: interpolate(entry.body, vars),
  };

  // Check user's notification settings to filter channels
  let allowedChannels = [...channels];
  try {
    const { NotificationSetting } = require('../../Models');
    const setting = await NotificationSetting.findOne({
      where: { userId: user.id, notificationType: type },
    });
    if (setting) {
      if (!setting.enabledInApp) allowedChannels = allowedChannels.filter((c) => c !== 'in_app');
      if (!setting.enabledPush) allowedChannels = allowedChannels.filter((c) => c !== 'push');
    }
  } catch (err) {
    // If settings lookup fails, proceed with original channels (fail-open)
    console.warn('[notification] settings check failed:', err.message);
  }

  const results = {};
  if (allowedChannels.includes('sms')) {
    try {
      await sms.send(user, message);
      results.sms = true;
    } catch (err) {
      results.sms = false;
      console.warn('[notification] sms failed:', err.message);
    }
  }
  if (allowedChannels.includes('push')) {
    try {
      await push.send(user, message, data);
      results.push = true;
    } catch (err) {
      results.push = false;
      console.warn('[notification] push failed:', err.message);
    }
  }
  if (allowedChannels.includes('in_app')) {
    try {
      results.in_app = await inApp.send(user, message, data);
    } catch (err) {
      results.in_app = null;
      console.warn('[notification] in_app failed:', err.message);
    }
  }

  return results;
}

/**
 * Notify every passenger booked on the given trips.
 */
async function notifyBookedPassengers(tripIds, type, { vars = {}, data = {}, channels = ['in_app', 'push'] } = {}) {
  if (!tripIds || tripIds.length === 0) return;

  try {
    const { Booking, Trip, User } = require('../../Models');
    const { Op } = require('sequelize');
    const { BOOKING_STATUS } = require('../../config/constants');

    const bookings = await Booking.findAll({
      where: {
        tripId: { [Op.in]: tripIds },
        status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] },
      },
      include: [
        { model: Trip, as: 'trip', attributes: ['id', 'originCity', 'destinationCity'] },
        { model: User, as: 'passenger', attributes: ['id', 'phone', 'fcmToken', 'locale'] },
      ],
    });

    const seen = new Set();
    for (const booking of bookings) {
      if (!booking.passenger || seen.has(booking.passenger.id)) continue;
      seen.add(booking.passenger.id);
      const route = booking.trip
        ? `${booking.trip.originCity} → ${booking.trip.destinationCity}`
        : '';
      await sendToUser(booking.passenger, type, {
        channels,
        vars: { route, ...vars },
        data,
      });
    }
  } catch (err) {
    console.warn('[notification] notifyBookedPassengers failed:', err.message);
  }
}

/**
 * Notify only CONFIRMED passengers on the given trips (best-effort, never
 * throws). Returns the number of distinct passengers notified. Used for
 * trip edits/cancellations — delivery is asynchronous and failures are
 * logged so the primary operation always succeeds.
 */
async function notifyConfirmedPassengers(tripIds, type, { vars = {}, data = {}, channels = ['in_app', 'push'] } = {}) {
  if (!tripIds || tripIds.length === 0) return 0;
  try {
    const { Booking, Trip, User } = require('../../Models');
    const { Op } = require('sequelize');
    const { BOOKING_STATUS } = require('../../config/constants');

    const bookings = await Booking.findAll({
      where: {
        tripId: { [Op.in]: Array.isArray(tripIds) ? tripIds : [tripIds] },
        status: BOOKING_STATUS.CONFIRMED,
      },
      include: [
        { model: Trip, as: 'trip', attributes: ['id', 'originCity', 'destinationCity'] },
        { model: User, as: 'passenger', attributes: ['id', 'phone', 'fcmToken', 'locale'] },
      ],
    });

    let count = 0;
    const seen = new Set();
    for (const booking of bookings) {
      if (!booking.passenger || seen.has(booking.passenger.id)) continue;
      seen.add(booking.passenger.id);
      const route = booking.trip
        ? `${booking.trip.originCity} → ${booking.trip.destinationCity}`
        : '';
      await sendToUser(booking.passenger, type, {
        channels,
        vars: { route, ...vars },
        data,
      });
      count += 1;
    }
    return count;
  } catch (err) {
    console.warn('[notification] notifyConfirmedPassengers failed:', err.message);
    return 0;
  }
}

/**
 * Paginated list of a user's own notifications.
 */
async function listForUser(userId, { unread = null, page = 1, limit = 20 } = {}) {
  const { Notification } = require('../../Models');
  const { Op } = require('sequelize');
  const where = { userId };
  if (unread === true) where.isRead = false;
  else if (unread === false) where.isRead = true;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdat', 'DESC']],
    offset: (page - 1) * limit,
    limit,
  });
  return { rows, count };
}

/**
 * Mark a user's notification as read. Throws NOT_FOUND when the
 * notification does not exist and FORBIDDEN when it belongs to someone else.
 */
async function markRead(userId, notificationId) {
  const { Notification } = require('../../Models');
  const { ApiErrors } = require('../../utils/ApiError');

  const notification = await Notification.findByPk(notificationId);
  if (!notification) throw ApiErrors.notFound('Notification not found');
  if (notification.userId !== userId) throw ApiErrors.forbidden('You can only mark your own notifications as read');

  if (!notification.isRead) {
    await notification.update({ isRead: true });
    auditService.track({
      action: 'notification.mark_read',
      resourceType: 'notification',
      resourceId: notification.id,
      actorId: userId,
      actorType: 'user',
    });
  }
  return notification;
}

module.exports = { sendToUser, notifyBookedPassengers, notifyConfirmedPassengers, listForUser, markRead };
