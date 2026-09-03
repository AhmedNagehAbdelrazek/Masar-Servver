"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_OTP = exports.TEST_PHONES = exports.PAGINATION = exports.ADMIN_ACTIONS = exports.ADMIN_RESOURCES = exports.REQUEST_OFFER_TTL_HOURS = exports.NOTIFICATION_TYPE_LABELS = exports.NOTIFICATION_GROUP_LABELS = exports.NOTIFICATION_CATEGORIES = exports.NOTIFICATION_TYPE = exports.CANCELLATION_ESCALATION = exports.PENALTY_CATEGORY = exports.PENALTY_SEVERITY = exports.MESSAGE_TYPE = exports.SOS_URGENCY = exports.SOS_STATUS = exports.FREE_OFFER_TYPE = exports.VERIFICATION_FIELD_KEYS = exports.VERIFICATION_STATUS = exports.PAYMENT_METHOD_TYPE = exports.PLAN_STATUS = exports.SUBSCRIPTION_STATUS = exports.STOP_TYPE = exports.SUBSCRIPTION_TIER = exports.TICKET_PRIORITY = exports.TICKET_STATUS = exports.PENALTY_TYPES = exports.COMPLAINT_STATUS = exports.REQUEST_OFFER_STATUS = exports.RIDE_REQUEST_STATUS = exports.PAYMENT_STATUS = exports.BOOKING_STATUS = exports.GENDER_PREFERENCE = exports.SEAT_TYPE = exports.TRIP_STATUS = exports.VEHICLE_TYPES = exports.GENDER = exports.USER_STATUS = exports.ROLES = void 0;
exports.ROLES = {
    PASSENGER: 'passenger',
    DRIVER: 'driver',
    ADMIN: 'admin',
    SUPPORT: 'support',
    MODERATOR: 'moderator',
};
exports.USER_STATUS = {
    ACTIVE: 'active',
    WARNED: 'warned',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
};
exports.GENDER = {
    MALE: 'male',
    FEMALE: 'female',
};
exports.VEHICLE_TYPES = {
    SEDAN: 'sedan',
    SUV: 'suv',
    VAN: 'van',
    BUS: 'bus',
    HATCHBACK: 'hatchback',
};
exports.TRIP_STATUS = {
    PUBLISHED: 'published',
    FULL: 'full',
    IN_PROGRESS: 'in_progress',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};
exports.SEAT_TYPE = {
    DRIVER: 'driver',
    UNAVAILABLE: 'unavailable',
    AVAILABLE: 'available',
};
exports.GENDER_PREFERENCE = {
    ALL: 'all',
    WOMEN_ONLY: 'women_only',
    MEN_ONLY: 'men_only',
};
exports.BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    NO_SHOW: 'no_show',
};
exports.PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID_CASH: 'paid_cash',
    PAID_OTHER: 'paid_other',
    DISPUTED: 'disputed',
};
exports.RIDE_REQUEST_STATUS = {
    OPEN: 'open',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};
exports.REQUEST_OFFER_STATUS = {
    SENT: 'sent',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    EXPIRED: 'expired',
};
exports.COMPLAINT_STATUS = {
    OPEN: 'open',
    REVIEWING: 'reviewing',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed',
};
exports.PENALTY_TYPES = {
    WARNING: 'warning',
    SUSPENSION: 'suspension',
    BAN: 'ban',
};
exports.TICKET_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
};
exports.TICKET_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
};
exports.SUBSCRIPTION_TIER = {
    FREE: 'free',
    PRO_MONTHLY: 'pro_monthly',
    PRO_ANNUAL: 'pro_annual',
};
exports.STOP_TYPE = {
    PICKUP: 'pickup',
    DROPOFF: 'dropoff',
    BOTH: 'both',
};
exports.SUBSCRIPTION_STATUS = {
    PENDING_APPROVAL: 'pending_approval',
    ACTIVE: 'active',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
};
exports.PLAN_STATUS = {
    MOST_REQUESTED: 'most_requested',
    FREQUENT: 'frequent',
    POPULAR: 'popular',
};
exports.PAYMENT_METHOD_TYPE = {
    BANK_ACCOUNT: 'bank_account',
    E_WALLET: 'e-wallet',
    MOBILE_MONEY: 'mobile_money',
};
exports.VERIFICATION_STATUS = {
    UNVERIFIED: 'unverified',
    PENDING: 'pending',
    REJECTED: 'rejected',
    APPROVED: 'approved',
};
exports.VERIFICATION_FIELD_KEYS = [
    'national_id',
    'license',
    'personal_photo',
    'vehicle_registration',
    'vehicle_photo',
    'vehicle_details',
    'personal_details',
];
exports.FREE_OFFER_TYPE = {
    TRIPS: 'trips',
    CREDIT: 'credit',
};
exports.SOS_STATUS = {
    PENDING: 'pending',
    ACKNOWLEDGED: 'acknowledged',
    RESOLVED: 'resolved',
    CANCELLED: 'cancelled',
};
exports.SOS_URGENCY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};
exports.MESSAGE_TYPE = {
    TEXT: 'text',
    IMAGE: 'image',
    SYSTEM: 'system',
};
exports.PENALTY_SEVERITY = {
    MINOR: 'minor',
    MODERATE: 'moderate',
    MAJOR: 'major',
};
exports.PENALTY_CATEGORY = {
    GENERAL: 'general',
    TRIP_CANCELLATION: 'trip_cancellation',
    NO_SHOW: 'no_show',
    MISCONDUCT: 'misconduct',
    FRAUD: 'fraud',
};
exports.CANCELLATION_ESCALATION = {
    WARNING_MIN: 3,
    WARNING_MAX: 4,
    SUSPENSION_7D_MIN: 5,
    SUSPENSION_7D_MAX: 6,
    SUSPENSION_30D_MIN: 7,
};
exports.NOTIFICATION_TYPE = {
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
};
// Grouped notification settings categories for the driver settings screen
// (spec 010). Each category lists its member NOTIFICATION_TYPE values.
exports.NOTIFICATION_CATEGORIES = {
    bookings: {
        label: { ar: 'الحجوزات', en: 'Bookings' },
        types: [
            exports.NOTIFICATION_TYPE.BOOKING_CONFIRMED,
            exports.NOTIFICATION_TYPE.BOOKING_CANCELLED,
            exports.NOTIFICATION_TYPE.NEW_MESSAGE,
        ],
    },
    trips: {
        label: { ar: 'الرحلات', en: 'Trips' },
        types: [
            exports.NOTIFICATION_TYPE.TRIP_REMINDER,
            exports.NOTIFICATION_TYPE.TRIP_CANCELLED,
            exports.NOTIFICATION_TYPE.DELAY_REPORT,
        ],
    },
    subscriptions: {
        label: { ar: 'الباقات والاشتراك', en: 'Subscriptions' },
        types: [
            exports.NOTIFICATION_TYPE.SUBSCRIPTION_PAYMENT,
            exports.NOTIFICATION_TYPE.PAYMENT_CONFIRMED,
            exports.NOTIFICATION_TYPE.SUBSCRIPTION_EXPIRING,
        ],
    },
};
// Screen labels for grouped notification settings per type (spec 010).
exports.NOTIFICATION_GROUP_LABELS = {
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
exports.NOTIFICATION_TYPE_LABELS = {
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
// How long a ride-request offer stays decidable before it auto-expires.
exports.REQUEST_OFFER_TTL_HOURS = 24;
// THE RESOURCES AND ACTIONS THAT THE ADMIN CAN GIVE THEM WITH EACH ROLE LIKE [{resource: 'trip', actions: ['create', 'read', 'update', 'delete']}];
// CAN BE GIVEN TO A ROLE OF RIDER, AS A PERMISSION LIST OF RIDER
exports.ADMIN_RESOURCES = ["trip", "reservation"];
exports.ADMIN_ACTIONS = ['create', 'read', 'update', 'delete'];
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
exports.TEST_PHONES = ['+962700000000', '+962711111111'];
exports.TEST_OTP = '000000';
//# sourceMappingURL=constants.js.map