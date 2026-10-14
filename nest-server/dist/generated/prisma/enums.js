export const Role = {
    passenger: 'passenger',
    driver: 'driver',
    admin: 'admin',
    support: 'support',
    moderator: 'moderator'
};
export const UserStatus = {
    active: 'active',
    warned: 'warned',
    suspended: 'suspended',
    banned: 'banned'
};
export const Gender = {
    male: 'male',
    female: 'female'
};
export const PreferredGender = {
    male: 'male',
    female: 'female',
    any: 'any'
};
export const VehicleType = {
    sedan: 'sedan',
    suv: 'suv',
    van: 'van',
    bus: 'bus',
    hatchback: 'hatchback'
};
export const TripStatus = {
    published: 'published',
    full: 'full',
    in_progress: 'in_progress',
    ongoing: 'ongoing',
    completed: 'completed',
    cancelled: 'cancelled'
};
export const SeatType = {
    driver: 'driver',
    unavailable: 'unavailable',
    available: 'available'
};
export const GenderPreference = {
    all: 'all',
    women_only: 'women_only',
    men_only: 'men_only'
};
export const BookingStatus = {
    pending: 'pending',
    confirmed: 'confirmed',
    cancelled: 'cancelled',
    completed: 'completed',
    no_show: 'no_show'
};
export const PaymentStatus = {
    pending: 'pending',
    paid_cash: 'paid_cash',
    paid_other: 'paid_other',
    disputed: 'disputed'
};
export const RideRequestStatus = {
    open: 'open',
    offered: 'offered',
    accepted: 'accepted',
    expired: 'expired',
    cancelled: 'cancelled'
};
export const RequestOfferStatus = {
    sent: 'sent',
    accepted: 'accepted',
    declined: 'declined',
    expired: 'expired'
};
export const ComplaintStatus = {
    open: 'open',
    reviewing: 'reviewing',
    resolved: 'resolved',
    dismissed: 'dismissed'
};
export const PenaltyType = {
    warning: 'warning',
    suspension: 'suspension',
    ban: 'ban'
};
export const TicketStatus = {
    open: 'open',
    in_progress: 'in_progress',
    resolved: 'resolved',
    closed: 'closed'
};
export const TicketPriority = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    urgent: 'urgent'
};
export const SubscriptionTier = {
    free: 'free',
    pro_monthly: 'pro_monthly',
    pro_annual: 'pro_annual'
};
export const StopType = {
    pickup: 'pickup',
    dropoff: 'dropoff',
    both: 'both'
};
export const SubscriptionStatus = {
    pending_approval: 'pending_approval',
    active: 'active',
    rejected: 'rejected',
    cancelled: 'cancelled',
    expired: 'expired'
};
export const PaymentMethodType = {
    bank_account: 'bank_account',
    e_wallet: 'e_wallet',
    mobile_money: 'mobile_money'
};
export const VerificationStatus = {
    unverified: 'unverified',
    pending: 'pending',
    rejected: 'rejected',
    approved: 'approved'
};
export const SosStatus = {
    pending: 'pending',
    acknowledged: 'acknowledged',
    resolved: 'resolved',
    cancelled: 'cancelled'
};
export const DelayParty = {
    driver: 'driver',
    passenger: 'passenger'
};
export const AuditAction = {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};
export const DocumentDecision = {
    approved: 'approved',
    rejected: 'rejected'
};
export const DeletionStatus = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    cancelled: 'cancelled'
};
export const RouteStatus = {
    pending: 'pending',
    ready: 'ready',
    failed: 'failed'
};
export const PickupType = {
    stop: 'stop',
    custom: 'custom'
};
export const PickupStatus = {
    pending: 'pending',
    arrived: 'arrived',
    picked_up: 'picked_up',
    missed: 'missed'
};
//# sourceMappingURL=enums.js.map