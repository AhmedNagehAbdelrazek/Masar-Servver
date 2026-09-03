export const ROLES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin',
  SUPPORT: 'support',
  MODERATOR: 'moderator',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  ACTIVE: 'active',
  WARNED: 'warned',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
} as const;
export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  VAN: 'van',
  BUS: 'bus',
  HATCHBACK: 'hatchback',
} as const;
export type VehicleType = (typeof VEHICLE_TYPES)[keyof typeof VEHICLE_TYPES];

export const TRIP_STATUS = {
  PUBLISHED: 'published',
  FULL: 'full',
  IN_PROGRESS: 'in_progress',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

export const SEAT_TYPE = {
  DRIVER: 'driver',
  UNAVAILABLE: 'unavailable',
  AVAILABLE: 'available',
} as const;
export type SeatType = (typeof SEAT_TYPE)[keyof typeof SEAT_TYPE];

export const GENDER_PREFERENCE = {
  ALL: 'all',
  WOMEN_ONLY: 'women_only',
  MEN_ONLY: 'men_only',
} as const;
export type GenderPreference = (typeof GENDER_PREFERENCE)[keyof typeof GENDER_PREFERENCE];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID_CASH: 'paid_cash',
  PAID_OTHER: 'paid_other',
  DISPUTED: 'disputed',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const RIDE_REQUEST_STATUS = {
  OPEN: 'open',
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;
export type RideRequestStatus = (typeof RIDE_REQUEST_STATUS)[keyof typeof RIDE_REQUEST_STATUS];

export const REQUEST_OFFER_STATUS = {
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;
export type RequestOfferStatus = (typeof REQUEST_OFFER_STATUS)[keyof typeof REQUEST_OFFER_STATUS];

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUS)[keyof typeof COMPLAINT_STATUS];

export const PENALTY_TYPES = {
  WARNING: 'warning',
  SUSPENSION: 'suspension',
  BAN: 'ban',
} as const;
export type PenaltyType = (typeof PENALTY_TYPES)[keyof typeof PENALTY_TYPES];

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export const SUBSCRIPTION_TIER = {
  FREE: 'free',
  PRO_MONTHLY: 'pro_monthly',
  PRO_ANNUAL: 'pro_annual',
} as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

export const STOP_TYPE = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
  BOTH: 'both',
} as const;
export type StopType = (typeof STOP_TYPE)[keyof typeof STOP_TYPE];

export const SUBSCRIPTION_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const PLAN_STATUS = {
  MOST_REQUESTED: 'most_requested',
  FREQUENT: 'frequent',
  POPULAR: 'popular',
} as const;
export type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

export const PAYMENT_METHOD_TYPE = {
  BANK_ACCOUNT: 'bank_account',
  E_WALLET: 'e-wallet',
  MOBILE_MONEY: 'mobile_money',
} as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPE)[keyof typeof PAYMENT_METHOD_TYPE];

export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  REJECTED: 'rejected',
  APPROVED: 'approved',
} as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const VERIFICATION_FIELD_KEYS = [
  'national_id',
  'license',
  'personal_photo',
  'vehicle_registration',
  'vehicle_photo',
  'vehicle_details',
  'personal_details',
] as const;
export type VerificationFieldKey = (typeof VERIFICATION_FIELD_KEYS)[number];

export const FREE_OFFER_TYPE = {
  TRIPS: 'trips',
  CREDIT: 'credit',
} as const;
export type FreeOfferType = (typeof FREE_OFFER_TYPE)[keyof typeof FREE_OFFER_TYPE];

export const SOS_STATUS = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;
export type SosStatus = (typeof SOS_STATUS)[keyof typeof SOS_STATUS];

export const SOS_URGENCY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type SosUrgency = (typeof SOS_URGENCY)[keyof typeof SOS_URGENCY];

export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system',
} as const;
export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export const PENALTY_SEVERITY = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major',
} as const;
export type PenaltySeverity = (typeof PENALTY_SEVERITY)[keyof typeof PENALTY_SEVERITY];

export const PENALTY_CATEGORY = {
  GENERAL: 'general',
  TRIP_CANCELLATION: 'trip_cancellation',
  NO_SHOW: 'no_show',
  MISCONDUCT: 'misconduct',
  FRAUD: 'fraud',
} as const;
export type PenaltyCategory = (typeof PENALTY_CATEGORY)[keyof typeof PENALTY_CATEGORY];

export const CANCELLATION_ESCALATION = {
  WARNING_MIN: 3,
  WARNING_MAX: 4,
  SUSPENSION_7D_MIN: 5,
  SUSPENSION_7D_MAX: 6,
  SUSPENSION_30D_MIN: 7,
} as const;
export type CancellationEscalation = typeof CANCELLATION_ESCALATION;

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

// Grouped notification settings categories for the driver settings screen
// (spec 010). Each category lists its member NOTIFICATION_TYPE values.
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

// Screen labels for grouped notification settings per type (spec 010).
export const NOTIFICATION_GROUP_LABELS = {
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
} as const;

export const NOTIFICATION_TYPE_LABELS = {
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
} as const;

// How long a ride-request offer stays decidable before it auto-expires.
export const REQUEST_OFFER_TTL_HOURS: number = 24;

// THE RESOURCES AND ACTIONS THAT THE ADMIN CAN GIVE THEM WITH EACH ROLE LIKE [{resource: 'trip', actions: ['create', 'read', 'update', 'delete']}];
// CAN BE GIVEN TO A ROLE OF RIDER, AS A PERMISSION LIST OF RIDER
export const ADMIN_RESOURCES: readonly string[] = ["trip", "reservation"] as const;

export const ADMIN_ACTIONS: readonly string[] = ['create', 'read', 'update', 'delete'] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TEST_PHONES: readonly string[] = ['+962700000000', '+962711111111'] as const;
export const TEST_OTP: string = '000000';
