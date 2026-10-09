export declare const Role: {
    readonly passenger: "passenger";
    readonly driver: "driver";
    readonly admin: "admin";
    readonly support: "support";
    readonly moderator: "moderator";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const UserStatus: {
    readonly active: "active";
    readonly warned: "warned";
    readonly suspended: "suspended";
    readonly banned: "banned";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const Gender: {
    readonly male: "male";
    readonly female: "female";
};
export type Gender = (typeof Gender)[keyof typeof Gender];
export declare const PreferredGender: {
    readonly male: "male";
    readonly female: "female";
    readonly any: "any";
};
export type PreferredGender = (typeof PreferredGender)[keyof typeof PreferredGender];
export declare const VehicleType: {
    readonly sedan: "sedan";
    readonly suv: "suv";
    readonly van: "van";
    readonly bus: "bus";
    readonly hatchback: "hatchback";
};
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];
export declare const TripStatus: {
    readonly published: "published";
    readonly full: "full";
    readonly in_progress: "in_progress";
    readonly ongoing: "ongoing";
    readonly completed: "completed";
    readonly cancelled: "cancelled";
};
export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];
export declare const SeatType: {
    readonly driver: "driver";
    readonly unavailable: "unavailable";
    readonly available: "available";
};
export type SeatType = (typeof SeatType)[keyof typeof SeatType];
export declare const GenderPreference: {
    readonly all: "all";
    readonly women_only: "women_only";
    readonly men_only: "men_only";
};
export type GenderPreference = (typeof GenderPreference)[keyof typeof GenderPreference];
export declare const BookingStatus: {
    readonly pending: "pending";
    readonly confirmed: "confirmed";
    readonly cancelled: "cancelled";
    readonly completed: "completed";
    readonly no_show: "no_show";
};
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
export declare const PaymentStatus: {
    readonly pending: "pending";
    readonly paid_cash: "paid_cash";
    readonly paid_other: "paid_other";
    readonly disputed: "disputed";
};
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export declare const RideRequestStatus: {
    readonly open: "open";
    readonly offered: "offered";
    readonly accepted: "accepted";
    readonly expired: "expired";
    readonly cancelled: "cancelled";
};
export type RideRequestStatus = (typeof RideRequestStatus)[keyof typeof RideRequestStatus];
export declare const RequestOfferStatus: {
    readonly sent: "sent";
    readonly accepted: "accepted";
    readonly declined: "declined";
    readonly expired: "expired";
};
export type RequestOfferStatus = (typeof RequestOfferStatus)[keyof typeof RequestOfferStatus];
export declare const ComplaintStatus: {
    readonly open: "open";
    readonly reviewing: "reviewing";
    readonly resolved: "resolved";
    readonly dismissed: "dismissed";
};
export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];
export declare const PenaltyType: {
    readonly warning: "warning";
    readonly suspension: "suspension";
    readonly ban: "ban";
};
export type PenaltyType = (typeof PenaltyType)[keyof typeof PenaltyType];
export declare const TicketStatus: {
    readonly open: "open";
    readonly in_progress: "in_progress";
    readonly resolved: "resolved";
    readonly closed: "closed";
};
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
export declare const TicketPriority: {
    readonly low: "low";
    readonly medium: "medium";
    readonly high: "high";
    readonly urgent: "urgent";
};
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];
export declare const SubscriptionTier: {
    readonly free: "free";
    readonly pro_monthly: "pro_monthly";
    readonly pro_annual: "pro_annual";
};
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];
export declare const StopType: {
    readonly pickup: "pickup";
    readonly dropoff: "dropoff";
    readonly both: "both";
};
export type StopType = (typeof StopType)[keyof typeof StopType];
export declare const SubscriptionStatus: {
    readonly pending_approval: "pending_approval";
    readonly active: "active";
    readonly rejected: "rejected";
    readonly cancelled: "cancelled";
    readonly expired: "expired";
};
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export declare const PaymentMethodType: {
    readonly bank_account: "bank_account";
    readonly e_wallet: "e_wallet";
    readonly mobile_money: "mobile_money";
};
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];
export declare const VerificationStatus: {
    readonly unverified: "unverified";
    readonly pending: "pending";
    readonly rejected: "rejected";
    readonly approved: "approved";
};
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
export declare const SosStatus: {
    readonly pending: "pending";
    readonly acknowledged: "acknowledged";
    readonly resolved: "resolved";
    readonly cancelled: "cancelled";
};
export type SosStatus = (typeof SosStatus)[keyof typeof SosStatus];
export declare const DelayParty: {
    readonly driver: "driver";
    readonly passenger: "passenger";
};
export type DelayParty = (typeof DelayParty)[keyof typeof DelayParty];
export declare const AuditAction: {
    readonly INSERT: "INSERT";
    readonly UPDATE: "UPDATE";
    readonly DELETE: "DELETE";
};
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export declare const DocumentDecision: {
    readonly approved: "approved";
    readonly rejected: "rejected";
};
export type DocumentDecision = (typeof DocumentDecision)[keyof typeof DocumentDecision];
export declare const DeletionStatus: {
    readonly pending: "pending";
    readonly approved: "approved";
    readonly rejected: "rejected";
    readonly cancelled: "cancelled";
};
export type DeletionStatus = (typeof DeletionStatus)[keyof typeof DeletionStatus];
export declare const RouteStatus: {
    readonly pending: "pending";
    readonly ready: "ready";
    readonly failed: "failed";
};
export type RouteStatus = (typeof RouteStatus)[keyof typeof RouteStatus];
export declare const PickupType: {
    readonly stop: "stop";
    readonly custom: "custom";
};
export type PickupType = (typeof PickupType)[keyof typeof PickupType];
export declare const PickupStatus: {
    readonly pending: "pending";
    readonly arrived: "arrived";
    readonly picked_up: "picked_up";
    readonly missed: "missed";
};
export type PickupStatus = (typeof PickupStatus)[keyof typeof PickupStatus];
