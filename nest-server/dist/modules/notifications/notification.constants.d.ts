export declare const NOTIFICATION_TYPE: {
    readonly BOOKING_CONFIRMED: "booking_confirmed";
    readonly BOOKING_CANCELLED: "booking_cancelled";
    readonly TRIP_REMINDER: "trip_reminder";
    readonly TRIP_CANCELLED: "trip_cancelled";
    readonly DRIVER_OFFER: "driver_offer";
    readonly RIDE_REQUEST_REPLY: "ride_request_reply";
    readonly NEW_MESSAGE: "new_message";
    readonly RATING_RECEIVED: "rating_received";
    readonly DELAY_REPORT: "delay_report";
    readonly SOS_ALERT: "sos_alert";
    readonly ENFORCEMENT_ACTION: "enforcement_action";
    readonly SUBSCRIPTION_EXPIRING: "subscription_expiring";
    readonly SUBSCRIPTION_PAYMENT: "subscription_payment";
    readonly PAYMENT_CONFIRMED: "payment_confirmed";
    readonly SYSTEM_ANNOUNCEMENT: "system_announcement";
};
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export declare const ALL_NOTIFICATION_TYPES: ("booking_confirmed" | "booking_cancelled" | "trip_reminder" | "trip_cancelled" | "driver_offer" | "ride_request_reply" | "new_message" | "rating_received" | "delay_report" | "sos_alert" | "enforcement_action" | "subscription_expiring" | "subscription_payment" | "payment_confirmed" | "system_announcement")[];
export declare const NOTIFICATION_CATEGORIES: {
    readonly bookings: {
        readonly label: {
            readonly ar: "الحجوزات";
            readonly en: "Bookings";
        };
        readonly types: readonly ["booking_confirmed", "booking_cancelled", "new_message"];
    };
    readonly trips: {
        readonly label: {
            readonly ar: "الرحلات";
            readonly en: "Trips";
        };
        readonly types: readonly ["trip_reminder", "trip_cancelled", "delay_report"];
    };
    readonly subscriptions: {
        readonly label: {
            readonly ar: "الباقات والاشتراك";
            readonly en: "Subscriptions";
        };
        readonly types: readonly ["subscription_payment", "payment_confirmed", "subscription_expiring"];
    };
};
export declare const NOTIFICATION_GROUP_LABELS: Record<string, Record<string, string>>;
export declare const NOTIFICATION_TYPE_LABELS: Record<string, Record<string, string>>;
