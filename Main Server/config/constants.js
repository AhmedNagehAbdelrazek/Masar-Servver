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

const SIGNUP_ROLES = [ROLES.PASSENGER, ROLES.RIDER];

// THE RESOURCES AND ACTIONS THAT THE ADMIN CAN GIVE THEM WITH EACH ROLE LIKE [{resource: 'trip', actions: ['create', 'read', 'update', 'delete']}]; 
// CAN BE GIVEN TO A ROLE OF RIDER, AS A PERMISSION LIST OF RIDER
const ADMIN_RESOURCES = [
  "trip",
  "reservatoin",

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
  PAGINATION,
  ADMIN_RESOURCES,
  ADMIN_ACTIONS,
};
