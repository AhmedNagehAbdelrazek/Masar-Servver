const ROLES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin',
  SUPPORT: 'support',
  MODERATOR: 'moderator',
};

const USER_STATUS = {
  ACTIVE: 'active',
  WARNED: 'warned',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
};

const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  VAN: 'van',
  BUS: 'bus',
  HATCHBACK: 'hatchback',
};

const TRIP_STATUS = {
  PUBLISHED: 'published',
  FULL: 'full',
  IN_PROGRESS: 'in_progress',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const SEAT_TYPE = {
  DRIVER: 'driver',
  UNAVAILABLE: 'unavailable',
  AVAILABLE: 'available',
};

const GENDER_PREFERENCE = {
  ALL: 'all',
  WOMEN_ONLY: 'women_only',
  MEN_ONLY: 'men_only',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID_CASH: 'paid_cash',
  PAID_OTHER: 'paid_other',
  DISPUTED: 'disputed',
};

const RIDE_REQUEST_STATUS = {
  OPEN: 'open',
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const REQUEST_OFFER_STATUS = {
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
};

const COMPLAINT_STATUS = {
  OPEN: 'open',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

const PENALTY_TYPES = {
  WARNING: 'warning',
  SUSPENSION: 'suspension',
  BAN: 'ban',
};

const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

const SUBSCRIPTION_TIER = {
  FREE: 'free',
  PRO_MONTHLY: 'pro_monthly',
  PRO_ANNUAL: 'pro_annual',
};

const STOP_TYPE = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
  BOTH: 'both',
};

const SUBSCRIPTION_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const PLAN_STATUS = {
  MOST_REQUESTED: 'most_requested',
  FREQUENT: 'frequent',
  POPULAR: 'popular',
};

const PAYMENT_METHOD_TYPE = {
  BANK_ACCOUNT: 'bank_account',
  E_WALLET: 'e-wallet',
  MOBILE_MONEY: 'mobile_money',
};

const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  REJECTED: 'rejected',
  APPROVED: 'approved',
};

const VERIFICATION_FIELD_KEYS = [
  'national_id',
  'license',
  'personal_photo',
  'vehicle_registration',
  'vehicle_photo',
  'vehicle_details',
  'personal_details',
];

const FREE_OFFER_TYPE = {
  TRIPS: 'trips',
  CREDIT: 'credit',
};

const PENALTY_SEVERITY = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major',
};

const PENALTY_CATEGORY = {
  GENERAL: 'general',
  TRIP_CANCELLATION: 'trip_cancellation',
  NO_SHOW: 'no_show',
  MISCONDUCT: 'misconduct',
  FRAUD: 'fraud',
};

const CANCELLATION_ESCALATION = {
  WARNING_MIN: 3,
  WARNING_MAX: 4,
  SUSPENSION_7D_MIN: 5,
  SUSPENSION_7D_MAX: 6,
  SUSPENSION_30D_MIN: 7,
};

const NOTIFICATION_TYPE = {
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
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
};

const NOTIFICATION_TYPE_LABELS = {
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
    system_announcement: 'System announcement',
  },
};

const SIGNUP_ROLES = [ROLES.PASSENGER, ROLES.DRIVER];

// How long a ride-request offer stays decidable before it auto-expires.
const REQUEST_OFFER_TTL_HOURS = 24;

// THE RESOURCES AND ACTIONS THAT THE ADMIN CAN GIVE THEM WITH EACH ROLE LIKE [{resource: 'trip', actions: ['create', 'read', 'update', 'delete']}]; 
// CAN BE GIVEN TO A ROLE OF RIDER, AS A PERMISSION LIST OF RIDER
const ADMIN_RESOURCES = [
  "trip",
  "reservation",

];

const ADMIN_ACTIONS = ['create', 'read', 'update', 'delete'];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

const TEST_PHONES = [
  '+962700000000',
  '+962711111111',
];
const TEST_OTP = '000000';

module.exports = {
  ROLES,
  USER_STATUS,
  GENDER,
  TEST_PHONES,
  TEST_OTP,
  VEHICLE_TYPES,
  TRIP_STATUS,
  SEAT_TYPE,
  GENDER_PREFERENCE,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  RIDE_REQUEST_STATUS,
  REQUEST_OFFER_STATUS,
  COMPLAINT_STATUS,
  PENALTY_TYPES,
  TICKET_STATUS,
  TICKET_PRIORITY,
  SUBSCRIPTION_TIER,
  STOP_TYPE,
  SUBSCRIPTION_STATUS,
  PLAN_STATUS,
  PAYMENT_METHOD_TYPE,
  VERIFICATION_STATUS,
  VERIFICATION_FIELD_KEYS,
  FREE_OFFER_TYPE,
  PENALTY_SEVERITY,
  PENALTY_CATEGORY,
  CANCELLATION_ESCALATION,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_LABELS,
  PAGINATION,
  ADMIN_RESOURCES,
  ADMIN_ACTIONS,
  REQUEST_OFFER_TTL_HOURS,
};
