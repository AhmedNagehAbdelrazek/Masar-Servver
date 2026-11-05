# Feature: Driver Profile & Settings Pages

## 1. Overview
This feature implements all backend endpoints needed to power the driver's profile and settings screens, as shown in the UI mockups. It covers:

1. **Main Profile Screen** – Driver summary, subscription info, stats (trips completed, punctuality %, rating), and navigation menu.
2. **Personal Data Screen** – Full driver details (name, age, gender, phone, national ID) and vehicle details (make, model, year, color, plate, seats).
3. **Ratings & Badges Screen** – Rating distribution, average rating, earned badges, and passenger reviews with pagination.
4. **Notification Settings Screen** – Granular notification preferences grouped by category (bookings, trips, subscriptions).
5. **Account Settings** – Change password, app permissions, account deletion, logout.

## 2. Existing Endpoints (Reference)

The following endpoints already exist and should be used/updated:

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/driver/profile` | GET | Driver basic profile info | ✅ Exists |
| `/api/driver/profile` | PUT | Update driver profile | ✅ Exists |
| `/api/driver/vehicle` | GET | Vehicle details | ✅ Exists |
| `/api/driver/vehicle` | PUT | Update vehicle details | ✅ Exists |
| `/api/driver/stats` | GET | Driver statistics | ✅ Exists |
| `/api/driver/ratings` | GET | Driver ratings list | ✅ Exists |
| `/api/driver/subscription` | GET | Current subscription | ✅ Exists |
| `/api/settings/notifications` | GET | Notification settings | ✅ Exists (from earlier spec) |
| `/api/settings/notifications` | PUT | Update notification settings | ✅ Exists (from earlier spec) |
| `/api/auth/change-password` | POST | Change password | ✅ Exists |

## 3. New/Enhanced Endpoints

### 3.1 `GET /api/driver/profile/full` – Full Profile Aggregated

**Purpose:** Returns all profile data in one call for the main profile screen.

**Authentication:** JWT (driver)

**Response (200 OK):**
```json
{
  "driver": {
    "id": "u_123",
    "full_name": "أحمد مدحت عبد العظيم شلي",
    "display_name": "أحمد مدحت",
    "phone": "+962791234567",
    "profile_picture_url": "https://...",
    "joined_at": "2026-08-01T00:00:00Z",
    "member_since": "أغسطس 2026",
    "national_id": "9900000123",
    "age": 27,
    "gender": "male",
    "is_verified": true,
    "verification_status": "approved",
    "email": "ahmed@example.com"
  },
  "vehicle": {
    "vehicle_id": "v_456",
    "make": "هيونداي",
    "model": "إلنترا",
    "year": 2016,
    "color": "أبيض",
    "plate_number": "12-34567",
    "total_seats": 4,
    "verified": true
  },
  "subscription": {
    "tier": "pro",
    "price": 16.00,
    "currency": "JOD",
    "expires_at": "2026-08-15T23:59:59Z",
    "days_remaining": 19,
    "is_active": true,
    "plan_name": "باقة 16 دينارًا"
  },
  "stats": {
    "total_trips_completed": 1,
    "total_ratings": 1,
    "average_rating": 4.8,
    "punctuality_rate": 96,
    "badges": [
      "سائق محترف",
      "ملتزم بالمواعيد",
      "قيادة آمنة",
      "تعامل ممتاز",
      "مركبة نظيفة"
    ]
  },
  "menu_items": [
    { "key": "personal_data", "label": "البيانات الشخصية", "icon": "user" },
    { "key": "subscriptions", "label": "الباقات", "icon": "crown" },
    { "key": "ratings", "label": "التقييمات والشارات", "icon": "star" },
    { "key": "settings", "label": "الإعدادات والأمان", "icon": "settings" },
    { "key": "support", "label": "الدعم الفني", "icon": "headset" },
    { "key": "account_status", "label": "حالة الحساب", "icon": "shield" },
    { "key": "terms", "label": "الشروط وسياسة الخصوصية", "icon": "file-text" },
    { "key": "about", "label": "عن تطبيق مسار", "icon": "info" },
    { "key": "delete_account", "label": "حذف الحساب", "icon": "trash" }
  ]
}
```

---

### 3.2 `GET /api/driver/personal-data` – Driver & Vehicle Details

**Purpose:** Returns complete driver personal information and vehicle details for the personal data screen.

**Authentication:** JWT (driver)

**Response (200 OK):**
```json
{
  "driver": {
    "full_name": "أحمد مدحت عبد العظيم شلي",
    "display_name": "أحمد مدحت",
    "phone": "+962791234567",
    "national_id": "9900000123",
    "age": 27,
    "gender": "ذكر",
    "email": "ahmed@example.com",
    "joined_at": "2026-08-01T00:00:00Z",
    "profile_picture_url": "https://..."
  },
  "vehicle": {
    "vehicle_id": "v_456",
    "make": "هيونداي",
    "model": "إلنترا",
    "year": 2016,
    "color": "أبيض",
    "plate_number": "12-34567",
    "total_seats": 4,
    "verified": true,
    "photos": {
      "front": "https://...",
      "back": "https://...",
      "side": "https://..."
    },
    "registration_photo_url": "https://...",
    "insurance_photo_url": "https://..."
  }
}
```

---

### 3.3 `PUT /api/driver/personal-data` – Update Personal Data

**Purpose:** Update driver personal information and vehicle details.

**Authentication:** JWT (driver)

**Validation Rules:**
- Driver must NOT be in `approved` status (or if approved, only allow limited fields like `display_name`, `profile_picture`).
- `full_name` and `national_id` can only be updated if driver is `unverified` or `rejected`.
- `phone` and `age` can be updated anytime.
- Vehicle details can be updated if driver is `unverified` or `rejected`.

**Request Body:**
```json
{
  "driver": {
    "full_name": "أحمد مدحت عبد العظيم شلي",
    "display_name": "أحمد مدحت",
    "phone": "+962791234567",
    "national_id": "9900000123",
    "age": 27,
    "email": "ahmed@example.com"
  },
  "vehicle": {
    "make": "هيونداي",
    "model": "إلنترا",
    "year": 2016,
    "color": "أبيض",
    "plate_number": "12-34567",
    "total_seats": 4
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Personal data updated successfully",
  "requires_verification": true
}
```

---

### 3.4 `GET /api/driver/ratings` – Enhanced Ratings with Distribution

**Purpose:** Returns complete rating data including distribution, average, badges, and paginated reviews.

**Authentication:** JWT (driver)

**Query Parameters:**
- `page` – default 1
- `limit` – default 10
- `sort` – `newest` or `highest` or `lowest` (default `newest`)

**Response (200 OK):**
```json
{
  "stats": {
    "average_rating": 4.8,
    "total_reviews": 48,
    "distribution": {
      "5": 80,
      "4": 14,
      "3": 4,
      "2": 2,
      "1": 0
    },
    "punctuality_rate": 96
  },
  "badges": [
    "سائق محترف",
    "ملتزم بالمواعيد",
    "قيادة آمنة",
    "تعامل ممتاز",
    "مركبة نظيفة"
  ],
  "reviews": [
    {
      "review_id": "r_123",
      "rating": 5.0,
      "review": "سائق محترم وملتزم، وكانت الرحلة مريحة جداً.",
      "passenger": {
        "id": "u_456",
        "full_name": "محمد خالد",
        "profile_picture_url": "https://..."
      },
      "trip": {
        "id": "t_789",
        "origin_city": "عمان",
        "destination_city": "إربد",
        "departure_time": "2026-05-15T08:00:00Z"
      },
      "was_late": false,
      "created_at": "2026-05-15T12:00:00Z"
    },
    {
      "review_id": "r_124",
      "rating": 3.0,
      "review": "الرحلة كانت مقبولة، لكن الانتظار كان أطول من المعتاد.",
      "passenger": {
        "id": "u_789",
        "full_name": "نور الجابر",
        "profile_picture_url": "https://..."
      },
      "trip": {
        "id": "t_790",
        "origin_city": "عمان",
        "destination_city": "صويلح",
        "departure_time": "2026-07-09T14:00:00Z"
      },
      "was_late": true,
      "created_at": "2026-07-09T16:00:00Z"
    }
  ],
  "pagination": {
    "total": 48,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

### 3.5 `GET /api/driver/notification-settings` – Grouped Notification Settings

**Purpose:** Returns notification settings grouped by category for the notification settings screen.

**Authentication:** JWT (driver)

**Response (200 OK):**
```json
{
  "all_enabled": true,
  "categories": {
    "bookings": {
      "label": "الحجوزات",
      "enabled": true,
      "settings": [
        {
          "type": "booking_confirmed",
          "label": "حجوزات جديدة",
          "enabled_in_app": true,
          "enabled_push": true
        },
        {
          "type": "booking_cancelled",
          "label": "إلغاء الحجز",
          "enabled_in_app": true,
          "enabled_push": true
        },
        {
          "type": "new_message",
          "label": "رسائل الركاب",
          "enabled_in_app": true,
          "enabled_push": true
        }
      ]
    },
    "trips": {
      "label": "الرحلات",
      "enabled": true,
      "settings": [
        {
          "type": "trip_reminder",
          "label": "تقدير الرحلات القادمة",
          "enabled_in_app": true,
          "enabled_push": true
        },
        {
          "type": "trip_cancelled",
          "label": "تحديثات الرحلة",
          "enabled_in_app": true,
          "enabled_push": true
        },
        {
          "type": "delay_report",
          "label": "إشعارات عدم الحضور",
          "enabled_in_app": true,
          "enabled_push": true
        }
      ]
    },
    "subscriptions": {
      "label": "الباقات والاشتراك",
      "enabled": true,
      "settings": [
        {
          "type": "subscription_payment",
          "label": "الباقات",
          "enabled_in_app": true,
          "enabled_push": true
        },
        {
          "type": "payment_confirmed",
          "label": "اعتماد الدفع",
          "enabled_in_app": true,
          "enabled_push": true
        },
        {
          "type": "subscription_expiring",
          "label": "انتهاء الباقة",
          "enabled_in_app": true,
          "enabled_push": true
        }
      ]
    }
  }
}
```

---

### 3.6 `PUT /api/driver/notification-settings` – Update Grouped Notification Settings

**Purpose:** Update multiple notification settings at once (can be called per category or for individual toggle).

**Authentication:** JWT (driver)

**Request Body:**
```json
{
  "all_enabled": false, // Optional: disables everything
  "settings": [
    {
      "type": "booking_confirmed",
      "enabled_in_app": false,
      "enabled_push": false
    },
    {
      "type": "new_message",
      "enabled_push": true
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Notification settings updated successfully",
  "updated_count": 2
}
```

---

### 3.7 `POST /api/auth/change-password` – Change Password

**Purpose:** Update driver's account password.

**Authentication:** JWT (driver)

**Request Body:**
```json
{
  "current_password": "OldPass123",
  "new_password": "NewPass456",
  "confirm_password": "NewPass456"
}
```

**Validation Rules:**
- Current password must be correct.
- New password must be at least 8 characters.
- New password must match confirmation.

**Response (200 OK):**
```json
{
  "message": "Password changed successfully",
  "requires_relogin": true
}
```

---

### 3.8 `POST /api/driver/delete-account` – Request Account Deletion

**Purpose:** Initiate account deletion request. The account is not immediately deleted but marked for deletion and reviewed.

**Authentication:** JWT (driver)

**Request Body:**
```json
{
  "confirmation": true,
  "reason": "No longer need the service"
}
```

**Response (200 OK):**
```json
{
  "message": "Account deletion request submitted. We will process your request within 5 business days.",
  "deletion_request_id": "dr_123",
  "estimated_completion": "2026-08-27T00:00:00Z"
}
```

**Logic:**
1. Create `deletion_requests` table (new).
2. Set user status to `deletion_pending`.
3. Notify admin.
4. Admin has 5 days to review.
5. After review, account is deleted or reinstated.

**If immediate deletion is required:** Just soft-delete the user (set `deleted_at`), but GDPR compliance suggests a "cooling off" period.

---

### 3.9 `GET /api/driver/account-status` – Account Status Overview

**Purpose:** Shows current account status, verification level, and any penalties/suspensions.

**Authentication:** JWT (driver)

**Response (200 OK):**
```json
{
  "status": "active",
  "verification_status": "approved",
  "is_verified": true,
  "is_suspended": false,
  "is_banned": false,
  "suspension_details": null,
  "active_penalties": [
    {
      "id": "p_123",
      "type": "warning",
      "reason": "Trip cancellation without notice",
      "created_at": "2026-07-15T00:00:00Z",
      "expires_at": "2026-08-15T00:00:00Z"
    }
  ],
  "is_deletion_requested": false,
  "can_delete": true,
  "can_logout": true
}
```

---

## 4. New Database Tables

### 4.1 `deletion_requests`

```sql
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_deletion_requests_user ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
```

---

## 5. Complete API Endpoint Summary

| Screen | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| **Main Profile** | `GET` | `/api/driver/profile/full` | Full profile + stats + subscription + menu |
| **Personal Data** | `GET` | `/api/driver/personal-data` | Driver + vehicle details |
| **Personal Data** | `PUT` | `/api/driver/personal-data` | Update driver + vehicle details |
| **Ratings** | `GET` | `/api/driver/ratings` | Ratings distribution + badges + reviews |
| **Notifications** | `GET` | `/api/driver/notification-settings` | Grouped notification settings |
| **Notifications** | `PUT` | `/api/driver/notification-settings` | Update notification settings |
| **Security** | `POST` | `/api/auth/change-password` | Change password |
| **Account** | `GET` | `/api/driver/account-status` | Account status overview |
| **Account** | `POST` | `/api/driver/delete-account` | Request account deletion |
| **Account** | `POST` | `/api/auth/logout` | Logout (already exists) |

---

## 6. UI Mapping (Per Screenshot)

### 6.1 Main Profile Screen

| UI Element | Data Source |
|------------|-------------|
| Driver photo, name, phone, joined date | `driver.profile_picture_url`, `driver.display_name`, `driver.phone`, `driver.member_since` |
| Subscription card | `subscription.tier`, `subscription.price`, `subscription.days_remaining` |
| Active/Verified badge | `driver.is_verified` |
| Punctuality % | `stats.punctuality_rate` |
| Completed trips | `stats.total_trips_completed` |
| Rating | `stats.average_rating` |
| Menu items | `menu_items` array |

### 6.2 Personal Data Screen

| UI Element | Data Source |
|------------|-------------|
| Driver photo, name, phone, joined date | `driver.full_name`, `driver.display_name`, `driver.phone`, `driver.joined_at` |
| Full name, age, gender, phone, national ID | `driver.full_name`, `driver.age`, `driver.gender`, `driver.phone`, `driver.national_id` |
| Vehicle make, model, year, color, plate, seats | `vehicle.*` |

### 6.3 Ratings & Badges Screen

| UI Element | Data Source |
|------------|-------------|
| Rating distribution bars | `stats.distribution` |
| Average rating | `stats.average_rating` |
| Total reviews | `stats.total_reviews` |
| Badges | `badges` array |
| Review list | `reviews` array |

### 6.4 Notification Settings Screen

| UI Element | Data Source |
|------------|-------------|
| All notifications toggle | `all_enabled` |
| Bookings section | `categories.bookings` |
| Trips section | `categories.trips` |
| Subscriptions section | `categories.subscriptions` |

---

## 7. Security & Authorization

| Action | Rule |
|--------|------|
| Viewing profile | Only the logged-in driver OR admin |
| Updating personal data | Only the logged-in driver; limited fields if `approved` |
| Updating vehicle | Only if driver is `unverified` or `rejected` |
| Changing password | Only the logged-in driver |
| Deleting account | Only the logged-in driver; admin override possible |
| Viewing ratings | Only the logged-in driver |

---

## 8. Error Handling

| Scenario | Response |
|----------|----------|
| Driver not found | `404 Not Found` |
| Driver suspended/banned | `403 Forbidden` |
| Invalid password change | `422 Validation: Current password is incorrect` |
| Account deletion requested twice | `409 Conflict: Deletion already requested` |
| Missing required fields | `422 Validation` |
| Unauthorized access | `401 Unauthorized` |

---

## 9. Acceptance Criteria

### Main Profile
- [ ] `GET /api/driver/profile/full` returns all data for main screen.
- [ ] Subscription shows correct plan, price, and days remaining.
- [ ] Stats show completed trips, punctuality %, and rating.
- [ ] Menu items are returned as an array.

### Personal Data
- [ ] `GET /api/driver/personal-data` returns driver and vehicle details.
- [ ] `PUT /api/driver/personal-data` updates allowed fields.
- [ ] Phone and age can be updated anytime.
- [ ] Full name and national ID can only be updated if `unverified` or `rejected`.

### Ratings & Badges
- [ ] `GET /api/driver/ratings` returns rating distribution percentages.
- [ ] Badges are listed as an array.
- [ ] Reviews are paginated (10 per page).
- [ ] Sort options work (newest/highest/lowest).

### Notification Settings
- [ ] `GET /api/driver/notification-settings` returns grouped categories.
- [ ] `PUT /api/driver/notification-settings` updates multiple settings at once.
- [ ] `all_enabled` toggle works correctly.
- [ ] Individual toggles update only specified settings.

### Account Management
- [ ] `POST /api/auth/change-password` validates current password.
- [ ] `GET /api/driver/account-status` shows verification status and penalties.
- [ ] `POST /api/driver/delete-account` creates a deletion request.

---

## 10. Implementation Order

1. **Main Profile** – `GET /api/driver/profile/full`
2. **Personal Data** – `GET /api/driver/personal-data` and `PUT /api/driver/personal-data`
3. **Ratings** – Enhance `GET /api/driver/ratings` with distribution and badges
4. **Notification Settings** – `GET` and `PUT /api/driver/notification-settings`
5. **Account Status** – `GET /api/driver/account-status`
6. **Account Deletion** – `POST /api/driver/delete-account` + `deletion_requests` table
7. **Password Change** – Ensure `POST /api/auth/change-password` works

---

## 11. Future Enhancements

- **Profile Picture Upload** – Add endpoint `POST /api/driver/profile-picture` to upload/update profile photo.
- **Vehicle Photos Upload** – Add endpoints to upload vehicle photos (front, back, side, registration, insurance).
- **Notification Sound/Vibration Preferences** – Per-notification sound and vibration settings.
- **Two-Factor Authentication** – Enable 2FA for account security.
- **Email Verification** – Add email verification step.
- **Export Data** – GDPR data export endpoint.
