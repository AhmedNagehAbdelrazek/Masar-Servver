export const TEMPLATES = {
    SUBSCRIPTION_SUBMITTED: {
        ar: { title: 'تم استلام طلب الاشتراك', body: 'طلب الاشتراك الخاص بك قيد مراجعة الإدارة وسيتم إشعارك عند التفعيل.' },
        en: { title: 'Subscription submitted', body: 'Your subscription request is pending admin review. You will be notified once it is activated.' },
    },
    SUBSCRIPTION_APPROVED: {
        ar: { title: 'تم تفعيل الاشتراك', body: 'تم تفعيل خطة {plan}. رصيدك الحالي: {balance}.' },
        en: { title: 'Subscription approved', body: 'Your {plan} plan is now active. Current balance: {balance}.' },
    },
    SUBSCRIPTION_REJECTED: {
        ar: { title: 'تم رفض طلب الاشتراك', body: 'عذراً، تم رفض طلب الاشتراك الخاص بك. السبب: {reason}' },
        en: { title: 'Subscription rejected', body: 'Your subscription request was rejected. Reason: {reason}' },
    },
    INSUFFICIENT_BALANCE_START: {
        ar: { title: 'رصيد غير كافٍ', body: 'لا يمكن بدء الرحلة لأن رصيدك لا يغطي عمولة المقعد. يرجى الاشتراك في خطة.' },
        en: { title: 'Insufficient balance', body: 'Your trip cannot be started because your balance is insufficient. Please subscribe to a plan.' },
    },
    DEBT: {
        ar: { title: 'رصيدك بالسالب', body: 'رصيدك الحالي: {balance}. تم إيقاف نشر رحلاتك حتى يتم تغطية الرصيد عبر اشتراك جديد.' },
        en: { title: 'Negative balance', body: 'Your current balance is {balance}. Your trips are unpublished until you top up with a new subscription.' },
    },
    PLAN_EXPIRING_SOON: {
        ar: { title: 'اشتراكك على وشك الانتهاء', body: 'تنتهي خطة {plan} خلال 24 ساعة. يرجى التجديد لتجنب إيقاف رحلاتك.' },
        en: { title: 'Your plan expires soon', body: 'Your {plan} plan expires within 24 hours. Renew to avoid your trips being unpublished.' },
    },
    PLAN_EXPIRED: {
        ar: { title: 'انتهى اشتراكك', body: 'انتهت خطة {plan}. تم إيقاف نشر رحلاتك حتى تفعيل اشتراك جديد.' },
        en: { title: 'Your plan expired', body: 'Your {plan} plan has expired. Your trips are unpublished until a new subscription is activated.' },
    },
    TRIP_UNAVAILABLE: {
        ar: { title: 'الرحلة غير متاحة مؤقتاً', body: 'رحلة {route} غير متاحة مؤقتاً. سيتم إشعارك عند عودتها.' },
        en: { title: 'Trip temporarily unavailable', body: 'Your trip {route} is temporarily unavailable. You will be notified when it is republished.' },
    },
    TRIP_REPUBLISHED: {
        ar: { title: 'الرحلة متاحة من جديد', body: 'رحلة {route} متاحة من جديد.' },
        en: { title: 'Trip republished', body: 'Your trip {route} is available again.' },
    },
    LOW_BALANCE_WARNING: {
        ar: { title: 'تحذير رصيد منخفض', body: 'رصيدك قد لا يغطي عمولة رحلتك القادمة في {route}. يرجى تجديد اشتراكك.' },
        en: { title: 'Low balance warning', body: 'Your balance may not cover the commission for your upcoming trip to {route}. Please renew your subscription.' },
    },
    TRIP_TIME_CHANGED: {
        ar: { title: 'تم تغيير موعد الرحلة', body: 'موعد رحلتك {route} أصبح {time}.' },
        en: { title: 'Trip time updated', body: 'Your trip {route} now departs {time}.' },
    },
    TRIP_CANCELLED: {
        ar: { title: 'تم إلغاء الرحلة', body: 'تم إلغاء رحلتك {route}. تم استرداد الحجز الخاص بك.' },
        en: { title: 'Trip cancelled', body: 'Your trip {route} was cancelled. Your booking has been refunded.' },
    },
    TRIP_STARTED: {
        ar: { title: 'انطلقت رحلتك', body: 'انطلقت رحلتك. يمكنك متابعة موقع الرحلة {trip_id}.' },
        en: { title: 'Your trip has started', body: 'Your trip has started. You can track it live: {trip_id}.' },
    },
    VERIFICATION_APPROVED: {
        ar: { title: 'تم توثيق حسابك', body: 'تهانينا! تم توثيق {subject} بنجاح.' },
        en: { title: 'Account verified', body: 'Congratulations! Your {subject} has been verified.' },
    },
    VERIFICATION_REJECTED: {
        ar: { title: 'تعذر توثيق حسابك', body: 'تعذر توثيق {subject}. السبب: {reason}. يرجى إعادة إرسال المستندات الصحيحة.' },
        en: { title: 'Verification rejected', body: 'Your {subject} could not be verified. Reason: {reason}. Please resubmit the correct documents.' },
    },
    TICKET_RESOLVED: {
        ar: { title: 'تم حل تذكرتك', body: 'تم حل تذكرة الدعم الخاصة بك: {ticket}.' },
        en: { title: 'Support ticket resolved', body: 'Your support ticket has been resolved: {ticket}.' },
    },
    ADMIN_VERIFICATION_NEW: {
        ar: { title: 'طلب توثيق جديد', body: 'قام السائق {driver_name} بإرسال طلب توثيق جديد للمراجعة.' },
        en: { title: 'New verification request', body: 'Driver {driver_name} submitted a new verification request for review.' },
    },
    PENALTY_ISSUED: {
        ar: { title: 'تم تسجيل مخالفة', body: 'تم تسجيل {severity} بسبب: {reason}. يرجى مراجعة سياسة المنصة.' },
        en: { title: 'Penalty issued', body: 'A {severity} penalty has been recorded: {reason}. Please review the platform policy.' },
    },
    BOOKING_CONFIRMED_DRIVER: {
        ar: { title: 'حجز جديد على رحلتك', body: 'حجز المسافر {passenger} المقعد {seat_number} في رحلتك {route}.' },
        en: { title: 'New booking on your trip', body: '{passenger} booked seat {seat_number} on your trip {route}.' },
    },
    BOOKING_CONFIRMED_PASSENGER: {
        ar: { title: 'تم تأكيد حجزك', body: 'تم تأكيد حجزك برمز {reference_code}. رحلتك من {origin} إلى {destination}.' },
        en: { title: 'Booking confirmed', body: 'Your booking {reference_code} is confirmed. Trip from {origin} to {destination}.' },
    },
    BOOKING_CANCELLED_DRIVER: {
        ar: { title: 'إلغاء حجز', body: 'ألغى {passenger} حجز المقعد {seat_number} في رحلتك {route}.' },
        en: { title: 'Booking cancelled', body: '{passenger} cancelled seat {seat_number} on your trip {route}.' },
    },
    RIDE_REQUEST_NEW: {
        ar: { title: 'طلب رحلة جديد', body: 'مسافر يبحث عن رحلة من {origin} إلى {destination} بميزانية تصل إلى {budget}.' },
        en: { title: 'New ride request', body: 'A passenger needs a ride from {origin} to {destination} with budget up to {budget}.' },
    },
    OFFER_RECEIVED: {
        ar: { title: 'عرض جديد على طلبك', body: 'قدم السائق {driver} عرضاً بسعر {offered_fare} على طلب رحلتك.' },
        en: { title: 'New offer on your request', body: 'Driver {driver} offered {offered_fare} for your ride request.' },
    },
    OFFER_ACCEPTED: {
        ar: { title: 'قُبل عرضك', body: 'قبل المسافر عرضك. اتفقا على السعر النهائي ثم أرفق العرض برحلة.' },
        en: { title: 'Your offer was accepted', body: 'The passenger accepted your offer. Agree on the final price, then attach the offer to a trip.' },
    },
    OFFER_DECLINED: {
        ar: { title: 'رُفض عرضك', body: 'رفض المسافر عرضك على طلب الرحلة.' },
        en: { title: 'Offer declined', body: 'The passenger declined your offer.' },
    },
    OFFER_PRICE_AGREED: {
        ar: { title: 'تم الاتفاق على السعر', body: 'السعر النهائي المتفق عليه: {agreed_fare}. يمكنك الآن إرفاق العرض برحلتك.' },
        en: { title: 'Price agreed', body: 'Final agreed price: {agreed_fare}. You can now attach the offer to one of your trips.' },
    },
    BOOKING_CREATED_FROM_OFFER: {
        ar: { title: 'تم إنشاء حجزك', body: 'تم تأكيد حجزك برمز {reference_code} بعد إرفاق العرض بالرحلة.' },
        en: { title: 'Booking created', body: 'Your booking {reference_code} is confirmed after attaching the offer to a trip.' },
    },
    TRIP_COMPLETED_PROMPT: {
        ar: { title: 'انتهت الرحلة', body: 'انتهت رحلتكم {route}. لا تنسوا تقييم بعضكم البعض.' },
        en: { title: 'Trip completed', body: 'Your trip {route} has ended. Do not forget to rate each other.' },
    },
    SUPPORT_TICKET_NEW: {
        ar: { title: 'تذكرة دعم جديدة', body: 'تذكرة جديدة {reference_code}: {subject}.' },
        en: { title: 'New support ticket', body: 'New ticket {reference_code}: {subject}.' },
    },
    DELAY_REPORTED: {
        ar: { title: 'بلاغ تأخير', body: 'تم تسجيل تأخير {delay_minutes} دقائق. السبب: {reason}.' },
        en: { title: 'Delay reported', body: 'A delay of {delay_minutes} minutes was reported. Reason: {reason}.' },
    },
    DELETION_REQUESTED: {
        ar: { title: 'تم استلام طلب حذف الحساب', body: 'تم استلام طلب حذف حسابك وسيتم مراجعته خلال خمسة أيام عمل. يمكنك إلغاء الطلب قبل إتمام المراجعة.' },
        en: { title: 'Account deletion request received', body: 'Your account deletion request has been received and will be reviewed within 5 business days. You may cancel it until the review completes.' },
    },
    ADMIN_DELETION_NEW: {
        ar: { title: 'طلب حذف حساب جديد', body: 'السائق {driver_name} ({phone}) قدّم طلب حذف حساب للمراجعة.' },
        en: { title: 'New account deletion request', body: 'Driver {driver_name} ({phone}) submitted an account deletion request for review.' },
    },
    DELETION_REQUEST_CANCELLED: {
        ar: { title: 'إلغاء طلب حذف الحساب', body: 'تم إلغاء طلب حذف حسابك بنجاح. حسابك يعود إلى حالته السابقة.' },
        en: { title: 'Account deletion request cancelled', body: 'Your account deletion request has been cancelled. Your account returns to its previous state.' },
    },
    PICKUP_ADDED: {
        ar: { title: 'نقطة صعود جديدة', body: 'أضاف {passenger} نقطة صعود جديدة إلى رحلتك {route}.' },
        en: { title: 'New pickup', body: '{passenger} added a new pickup to your trip {route}.' },
    },
    PICKUP_CHANGED: {
        ar: { title: 'تغيير نقطة الصعود', body: 'غيّر {passenger} نقطة الصعود في رحلتك {route}.' },
        en: { title: 'Pickup changed', body: '{passenger} changed their pickup on your trip {route}.' },
    },
    PICKUP_CANCELLED: {
        ar: { title: 'إلغاء نقطة الصعود', body: 'أُلغيت نقطة صعود في رحلتك {route}.' },
        en: { title: 'Pickup cancelled', body: 'A pickup on your trip {route} was cancelled.' },
    },
    ROUTE_UPDATED: {
        ar: { title: 'تحديث المسار', body: 'تم تحديث مسار الرحلة {route}. يرجى مراجعة التفاصيل.' },
        en: { title: 'Route updated', body: 'The route for trip {route} was updated. Please review the details.' },
    },
    DRIVER_NEARBY: {
        ar: { title: 'السائق قريب', body: 'السائق على بعد {distance_m} متر من نقطة صعودك.' },
        en: { title: 'Driver nearby', body: 'Your driver is {distance_m} meters from your pickup.' },
    },
    DRIVER_ARRIVED: {
        ar: { title: 'وصل السائق', body: 'وصل السائق إلى نقطة صعودك. يرجى الاستعداد.' },
        en: { title: 'Driver arrived', body: 'Your driver has arrived at your pickup. Please be ready.' },
    },
    PICKUP_MISSED: {
        ar: { title: 'تفويت الصعود', body: 'تم تسجيل نقطة صعودك على أنها فائتة.' },
        en: { title: 'Pickup missed', body: 'Your pickup was marked as missed.' },
    },
    NEXT_PICKUP: {
        ar: { title: 'الصعود التالي', body: 'الصعود التالي: {label} على بعد {distance_m} متر.' },
        en: { title: 'Next pickup', body: 'Next pickup: {label}, {distance_m} meters away.' },
    },
};
export function interpolate(template, vars = {}) {
    return template.replace(/\{(\w+)\}/g, (match, key) => Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match);
}
//# sourceMappingURL=templates.js.map