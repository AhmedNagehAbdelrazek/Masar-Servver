export declare const APP_MESSAGES: {
    readonly BAD_REQUEST: {
        readonly en: "Bad request";
        readonly ar: "طلب غير صالح";
    };
    readonly CONFLICT: {
        readonly en: "Conflict";
        readonly ar: "تعارض في الطلب";
    };
    readonly FORBIDDEN: {
        readonly en: "Forbidden";
        readonly ar: "غير مسموح";
    };
    readonly INTERNAL_ERROR: {
        readonly en: "Internal server error";
        readonly ar: "خطأ داخلي في الخادم";
    };
    readonly NOT_FOUND: {
        readonly en: "Resource not found";
        readonly ar: "المورد غير موجود";
    };
    readonly UNAUTHORIZED: {
        readonly en: "Unauthorized";
        readonly ar: "غير مصرح";
    };
    readonly VALIDATION_FAILED: {
        readonly en: "Validation failed";
        readonly ar: "فشل التحقق من صحة البيانات";
    };
    readonly DUPLICATE_VALUE_FOR: {
        readonly en: "Duplicate value for: {fields}";
        readonly ar: "قيمة مكررة في: {fields}";
    };
    readonly INVALID_UPLOAD: {
        readonly en: "Invalid upload.";
        readonly ar: "رفع غير صالح.";
    };
    readonly FILE_TOO_LARGE_10MB: {
        readonly en: "File too large. Maximum allowed size is 10 MB.";
        readonly ar: "الملف كبير جداً. الحد الأقصى للحجم هو 10 ميغابايت.";
    };
    readonly INVALID_OR_EXPIRED_TOKEN: {
        readonly en: "Invalid or expired token.";
        readonly ar: "الرمز غير صالح أو منتهي الصلاحية.";
    };
    readonly AUTH_NO_TOKEN: {
        readonly en: "Access denied. No token provided.";
        readonly ar: "تم رفض الوصول. لم يتم تقديم رمز الدخول.";
    };
    readonly AUTH_INVALID_TOKEN_TYPE: {
        readonly en: "Invalid token type";
        readonly ar: "نوع الرمز غير صالح";
    };
    readonly AUTH_TOKEN_REVOKED: {
        readonly en: "Token has been revoked. Please login again.";
        readonly ar: "تم إلغاء الرمز. يرجى تسجيل الدخول مرة أخرى.";
    };
    readonly AUTH_TOKEN_EXPIRED: {
        readonly en: "Token expired. Please login again.";
        readonly ar: "انتهت صلاحية الرمز. يرجى تسجيل الدخول مرة أخرى.";
    };
    readonly AUTH_INVALID_TOKEN: {
        readonly en: "Invalid token.";
        readonly ar: "رمز غير صالح.";
    };
    readonly AUTH_REQUIRED: {
        readonly en: "Authentication required.";
        readonly ar: "المصادقة مطلوبة.";
    };
    readonly AUTH_INSUFFICIENT_ROLE: {
        readonly en: "Access denied. You do not have the required role.";
        readonly ar: "تم رفض الوصول. ليس لديك الدور المطلوب.";
    };
    readonly INVALID_TOKEN_TYPE: {
        readonly en: "Invalid token type";
        readonly ar: "نوع الرمز غير صالح";
    };
    readonly INVALID_OR_EXPIRED_REFRESH_TOKEN: {
        readonly en: "Invalid or expired refresh token";
        readonly ar: "رمز التحديث غير صالح أو منتهي الصلاحية";
    };
    readonly INVALID_OR_EXPIRED_REGISTRATION_TOKEN: {
        readonly en: "Invalid or expired registration token";
        readonly ar: "رمز التسجيل غير صالح أو منتهي الصلاحية";
    };
    readonly INVALID_OR_EXPIRED_RESET_TOKEN: {
        readonly en: "Invalid or expired reset token";
        readonly ar: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية";
    };
    readonly REFRESH_TOKEN_HAS_BEEN_REVOKED: {
        readonly en: "Refresh token has been revoked";
        readonly ar: "تم إلغاء رمز التحديث";
    };
    readonly REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED: {
        readonly en: "Registration token has already been used or expired";
        readonly ar: "تم استخدام رمز التسجيل مسبقاً أو انتهت صلاحيته";
    };
    readonly RESET_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED: {
        readonly en: "Reset token has already been used or expired";
        readonly ar: "تم استخدام رمز إعادة التعيين مسبقاً أو انتهت صلاحيته";
    };
    readonly REGISTRATION_TOKEN_IS_REQUIRED: {
        readonly en: "Registration token is required";
        readonly ar: "رمز التسجيل مطلوب";
    };
    readonly RESET_TOKEN_IS_REQUIRED: {
        readonly en: "Reset token is required";
        readonly ar: "رمز إعادة التعيين مطلوب";
    };
    readonly INVALID_PHONE_OR_PASSWORD: {
        readonly en: "Invalid phone or password";
        readonly ar: "رقم الهاتف أو كلمة المرور غير صحيحة";
    };
    readonly ACCOUNT_ROLE_MISMATCH: {
        readonly en: "This account is not registered with the requested role";
        readonly ar: "هذا الحساب غير مسجل بالدور المطلوب";
    };
    readonly CURRENT_PASSWORD_IS_INCORRECT: {
        readonly en: "Current password is incorrect";
        readonly ar: "كلمة المرور الحالية غير صحيحة";
    };
    readonly NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD: {
        readonly en: "New password must be different from the current password";
        readonly ar: "يجب أن تختلف كلمة المرور الجديدة عن كلمة المرور الحالية";
    };
    readonly OTP_SENT: {
        readonly en: "OTP sent successfully";
        readonly ar: "تم إرسال رمز التحقق بنجاح";
    };
    readonly OTP_RESENT: {
        readonly en: "OTP resent successfully";
        readonly ar: "تم إعادة إرسال رمز التحقق بنجاح";
    };
    readonly OTP_IF_REGISTERED: {
        readonly en: "If the phone number is registered, an OTP has been sent";
        readonly ar: "إذا كان رقم الهاتف مسجلاً، فقد تم إرسال رمز التحقق";
    };
    readonly INVALID_OTP: {
        readonly en: "Invalid OTP";
        readonly ar: "رمز التحقق غير صالح";
    };
    readonly OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE: {
        readonly en: "OTP has expired. Please request a new one.";
        readonly ar: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.";
    };
    readonly MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE: {
        readonly en: "Maximum OTP attempts exceeded. Please request a new one.";
        readonly ar: "تم تجاوز الحد الأقصى لمحاولات رمز التحقق. يرجى طلب رمز جديد.";
    };
    readonly PASSWORD_RESET_SUCCESSFUL: {
        readonly en: "Password reset successful";
        readonly ar: "تم إعادة تعيين كلمة المرور بنجاح";
    };
    readonly PASSWORD_CHANGED_SUCCESSFULLY: {
        readonly en: "Password changed successfully";
        readonly ar: "تم تغيير كلمة المرور بنجاح";
    };
    readonly LOGGED_OUT: {
        readonly en: "Logged out successfully";
        readonly ar: "تم تسجيل الخروج بنجاح";
    };
    readonly ACCOUNT_IS_BANNED: {
        readonly en: "Account is banned";
        readonly ar: "الحساب محظور";
    };
    readonly ACCOUNT_HAS_BEEN_BANNED: {
        readonly en: "Account has been banned";
        readonly ar: "تم حظر الحساب";
    };
    readonly ACCOUNT_HAS_BEEN_SUSPENDED: {
        readonly en: "Account has been suspended";
        readonly ar: "تم تعليق الحساب";
    };
    readonly ACCOUNT_IS_NOT_ACTIVE: {
        readonly en: "Account is not active";
        readonly ar: "الحساب غير نشط";
    };
    readonly ACCOUNT_IS_SUSPENDED_YOU_CANNOT_BOOK_TRIPS: {
        readonly en: "Account is suspended. You cannot book trips.";
        readonly ar: "الحساب معلق. لا يمكنك حجز الرحلات.";
    };
    readonly ACCOUNT_MUST_BE_VERIFIED_AND_ACTIVE_TO_ACCESS_THIS_RESOURCE: {
        readonly en: "Account must be verified and active to access this resource.";
        readonly ar: "يجب أن يكون الحساب موثقاً وفعالاً للوصول إلى هذا المورد.";
    };
    readonly SUSPENDED_ACCOUNTS_CANNOT_PERFORM_THIS_ACTION: {
        readonly en: "Suspended accounts cannot perform this action";
        readonly ar: "الحسابات المعلقة لا يمكنها تنفيذ هذا الإجراء";
    };
    readonly USER_NOT_FOUND: {
        readonly en: "User not found";
        readonly ar: "المستخدم غير موجود";
    };
    readonly TRIP_NOT_FOUND: {
        readonly en: "Trip not found";
        readonly ar: "الرحلة غير موجودة";
    };
    readonly ONLY_DRIVERS_CAN_CREATE_TRIPS: {
        readonly en: "Only drivers can create trips";
        readonly ar: "السائقون فقط يمكنهم إنشاء الرحلات";
    };
    readonly TRIP_PUBLISHED_SUCCESSFULLY: {
        readonly en: "Trip published successfully!";
        readonly ar: "تم نشر الرحلة بنجاح!";
    };
    readonly TRIP_STARTED_SUCCESSFULLY: {
        readonly en: "Trip started successfully!";
        readonly ar: "تم بدء الرحلة بنجاح!";
    };
    readonly TRIP_CANCELLED_SUCCESSFULLY: {
        readonly en: "Trip cancelled successfully. This cancellation has been recorded.";
        readonly ar: "تم إلغاء الرحلة بنجاح. تم تسجيل عملية الإلغاء هذه.";
    };
    readonly TRIP_IS_ALREADY_CANCELLED: {
        readonly en: "Trip is already cancelled.";
        readonly ar: "الرحلة ملغاة بالفعل.";
    };
    readonly TRIP_IS_ALREADY_ONGOING_OR_COMPLETED: {
        readonly en: "Trip is already ongoing or completed";
        readonly ar: "الرحلة جارية بالفعل أو مكتملة";
    };
    readonly TRIP_IS_ALREADY_ONGOING_OR_COMPLETED_CANNOT_CANCEL: {
        readonly en: "Trip is already ongoing or completed. Cannot cancel.";
        readonly ar: "الرحلة جارية بالفعل أو مكتملة. لا يمكن الإلغاء.";
    };
    readonly TRIP_IS_NOT_AVAILABLE_FOR_BOOKING: {
        readonly en: "Trip is not available for booking";
        readonly ar: "الرحلة غير متاحة للحجز";
    };
    readonly TRIP_CANNOT_BE_STARTED_FROM_ITS_CURRENT_STATUS: {
        readonly en: "Trip cannot be started from its current status.";
        readonly ar: "لا يمكن بدء الرحلة من حالتها الحالية.";
    };
    readonly TRIP_CANNOT_BE_COMPLETED_FROM_ITS_CURRENT_STATUS: {
        readonly en: "Trip cannot be completed from its current status.";
        readonly ar: "لا يمكن إكمال الرحلة من حالتها الحالية.";
    };
    readonly TRIP_CANNOT_BE_EDITED_FROM_ITS_CURRENT_STATUS: {
        readonly en: "Trip cannot be edited from its current status.";
        readonly ar: "لا يمكن تعديل الرحلة من حالتها الحالية.";
    };
    readonly TRIP_CANNOT_BE_STARTED_YET_IT_CAN_ONLY_BE_STARTED: {
        readonly en: "Trip cannot be started yet. It can only be started within one hour before departure.";
        readonly ar: "لا يمكن بدء الرحلة بعد. لا يمكن البدء إلا خلال ساعة واحدة قبل موعد الانطلاق.";
    };
    readonly A_TRIP_THAT_HAS_ALREADY_STARTED_CANNOT_BE_CANCELLED: {
        readonly en: "A trip that has already started cannot be cancelled";
        readonly ar: "لا يمكن إلغاء رحلة قد بدأت بالفعل";
    };
    readonly CANNOT_CANCEL_TRIP_THERE_ARE_CONFIRMED_BOOKINGS_PLEASE_CONTACT_SUPPORT: {
        readonly en: "Cannot cancel trip. There are confirmed bookings. Please contact support.";
        readonly ar: "لا يمكن إلغاء الرحلة. توجد حجوزات مؤكدة. يرجى التواصل مع الدعم.";
    };
    readonly DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE: {
        readonly en: "Departure time must be in the future";
        readonly ar: "يجب أن يكون وقت الانطلاق في المستقبل";
    };
    readonly END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS: {
        readonly en: "End date is required for recurring trips";
        readonly ar: "تاريخ الانتهاء مطلوب للرحلات المتكررة";
    };
    readonly END_DATE_MUST_BE_AFTER_DEPARTURE_DATE: {
        readonly en: "End date must be after departure date";
        readonly ar: "يجب أن يكون تاريخ الانتهاء بعد تاريخ الانطلاق";
    };
    readonly REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS: {
        readonly en: "Repeated days are required for recurring trips";
        readonly ar: "أيام التكرار مطلوبة للرحلات المتكررة";
    };
    readonly AT_LEAST_ONE_SEAT_MUST_BE_AVAILABLE: {
        readonly en: "At least one seat must be available";
        readonly ar: "يجب توفر مقعد واحد متاح على الأقل";
    };
    readonly EXACTLY_ONE_SEAT_MUST_BE_MARKED_AS_DRIVER: {
        readonly en: "Exactly one seat must be marked as driver";
        readonly ar: "يجب تحديد مقعد واحد بالضبط كمقعد السائق";
    };
    readonly SEAT_NUMBERS_MUST_BE_SEQUENTIAL_FROM_1_TO_TOTAL_SEATS: {
        readonly en: "Seat numbers must be sequential from 1 to total seats";
        readonly ar: "يجب أن تكون أرقام المقاعد متسلسلة من 1 إلى العدد الإجمالي للمقاعد";
    };
    readonly SEAT_COUNT_DOES_NOT_MATCH_VEHICLE_TOTAL_SEATS: {
        readonly en: "Seat count does not match vehicle total seats";
        readonly ar: "عدد المقاعد لا يطابق العدد الإجمالي لمقاعد المركبة";
    };
    readonly YOU_CAN_ONLY_START_YOUR_OWN_TRIPS: {
        readonly en: "You can only start your own trips";
        readonly ar: "يمكنك بدء رحلاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_COMPLETE_YOUR_OWN_TRIPS: {
        readonly en: "You can only complete your own trips";
        readonly ar: "يمكنك إكمال رحلاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_EDIT_YOUR_OWN_TRIPS: {
        readonly en: "You can only edit your own trips";
        readonly ar: "يمكنك تعديل رحلاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS: {
        readonly en: "You can only cancel your own trips";
        readonly ar: "يمكنك إلغاء رحلاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_VIEW_PASSENGERS_ON_YOUR_OWN_TRIPS: {
        readonly en: "You can only view passengers on your own trips";
        readonly ar: "يمكنك عرض الركاب في رحلاتك الخاصة فقط";
    };
    readonly YOU_DO_NOT_HAVE_ACCESS_TO_THIS_TRIP: {
        readonly en: "You do not have access to this trip";
        readonly ar: "ليس لديك حق الوصول إلى هذه الرحلة";
    };
    readonly YOU_ARE_NOT_A_PARTICIPANT_OF_THIS_TRIP: {
        readonly en: "You are not a participant of this trip";
        readonly ar: "أنت لست مشاركاً في هذه الرحلة";
    };
    readonly YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP: {
        readonly en: "You are not a member of this trip";
        readonly ar: "أنت لست عضواً في هذه الرحلة";
    };
    readonly TRIP_ID_IS_REQUIRED: {
        readonly en: "trip_id is required";
        readonly ar: "معرف الرحلة مطلوب";
    };
    readonly DRIVER_ALREADY_HAS_A_TRIP_IN_THIS_TIME_SLOT: {
        readonly en: "You already have another trip scheduled in this time slot";
        readonly ar: "لديك رحلة أخرى مجدولة في هذا الوقت";
    };
    readonly TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS: {
        readonly en: "Tracking is only available for active trips";
        readonly ar: "التتبع متاح فقط للرحلات النشطة";
    };
    readonly ONLY_THE_TRIP_DRIVER_CAN_SHARE_TRACKING: {
        readonly en: "Only the trip driver can share tracking";
        readonly ar: "سائق الرحلة فقط يمكنه مشاركة التتبع";
    };
    readonly YOU_NEED_AN_ACTIVE_PLAN_TO_PUBLISH_TRIPS: {
        readonly en: "You need an active plan to publish trips.";
        readonly ar: "تحتاج إلى خطة اشتراك نشطة لنشر الرحلات.";
    };
    readonly YOU_NEED_AN_ACTIVE_PLAN_TO_START_TRIPS: {
        readonly en: "You need an active plan to start trips.";
        readonly ar: "تحتاج إلى خطة اشتراك نشطة لبدء الرحلات.";
    };
    readonly INSUFFICIENT_BALANCE_TO_PUBLISH_TRIP: {
        readonly en: "Insufficient balance to publish trip. You need at least {minimum} to cover commission for one seat. Current balance: {balance}.";
        readonly ar: "رصيد غير كافٍ لنشر الرحلة. تحتاج إلى {minimum} على الأقل لتغطية عمولة مقعد واحد. الرصيد الحالي: {balance}.";
    };
    readonly YOUR_TRIP_CANNOT_BE_STARTED_BECAUSE_YOUR_BALANCE_IS_INSUFFICIENT: {
        readonly en: "Your trip cannot be started because your balance is insufficient. Please subscribe to a plan.";
        readonly ar: "لا يمكن بدء رحلتك لأن رصيدك غير كافٍ. يرجى الاشتراك في خطة.";
    };
    readonly FREE_TRIPS_EXHAUSTED_PUBLISHING: {
        readonly en: "You have used all {limit} free trips included in your plan. Please subscribe to a paid plan to continue publishing trips.";
        readonly ar: "لقد استخدمت جميع الرحلات المجانية ({limit}) المشمولة في خطتك. يرجى الاشتراك في خطة مدفوعة لمواصلة نشر الرحلات.";
    };
    readonly BOOKING_NOT_FOUND: {
        readonly en: "Booking not found";
        readonly ar: "الحجز غير موجود";
    };
    readonly REFERENCED_BOOKING_NOT_FOUND: {
        readonly en: "Referenced booking not found";
        readonly ar: "الحجز المشار إليه غير موجود";
    };
    readonly BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED: {
        readonly en: "Booking is already completed or cancelled";
        readonly ar: "الحجز مكتمل بالفعل أو ملغى";
    };
    readonly AGREED_FARE_DOES_NOT_MATCH_THE_CURRENT_TRIP_FARE: {
        readonly en: "agreed_fare does not match the current trip fare";
        readonly ar: "الأجر المتفق عليه لا يطابق أجر الرحلة الحالي";
    };
    readonly CANCELLATIONS_ARE_ALLOWED_UP_TO_ONE_HOUR_BEFORE_DEPARTURE: {
        readonly en: "Cancellations are allowed up to one hour before departure.";
        readonly ar: "يُسمح بالإلغاء حتى ساعة واحدة قبل موعد الانطلاق.";
    };
    readonly YOU_CAN_ONLY_VIEW_YOUR_OWN_BOOKINGS: {
        readonly en: "You can only view your own bookings";
        readonly ar: "يمكنك عرض حجوزاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_CANCEL_YOUR_OWN_BOOKINGS: {
        readonly en: "You can only cancel your own bookings";
        readonly ar: "يمكنك إلغاء حجوزاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_VIEW_BOOKINGS_ON_YOUR_OWN_TRIPS: {
        readonly en: "You can only view bookings on your own trips";
        readonly ar: "يمكنك عرض الحجوزات في رحلاتك الخاصة فقط";
    };
    readonly YOU_ARE_NOT_PART_OF_THIS_BOOKING: {
        readonly en: "You are not part of this booking";
        readonly ar: "أنت لست جزءاً من هذا الحجز";
    };
    readonly COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE: {
        readonly en: "Could not generate a unique reference code";
        readonly ar: "تعذر توليد رمز مرجعي فريد";
    };
    readonly SEAT_NOT_FOUND: {
        readonly en: "Seat not found";
        readonly ar: "المقعد غير موجود";
    };
    readonly SEAT_NOT_FOUND_ON_THIS_TRIP: {
        readonly en: "Seat not found on this trip";
        readonly ar: "المقعد غير موجود في هذه الرحلة";
    };
    readonly SEAT_ALREADY_BOOKED: {
        readonly en: "Seat already booked";
        readonly ar: "المقعد محجوز بالفعل";
    };
    readonly SEAT_IS_NOT_AVAILABLE_FOR_BOOKING: {
        readonly en: "Seat is not available for booking";
        readonly ar: "المقعد غير متاح للحجز";
    };
    readonly SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER: {
        readonly en: "Seat already locked by another passenger";
        readonly ar: "المقعد محجوز مؤقتاً من قبل راكب آخر";
    };
    readonly COULD_NOT_ACQUIRE_SEAT_LOCK: {
        readonly en: "Could not acquire seat lock";
        readonly ar: "تعذر حجز المقعد مؤقتاً";
    };
    readonly CANNOT_RELEASE_LOCK_HELD_BY_ANOTHER_PASSENGER: {
        readonly en: "Cannot release lock held by another passenger";
        readonly ar: "لا يمكن تحرير حجز مؤقت يحتفظ به راكب آخر";
    };
    readonly SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST: {
        readonly en: "Seat lock expired or does not exist";
        readonly ar: "انتهت صلاحية الحجز المؤقت للمقعد أو أنه غير موجود";
    };
    readonly SEAT_LOCK_EXPIRED_OR_NOT_HELD: {
        readonly en: "Seat lock expired or not held";
        readonly ar: "انتهت صلاحية حجز المقعد المؤقت أو أنه غير محتجز";
    };
    readonly SEAT_LOCKED_FIVE_MINUTES: {
        readonly en: "Seat locked for 5 minutes";
        readonly ar: "تم حجز المقعد لمدة 5 دقائق";
    };
    readonly SEATS_LOCKED_FIVE_MINUTES: {
        readonly en: "Seats locked for 5 minutes";
        readonly ar: "تم حجز المقاعد لمدة 5 دقائق";
    };
    readonly SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS: {
        readonly en: "Seat numbers must be positive integers";
        readonly ar: "يجب أن تكون أرقام المقاعد أرقاماً صحيحة موجبة";
    };
    readonly PROVIDE_SEAT_NUMBER_OR_SEAT_NUMBERS_NOT_BOTH: {
        readonly en: "Provide either seat_number or seat_numbers, not both";
        readonly ar: "أرسل إما seat_number أو seat_numbers، وليس كليهما";
    };
    readonly SEATS_COUNT_MUST_MATCH_LOCKED_SEAT_NUMBERS: {
        readonly en: "Seats count must match the number of locked seats";
        readonly ar: "يجب أن يطابق عدد المقاعد عدد المقاعد المحجوزة مؤقتاً";
    };
    readonly SEAT_LOCK_RELEASED: {
        readonly en: "Seat lock released";
        readonly ar: "تم تحرير الحجز المؤقت للمقعد";
    };
    readonly NOT_ENOUGH_AVAILABLE_SEATS: {
        readonly en: "Not enough available seats";
        readonly ar: "لا توجد مقاعد متاحة كافية";
    };
    readonly NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP: {
        readonly en: "Not enough available seats on the selected trip";
        readonly ar: "لا توجد مقاعد متاحة كافية في الرحلة المختارة";
    };
    readonly TRIP_NOT_BOOKABLE: {
        readonly en: "Trip is not bookable";
        readonly ar: "الرحلة غير قابلة للحجز";
    };
    readonly DROP_OFF_POINT_NOT_ON_TRIP: {
        readonly en: "Drop-off point is not on this trip";
        readonly ar: "نقطة النزول غير موجودة على هذه الرحلة";
    };
    readonly DROP_OFF_POINT_AFTER_DESTINATION: {
        readonly en: "Drop-off point must be before the final destination";
        readonly ar: "يجب أن تكون نقطة النزول قبل الوجهة النهائية";
    };
    readonly DROP_OFF_POINT_AFTER_MEETING_POINT: {
        readonly en: "Drop-off point must be after the pickup point";
        readonly ar: "يجب أن تكون نقطة النزول بعد نقطة الالتقاء";
    };
    readonly DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION: {
        readonly en: "Driver profile reveal is available only after the booking is confirmed";
        readonly ar: "إظهار ملف السائق متاح فقط بعد تأكيد الحجز";
    };
    readonly YOU_DO_NOT_HAVE_ACCESS_TO_THIS_BOOKING_DRIVER_PROFILE: {
        readonly en: "You do not have access to this booking driver profile";
        readonly ar: "ليس لديك صلاحية الوصول إلى ملف سائق هذا الحجز";
    };
    readonly RIDE_REQUEST_NOT_FOUND: {
        readonly en: "Ride request not found";
        readonly ar: "طلب التنقل غير موجود";
    };
    readonly THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE: {
        readonly en: "The ride request is no longer active";
        readonly ar: "طلب التنقل لم يعد نشطاً";
    };
    readonly THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS: {
        readonly en: "This ride request is no longer accepting offers";
        readonly ar: "طلب التنقل هذا لم يقبل العروض بعد الآن";
    };
    readonly ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED: {
        readonly en: "Only open or offered ride requests can be updated";
        readonly ar: "يمكن تحديث طلبات التنقل المفتوحة أو المعروضة فقط";
    };
    readonly YOU_CAN_ONLY_UPDATE_YOUR_OWN_RIDE_REQUESTS: {
        readonly en: "You can only update your own ride requests";
        readonly ar: "يمكنك تحديث طلبات التنقل الخاصة بك فقط";
    };
    readonly YOU_CAN_ONLY_VIEW_OFFERS_ON_YOUR_OWN_REQUESTS_OR: {
        readonly en: "You can only view offers on your own requests or ones you submitted";
        readonly ar: "يمكنك عرض العروض على طلباتك الخاصة أو العروض التي قدمتها فقط";
    };
    readonly YOU_CAN_ONLY_VIEW_YOUR_OWN_RIDE_REQUESTS: {
        readonly en: "You can only view your own ride requests";
        readonly ar: "يمكنك عرض طلبات التنقل الخاصة بك فقط";
    };
    readonly YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS: {
        readonly en: "You can only view matches for your own ride requests";
        readonly ar: "يمكنك عرض الاقتراحات لطلبات التنقل الخاصة بك فقط";
    };
    readonly YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST: {
        readonly en: "You already have a pending offer on this ride request";
        readonly ar: "لديك بالفعل عرض قيد الانتظار على طلب التنقل هذا";
    };
    readonly OFFER_NOT_FOUND: {
        readonly en: "Offer not found";
        readonly ar: "العرض غير موجود";
    };
    readonly OFFER_ALREADY_ATTACHED_TO_A_BOOKING: {
        readonly en: "Offer already attached to a booking";
        readonly ar: "العرض مرتبط بالفعل بحجز";
    };
    readonly OFFER_NO_LONGER_DECIDABLE: {
        readonly en: "Offer is no longer decidable (status: {status})";
        readonly ar: "لم يعد يمكن اتخاذ قرار بشأن العرض (الحالة: {status})";
    };
    readonly ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP: {
        readonly en: "Only accepted offers can be attached to a trip";
        readonly ar: "يمكن ربط العروض المقبولة فقط برحلة";
    };
    readonly YOU_CAN_ONLY_ATTACH_OFFERS_TO_YOUR_OWN_TRIPS: {
        readonly en: "You can only attach offers to your own trips";
        readonly ar: "يمكنك ربط العروض برحلاتك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_ATTACH_YOUR_OWN_OFFERS: {
        readonly en: "You can only attach your own offers";
        readonly ar: "يمكنك ربط عروضك الخاصة فقط";
    };
    readonly YOU_CAN_ONLY_DECIDE_ON_OFFERS_TO_YOUR_OWN_RIDE: {
        readonly en: "You can only decide on offers to your own ride requests";
        readonly ar: "يمكنك اتخاذ القرار بشأن العروض على طلبات التنقل الخاصة بك فقط";
    };
    readonly YOU_CAN_ONLY_AGREE_PRICES_ON_OFFERS_TO_YOUR_OWN: {
        readonly en: "You can only agree prices on offers to your own ride requests";
        readonly ar: "يمكنك الاتفاق على الأسعار للعروض على طلبات التنقل الخاصة بك فقط";
    };
    readonly ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE: {
        readonly en: "Accept the offer before agreeing on a final price";
        readonly ar: "اقبل العرض قبل الاتفاق على السعر النهائي";
    };
    readonly AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO: {
        readonly en: "Agree on a final price before attaching the offer to a trip";
        readonly ar: "اتفق على السعر النهائي قبل ربط العرض برحلة";
    };
    readonly THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE: {
        readonly en: "The underlying ride request is not in an accepted state";
        readonly ar: "طلب التنقل المرتبط ليس في حالة مقبولة";
    };
    readonly ONLY_THE_TRIP_DRIVER_CAN_REPORT_A_DRIVER_DELAY: {
        readonly en: "Only the trip driver can report a driver delay";
        readonly ar: "سائق الرحلة فقط يمكنه الإبلاغ عن تأخر السائق";
    };
    readonly ONLY_THE_BOOKING_PASSENGER_CAN_REPORT_A_PASSENGER_DELAY: {
        readonly en: "Only the booking passenger can report a passenger delay";
        readonly ar: "راكب الحجز فقط يمكنه الإبلاغ عن تأخر الراكب";
    };
    readonly SOS_EVENT_NOT_FOUND: {
        readonly en: "SOS event not found";
        readonly ar: "حدث الاستغاثة غير موجود";
    };
    readonly SOS_EVENT_IS_ALREADY_CLOSED: {
        readonly en: "SOS event is already closed";
        readonly ar: "حدث الاستغاثة مغلق بالفعل";
    };
    readonly SOS_IS_ONLY_AVAILABLE_DURING_AN_ACTIVE_TRIP: {
        readonly en: "SOS is only available during an active trip";
        readonly ar: "الاستغاثة متاحة فقط أثناء رحلة نشطة";
    };
    readonly TRIP_ID_IS_REQUIRED_FOR_SOS: {
        readonly en: "trip_id is required for SOS";
        readonly ar: "معرف الرحلة مطلوب لخدمة الاستغاثة";
    };
    readonly ONLY_THE_PASSENGER_OR_THE_DRIVER_OF_A_BOOKING_MAY: {
        readonly en: "Only the passenger or the driver of a booking may rate it";
        readonly ar: "يمكن للراكب أو سائق الحجز فقط تقييمه";
    };
    readonly MESSAGE_NOT_FOUND: {
        readonly en: "Message not found";
        readonly ar: "الرسالة غير موجودة";
    };
    readonly MESSAGE_IS_REQUIRED: {
        readonly en: "message is required";
        readonly ar: "نص الرسالة مطلوب";
    };
    readonly MESSAGE_IS_EMPTY_AFTER_SANITIZATION: {
        readonly en: "message is empty after sanitization";
        readonly ar: "نص الرسالة فارغ بعد التنظيف";
    };
    readonly YOU_CANNOT_MARK_YOUR_OWN_MESSAGE_AS_READ: {
        readonly en: "You cannot mark your own message as read";
        readonly ar: "لا يمكنك وضع علامة مقروء على رسالتك الخاصة";
    };
    readonly YOU_CAN_ONLY_MARK_YOUR_OWN_NOTIFICATIONS_AS_READ: {
        readonly en: "You can only mark your own notifications as read";
        readonly ar: "يمكنك وضع علامة مقروء على إشعاراتك الخاصة فقط";
    };
    readonly NOTIFICATION_NOT_FOUND: {
        readonly en: "Notification not found";
        readonly ar: "الإشعار غير موجود";
    };
    readonly BOOKING_CHAT_REQUIRES_A_CONFIRMED_BOOKING: {
        readonly en: "Booking chat requires a confirmed booking";
        readonly ar: "محادثة الحجز تتطلب حجزاً مؤكداً";
    };
    readonly BOOKING_CHAT_IS_CLOSED_BECAUSE_THE_TRIP_IS_COMPLETED_OR: {
        readonly en: "Booking chat is closed because the trip is completed or cancelled";
        readonly ar: "أُغلقت محادثة الحجز لأن الرحلة مكتملة أو ملغاة";
    };
    readonly BOOKING_ID_IS_REQUIRED_FOR_BOOKING_CHAT: {
        readonly en: "booking_id is required for booking chat";
        readonly ar: "معرف الحجز مطلوب لمحادثة الحجز";
    };
    readonly SUPPORT_TICKET_ID_IS_REQUIRED_FOR_SUPPORT_CHAT: {
        readonly en: "support_ticket_id is required for support chat";
        readonly ar: "معرف تذكرة الدعم مطلوب لمحادثة الدعم";
    };
    readonly PROVIDE_MESSAGE_ID_BOOKING_ID_OR_SUPPORT_TICKET_ID: {
        readonly en: "Provide message_id, booking_id or support_ticket_id";
        readonly ar: "قدم معرف الرسالة أو معرف الحجز أو معرف تذكرة الدعم";
    };
    readonly PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID: {
        readonly en: "Provide booking_id or support_ticket_id";
        readonly ar: "قدم معرف الحجز أو معرف تذكرة الدعم";
    };
    readonly YOU_ARE_NOT_A_MEMBER_OF_THIS_CONVERSATION: {
        readonly en: "You are not a member of this conversation";
        readonly ar: "أنت لست عضواً في هذه المحادثة";
    };
    readonly YOU_ARE_NOT_A_MEMBER_OF_THIS_BOOKING_CHAT: {
        readonly en: "You are not a member of this booking chat";
        readonly ar: "أنت لست عضواً في محادثة الحجز هذه";
    };
    readonly YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET: {
        readonly en: "You are not a member of this support ticket";
        readonly ar: "أنت لست عضواً في تذكرة الدعم هذه";
    };
    readonly SUPPORT_TICKET_NOT_FOUND: {
        readonly en: "Support ticket not found";
        readonly ar: "تذكرة الدعم غير موجودة";
    };
    readonly SUPPORT_TICKET_ID_IS_REQUIRED: {
        readonly en: "support_ticket_id is required";
        readonly ar: "معرف تذكرة الدعم مطلوب";
    };
    readonly CLOSED_TICKETS_CANNOT_BE_REOPENED: {
        readonly en: "Closed tickets cannot be reopened";
        readonly ar: "لا يمكن إعادة فتح التذاكر المغلقة";
    };
    readonly YOU_CAN_ONLY_REPLY_TO_YOUR_OWN_SUPPORT_TICKETS: {
        readonly en: "You can only reply to your own support tickets";
        readonly ar: "يمكنك الرد على تذاكر الدعم الخاصة بك فقط";
    };
    readonly YOU_CAN_ONLY_VIEW_YOUR_OWN_SUPPORT_TICKETS: {
        readonly en: "You can only view your own support tickets";
        readonly ar: "يمكنك عرض تذاكر الدعم الخاصة بك فقط";
    };
    readonly PARTY_MUST_BE_DRIVER_OR_PASSENGER: {
        readonly en: "party must be \"driver\" or \"passenger\"";
        readonly ar: "يجب أن يكون الطرف \"سائقاً\" أو \"راكباً\"";
    };
    readonly ACCUSED_USER_NOT_FOUND: {
        readonly en: "Accused user not found";
        readonly ar: "المستخدم المشتكي منه غير موجود";
    };
    readonly COMPLAINT_NOT_FOUND: {
        readonly en: "Complaint not found";
        readonly ar: "الشكوى غير موجودة";
    };
    readonly FAVORITE_DRIVER_NOT_FOUND: {
        readonly en: "Favorite driver not found";
        readonly ar: "السائق المفضل غير موجود";
    };
    readonly FAVORITE_ROUTE_NOT_FOUND: {
        readonly en: "Favorite route not found";
        readonly ar: "المسار المفضل غير موجود";
    };
    readonly YOU_CANNOT_ADD_YOURSELF_AS_A_FAVORITE_DRIVER: {
        readonly en: "You cannot add yourself as a favorite driver";
        readonly ar: "لا يمكنك إضافة نفسك كسائق مفضل";
    };
    readonly FAVORITE_DRIVER_REMOVED: {
        readonly en: "Favorite driver removed.";
        readonly ar: "تمت إزالة السائق المفضل.";
    };
    readonly FAVORITE_ROUTE_REMOVED: {
        readonly en: "Favorite route removed.";
        readonly ar: "تمت إزالة المسار المفضل.";
    };
    readonly VEHICLE_NOT_FOUND: {
        readonly en: "Vehicle not found";
        readonly ar: "المركبة غير موجودة";
    };
    readonly DRIVER_NOT_FOUND: {
        readonly en: "Driver not found";
        readonly ar: "السائق غير موجود";
    };
    readonly DRIVER_NOT_VERIFIED: {
        readonly en: "Driver not verified";
        readonly ar: "السائق غير موثق";
    };
    readonly DRIVER_PROFILE_NOT_FOUND: {
        readonly en: "Driver profile not found";
        readonly ar: "ملف السائق غير موجود";
    };
    readonly DRIVER_PROFILE_ALREADY_EXISTS: {
        readonly en: "Driver profile already exists";
        readonly ar: "ملف السائق موجود بالفعل";
    };
    readonly DRIVER_HAS_NO_REGISTERED_VEHICLE: {
        readonly en: "Driver has no registered vehicle";
        readonly ar: "ليدى السائق مركبة مسجلة";
    };
    readonly DRIVER_VEHICLE_IS_NOT_VERIFIED: {
        readonly en: "Driver vehicle is not verified";
        readonly ar: "مركبة السائق غير موثقة";
    };
    readonly ONLY_DRIVERS_CAN_ADD_VEHICLES: {
        readonly en: "Only drivers can add vehicles";
        readonly ar: "السائقون فقط يمكنهم إضافة المركبات";
    };
    readonly ONLY_DRIVERS_CAN_SUBMIT_A_DRIVER_PROFILE: {
        readonly en: "Only drivers can submit a driver profile";
        readonly ar: "السائقون فقط يمكنهم تقديم ملف السائق";
    };
    readonly ONLY_PASSENGERS_CAN_SUBMIT_A_PASSENGER_PROFILE: {
        readonly en: "Only passengers can submit a passenger profile";
        readonly ar: "الركاب فقط يمكنهم تقديم ملف الراكب";
    };
    readonly PASSENGER_PROFILE_ALREADY_EXISTS: {
        readonly en: "Passenger profile already exists";
        readonly ar: "ملف الراكب موجود بالفعل";
    };
    readonly PLEASE_COMPLETE_YOUR_DRIVER_PROFILE_FIRST: {
        readonly en: "Please complete your driver profile first";
        readonly ar: "يرجى إكمال ملف السائق أولاً";
    };
    readonly YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD: {
        readonly en: "You already have a registered vehicle. Update it instead.";
        readonly ar: "لديك بالفعل مركبة مسجلة. يمكنك تحديثها بدلاً من ذلك.";
    };
    readonly A_VEHICLE_WITH_THIS_PLATE_NUMBER_ALREADY_EXISTS: {
        readonly en: "A vehicle with this plate number already exists";
        readonly ar: "توجد مركبة بهذا الرقم اللوحي بالفعل";
    };
    readonly YOU_CAN_ONLY_UPDATE_YOUR_OWN_VEHICLES: {
        readonly en: "You can only update your own vehicles";
        readonly ar: "يمكنك تحديث مركباتك الخاصة فقط";
    };
    readonly PLATE_NUMBER_ALREADY_IN_USE: {
        readonly en: "Plate number already in use";
        readonly ar: "رقم اللوحة مستخدم بالفعل";
    };
    readonly PLATE_ALREADY_IN_USE: {
        readonly en: "Plate number already in use";
        readonly ar: "رقم اللوحة مستخدم بالفعل";
    };
    readonly EMAIL_ALREADY_IN_USE: {
        readonly en: "Email already in use";
        readonly ar: "البريد الإلكتروني مستخدم بالفعل";
    };
    readonly PHONE_ALREADY_IN_USE: {
        readonly en: "Phone already in use";
        readonly ar: "رقم الهاتف مستخدم بالفعل";
    };
    readonly PHONE_NUMBER_IS_ALREADY_REGISTERED: {
        readonly en: "Phone number is already registered";
        readonly ar: "رقم الهاتف مسجل بالفعل";
    };
    readonly LOCKED_FIELDS_CANNOT_BE_MODIFIED: {
        readonly en: "Locked fields cannot be modified: {fields}";
        readonly ar: "لا يمكن تعديل الحقول المقفلة: {fields}";
    };
    readonly NO_UPDATABLE_FIELDS_PROVIDED: {
        readonly en: "No updatable fields provided";
        readonly ar: "لم يتم تقديم حقول قابلة للتحديث";
    };
    readonly ONE_OR_MORE_UPLOADED_DOCUMENT_IDS_DO_NOT_EXIST: {
        readonly en: "One or more uploaded document ids do not exist.";
        readonly ar: "معرّف وثيقة واحدة أو أكثر من الوثائق المرفوعة غير موجود.";
    };
    readonly ONE_OR_MORE_IMAGE_IDS_ARE_INVALID: {
        readonly en: "One or more image IDs are invalid";
        readonly ar: "معرّف صورة واحد أو أكثر غير صالح";
    };
    readonly NO_FILE_UPLOADED: {
        readonly en: "No file uploaded";
        readonly ar: "لم يتم رفع أي ملف";
    };
    readonly ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED: {
        readonly en: "Only JPEG, PNG, WebP, and GIF images are allowed.";
        readonly ar: "يُسمح فقط بصور JPEG و PNG و WebP و GIF.";
    };
    readonly YOUR_VERIFICATION_APPLICATION_IS_ALREADY_UNDER_REVIEW: {
        readonly en: "Your verification application is already under review.";
        readonly ar: "طلب التوثيق الخاص بك قيد المراجعة بالفعل.";
    };
    readonly YOUR_VERIFICATION_IS_APPROVED_AND_LOCKED_CONTACT_SUPPORT_IF_YOU: {
        readonly en: "Your verification is approved and locked. Contact support if you need to make changes.";
        readonly ar: "تمت الموافقة على توثيقك وقفل التعديل. تواصل مع الدعم إذا احتجت لإجراء تغييرات.";
    };
    readonly A_DELETION_REQUEST_IS_ALREADY_PENDING: {
        readonly en: "A deletion request is already pending";
        readonly ar: "يوجد بالفعل طلب حذف قيد الانتظار";
    };
    readonly CONFIRMATION_IS_REQUIRED_TO_REQUEST_ACCOUNT_DELETION: {
        readonly en: "Confirmation is required to request account deletion";
        readonly ar: "التأكيد مطلوب لطلب حذف الحساب";
    };
    readonly NO_PENDING_DELETION_REQUEST_FOUND: {
        readonly en: "No pending deletion request found";
        readonly ar: "لا يوجد طلب حذف قيد الانتظار";
    };
    readonly PLAN_NOT_FOUND: {
        readonly en: "Plan not found";
        readonly ar: "الخطة غير موجودة";
    };
    readonly PAYMENT_METHOD_NOT_FOUND: {
        readonly en: "Payment method not found";
        readonly ar: "طريقة الدفع غير موجودة";
    };
    readonly PAYMENT_METHOD_DEACTIVATED: {
        readonly en: "Payment method deactivated.";
        readonly ar: "تم إلغاء تنشيط طريقة الدفع.";
    };
    readonly PLAN_DEACTIVATED: {
        readonly en: "Plan deactivated.";
        readonly ar: "تم إلغاء تنشيط الخطة.";
    };
    readonly SUBSCRIPTION_NOT_FOUND: {
        readonly en: "Subscription not found";
        readonly ar: "الاشتراك غير موجود";
    };
    readonly SUBSCRIPTION_PENDING_ADMIN_APPROVAL: {
        readonly en: "Your subscription is pending admin approval.";
        readonly ar: "اشتراكك بانتظار موافقة المشرف.";
    };
    readonly SUBSCRIPTION_APPROVED_PLAN_ACTIVATED: {
        readonly en: "Subscription approved. Plan activated.";
        readonly ar: "تمت الموافقة على الاشتراك. تم تنشيط الخطة.";
    };
    readonly SUBSCRIPTION_REJECTED: {
        readonly en: "Subscription rejected.";
        readonly ar: "تم رفض الاشتراك.";
    };
    readonly REQUEST_ALREADY_PROCESSED: {
        readonly en: "Request already processed.";
        readonly ar: "تمت معالجة الطلب بالفعل.";
    };
    readonly THE_SELECTED_PLAN_IS_NO_LONGER_ACTIVE: {
        readonly en: "The selected plan is no longer active.";
        readonly ar: "الخطة المختارة لم تعد نشطة.";
    };
    readonly FREE_PLANS_ARE_AUTOMATICALLY_ASSIGNED_AT_SIGNUP_AND_CANNOT_BE: {
        readonly en: "Free plans are automatically assigned at signup and cannot be subscribed to manually.";
        readonly ar: "يتم تخصيص الخطط المجانية تلقائياً عند التسجيل ولا يمكن الاشتراك بها يدوياً.";
    };
    readonly A_FREE_PLAN_ALREADY_EXISTS_ONLY_ONE_FREE_PLAN_CAN: {
        readonly en: "A free plan already exists. Only one free plan can be active at a time.";
        readonly ar: "توجد خطة مجانية بالفعل. يمكن أن تكون خطة مجانية واحدة نشطة فقط في الوقت ذاته.";
    };
    readonly THE_SELECTED_PAYMENT_METHOD_IS_UNAVAILABLE: {
        readonly en: "The selected payment method is unavailable.";
        readonly ar: "طريقة الدفع المختارة غير متاحة.";
    };
    readonly THE_SCREENSHOT_IMAGE_ID_IS_INVALID: {
        readonly en: "The screenshot image ID is invalid.";
        readonly ar: "معرف صورة لقطة الشاشة غير صالح.";
    };
    readonly YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_PLAN: {
        readonly en: "You already have a pending request for this plan.";
        readonly ar: "لديك بالفعل طلب قيد الانتظار لهذه الخطة.";
    };
    readonly INVALID_SUBSCRIPTION_STATUS_FILTER: {
        readonly en: "Invalid subscription status filter.";
        readonly ar: "مرشح حالة الاشتراك غير صالح.";
    };
    readonly AGENT_ID_IS_REQUIRED: {
        readonly en: "agent_id is required";
        readonly ar: "معرف الوكيل مطلوب";
    };
    readonly INVALID_BEFORE_ID: {
        readonly en: "Invalid before_id";
        readonly ar: "معرّف before_id غير صالح";
    };
    readonly BOOKING_ID_IS_REQUIRED: {
        readonly en: "booking_id is required";
        readonly ar: "معرف الحجز مطلوب";
    };
    readonly LAT_AND_LNG_ARE_REQUIRED: {
        readonly en: "lat and lng are required";
        readonly ar: "خط العرض وخط الطول مطلوبان";
    };
    readonly LAT_AND_LNG_MUST_BE_NUMBERS: {
        readonly en: "lat and lng must be numbers";
        readonly ar: "يجب أن يكون خط العرض وخط الطول أرقاماً";
    };
    readonly ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION: {
        readonly en: "ends_at is required for a suspension";
        readonly ar: "تاريخ الانتهاء مطلوب للتعليق";
    };
    readonly ENDS_AT_IS_FORBIDDEN_FOR_A_BAN: {
        readonly en: "ends_at is forbidden for a ban";
        readonly ar: "تاريخ الانتهاء غير مسموح به للحظر";
    };
    readonly DRIVER_ALREADY_IN_STATE: {
        readonly en: "Driver is already in this state";
        readonly ar: "السائق في هذه الحالة بالفعل";
    };
    readonly INVALID_DRIVER_STATUS_VALUE: {
        readonly en: "Invalid driver status value";
        readonly ar: "قيمة حالة السائق غير صالحة";
    };
    readonly INVALID_ACCOUNT_ACTION: {
        readonly en: "Invalid account action";
        readonly ar: "إجراء الحساب غير صالح";
    };
    readonly DOCUMENT_KEY_NOT_RECOGNIZED: {
        readonly en: "Document key not recognized";
        readonly ar: "مفتاح المستند غير معروف";
    };
    readonly DOCUMENT_HAS_NO_BACKING_FILE: {
        readonly en: "This document has no backing file to review";
        readonly ar: "لا يوجد ملف لهذا المستند لمراجعته";
    };
    readonly INVALID_MONTH_FILTER: {
        readonly en: "Invalid month filter, expected YYYY-MM";
        readonly ar: "مرشح الشهر غير صالح، الصيغة المتوقعة YYYY-MM";
    };
    readonly ALERT_PENDING_VERIFICATION_DOCUMENTS: {
        readonly en: "Verification documents awaiting review";
        readonly ar: "مستندات توثيق بانتظار المراجعة";
    };
    readonly ALERT_PENDING_REVIEW_DRIVERS: {
        readonly en: "Drivers awaiting review";
        readonly ar: "سائقون بانتظار المراجعة";
    };
    readonly ALERT_UNRESOLVED_COMPLAINTS: {
        readonly en: "Unresolved complaints";
        readonly ar: "شكاوى غير محلولة";
    };
    readonly DATE_CANNOT_BE_IN_THE_PAST: {
        readonly en: "Date cannot be in the past";
        readonly ar: "لا يمكن أن يكون التاريخ في الماضي";
    };
};
export type AppMessageEntry = {
    readonly en: string;
    readonly ar: string;
};
export type AppMessages = typeof APP_MESSAGES;
export type AppMessageKey = keyof typeof APP_MESSAGES;
export default APP_MESSAGES;
