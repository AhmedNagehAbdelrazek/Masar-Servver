// Port of NOTIFICATION_TYPE / NOTIFICATION_CATEGORIES / NOTIFICATION_GROUP_LABELS /
// NOTIFICATION_TYPE_LABELS from Main Server/config/constants.ts.
export const NOTIFICATION_TYPE = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  TRIP_REMINDER: 'trip_reminder',
  TRIP_CANCELLED: 'trip_cancelled',
  DRIVER_OFFER: 'driver_offer',
  RIDE_REQUEST_REPLY: 'ride_request_reply',
  NEW_MESSAGE: 'new_message',
  RATING_RECEIVED: 'rating_received',
  DELAY_REPORT: 'delay_report',
  SOS_ALERT: 'sos_alert',
  ENFORCEMENT_ACTION: 'enforcement_action',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_PAYMENT: 'subscription_payment',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE);

export const NOTIFICATION_CATEGORIES = {
  bookings: {
    label: { ar: 'الحجوزات', en: 'Bookings' },
    types: [
      NOTIFICATION_TYPE.BOOKING_CONFIRMED,
      NOTIFICATION_TYPE.BOOKING_CANCELLED,
      NOTIFICATION_TYPE.NEW_MESSAGE,
    ],
  },
  trips: {
    label: { ar: 'الرحلات', en: 'Trips' },
    types: [
      NOTIFICATION_TYPE.TRIP_REMINDER,
      NOTIFICATION_TYPE.TRIP_CANCELLED,
      NOTIFICATION_TYPE.DELAY_REPORT,
    ],
  },
  subscriptions: {
    label: { ar: 'الباقات والاشتراك', en: 'Subscriptions' },
    types: [
      NOTIFICATION_TYPE.SUBSCRIPTION_PAYMENT,
      NOTIFICATION_TYPE.PAYMENT_CONFIRMED,
      NOTIFICATION_TYPE.SUBSCRIPTION_EXPIRING,
    ],
  },
} as const;

export const NOTIFICATION_GROUP_LABELS: Record<string, Record<string, string>> = {
  ar: {
    booking_confirmed: 'حجوزات جديدة',
    booking_cancelled: 'إلغاء الحجز',
    new_message: 'رسائل الركاب',
    trip_reminder: 'تذكير الرحلات القادمة',
    trip_cancelled: 'تحديثات الرحلة',
    delay_report: 'إشعارات عدم الحضور',
    subscription_payment: 'الباقات',
    payment_confirmed: 'اعتماد الدفع',
    subscription_expiring: 'انتهاء الباقة',
  },
  en: {
    booking_confirmed: 'New bookings',
    booking_cancelled: 'Booking cancelled',
    new_message: 'Passenger messages',
    trip_reminder: 'Upcoming trip reminders',
    trip_cancelled: 'Trip updates',
    delay_report: 'Absence alerts',
    subscription_payment: 'Plans',
    payment_confirmed: 'Payment confirmed',
    subscription_expiring: 'Plan expiring',
  },
};

export const NOTIFICATION_TYPE_LABELS: Record<string, Record<string, string>> = {
  ar: {
    booking_confirmed: 'تأكيد الحجز',
    booking_cancelled: 'إلغاء الحجز',
    trip_reminder: 'تذكير الرحلة',
    trip_cancelled: 'إلغاء الرحلة',
    driver_offer: 'عرض السائق',
    ride_request_reply: 'رد على طلب الرحلة',
    new_message: 'رسائل جديدة',
    rating_received: 'تقييم جديد',
    delay_report: 'بلاغ تأخير',
    sos_alert: 'تنبيه طوارئ',
    enforcement_action: 'إجراء إنضباطي',
    subscription_expiring: 'اشتراك ينتهي قريباً',
    subscription_payment: 'الباقات',
    payment_confirmed: 'اعتماد الدفع',
    system_announcement: 'إعلانات النظام',
  },
  en: {
    booking_confirmed: 'Booking confirmed',
    booking_cancelled: 'Booking cancelled',
    trip_reminder: 'Trip reminder',
    trip_cancelled: 'Trip cancelled',
    driver_offer: 'Driver offer',
    ride_request_reply: 'Ride request reply',
    new_message: 'New message',
    rating_received: 'Rating received',
    delay_report: 'Delay report',
    sos_alert: 'SOS alert',
    enforcement_action: 'Enforcement action',
    subscription_expiring: 'Subscription expiring',
    subscription_payment: 'Subscription payment',
    payment_confirmed: 'Payment confirmed',
    system_announcement: 'System announcement',
  },
};
