# Feature: Trip Details, Cancellation Flow & Notification Settings

## 1. Overview
This feature adds three critical server-side capabilities:

1. **Trip Details Endpoint (`GET /trips/{trip_id}`)** – A complete view of a trip including all passengers with their profiles, booking details, and seat assignments.
2. **Trip Cancellation Flow** – Drivers can cancel a trip only if zero confirmed bookings exist, providing a reason and note. The cancellation is logged as a penalty to track driver reliability.
3. **Notification Settings** – Users can control their notification preferences per type (in-app and push) via a settings endpoint.

---

## 2. Trip Details Endpoint – `GET /trips/{trip_id}`

### 2.1 Purpose
Return a complete trip record with:
- All trip metadata (origin, destination, time, fare, etc.).
- Vehicle details.
- All passengers who have confirmed bookings on this trip.
- Each passenger's profile (name, phone, rating, etc.), booking status, seat numbers, and agreed fare.

### 2.2 Authentication
JWT (driver of the trip, OR a passenger with a booking on this trip, OR admin).

### 2.3 Response (200 OK)

```json
{
  "trip": {
    "trip_id": "t_456",
    "driver": {
      "id": "u_123",
      "full_name": "أحمد العلي",
      "phone": "+962790000000",
      "rating": 4.8,
      "profile_picture_url": "https://...",
      "total_trips_completed": 142
    },
    "vehicle": {
      "vehicle_id": "v_789",
      "make_model": "Hyundai Elantra",
      "year": 2021,
      "plate_number": "ABC-1234",
      "color": "White",
      "total_seats": 4
    },
    "origin": {
      "city": "عمان",
      "area": "صويح",
      "lat": 31.9539,
      "lng": 35.9106
    },
    "destination": {
      "city": "إربد",
      "area": "عرش الكل",
      "lat": 32.5522,
      "lng": 35.8580
    },
    "departure_time": "2026-08-11T08:30:00Z",
    "fare_per_seat": 5.00,
    "currency": "JOD",
    "total_seats": 4,
    "available_seats": 0,
    "status": "published",
    "is_recurring": false,
    "recurrence_days": null,
    "recurrence_end_date": null,
    "gender_preference": "all",
    "attributes": {
      "smoking_allowed": false,
      "ac": true,
      "women_only": false,
      "pets": false,
      "music": true
    },
    "waypoints": [
      {
        "stop_name": "السلط",
        "stop_lat": 32.0361,
        "stop_lng": 35.7242
      }
    ],
    "instructions": "يرجى الوصول قبل 10 دقائق",
    "additional_instructions": "ممنوع الأكل والشرب داخل السيارة",
    "created_at": "2026-08-10T14:30:00Z"
  },
  "passengers": [
    {
      "booking_id": "b_789",
      "passenger": {
        "id": "u_456",
        "full_name": "محمد خالد",
        "phone": "+962790000001",
        "rating": 4.9,
        "profile_picture_url": "https://...",
        "total_trips_completed": 27
      },
      "seats_booked": 2,
      "seat_numbers": [2, 3],
      "agreed_fare": 5.00,
      "booking_status": "confirmed",
      "dropoff_place": "شارع الجامعة",
      "dropoff_deadline": "2026-08-11T09:30:00Z",
      "created_at": "2026-08-10T18:00:00Z"
    },
    {
      "booking_id": "b_790",
      "passenger": {
        "id": "u_789",
        "full_name": "سارة أحمد",
        "phone": "+962790000002",
        "rating": 4.7,
        "profile_picture_url": "https://...",
        "total_trips_completed": 18
      },
      "seats_booked": 1,
      "seat_numbers": [4],
      "agreed_fare": 5.00,
      "booking_status": "confirmed",
      "dropoff_place": "مجمع الشمال",
      "dropoff_deadline": "2026-08-11T09:15:00Z",
      "created_at": "2026-08-10T19:00:00Z"
    }
  ]
}
```

### 2.4 Error Scenarios
| Scenario | Response |
|----------|----------|
| Trip not found | `404 Not Found: Trip not found` |
| User unauthorized (not driver, not passenger on trip, not admin) | `403 Forbidden: You do not have access to this trip` |
| User suspended/banned | `403 Forbidden: Account is suspended` |

### 2.5 Database Query Optimization
Use a single query with JSON aggregation to avoid N+1:

```sql
SELECT 
  json_build_object(
    'trip_id', t.id,
    'driver', json_build_object(
      'id', u.id,
      'full_name', u.full_name,
      'phone', u.phone,
      'rating', u.rating,
      'profile_picture_url', u.profile_picture_url,
      'total_trips_completed', u.total_trips_completed
    ),
    'vehicle', json_build_object(
      'vehicle_id', v.id,
      'make_model', v.make_model,
      'year', v.year,
      'plate_number', v.plate_number,
      'color', v.color,
      'total_seats', v.total_seats
    ),
    'origin', json_build_object('city', t.origin_city, 'area', t.origin_area, 'lat', t.origin_lat, 'lng', t.origin_lng),
    'destination', json_build_object('city', t.destination_city, 'area', t.destination_area, 'lat', t.destination_lat, 'lng', t.destination_lng),
    'departure_time', t.departure_time,
    'fare_per_seat', t.fare_per_seat,
    'currency', 'JOD',
    'total_seats', t.total_seats,
    'available_seats', t.available_seats,
    'status', t.status,
    'is_recurring', t.is_recurring,
    'recurrence_days', t.recurrence_days,
    'recurrence_end_date', t.recurrence_end_date,
    'gender_preference', t.gender_preference,
    'attributes', (SELECT json_agg(json_build_object('key', attr_key, 'value', attr_value)) FROM trip_attributes WHERE trip_id = t.id),
    'waypoints', (SELECT json_agg(json_build_object('stop_name', stop_name, 'stop_lat', stop_lat, 'stop_lng', stop_lng)) FROM trip_stops WHERE trip_id = t.id ORDER BY stop_order),
    'instructions', t.driver_instructions,
    'additional_instructions', t.additional_instructions,
    'created_at', t.created_at
  ) as trip,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'booking_id', b.id,
        'passenger', json_build_object(
          'id', pu.id,
          'full_name', pu.full_name,
          'phone', pu.phone,
          'rating', pu.rating,
          'profile_picture_url', pu.profile_picture_url,
          'total_trips_completed', pu.total_trips_completed
        ),
        'seats_booked', b.seats_booked,
        'seat_numbers', (SELECT array_agg(seat_number) FROM booking_seats WHERE booking_id = b.id),
        'agreed_fare', b.agreed_fare,
        'booking_status', b.status,
        'dropoff_place', b.dropoff_place,
        'dropoff_deadline', b.dropoff_deadline,
        'created_at', b.created_at
      )
    ) 
    FROM bookings b
    JOIN users pu ON b.passenger_id = pu.id
    WHERE b.trip_id = t.id AND b.status = 'confirmed'),
    '[]'::json
  ) as passengers
FROM trips t
JOIN users u ON t.driver_id = u.id
JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.id = $1;
```

---

## 3. Trip Cancellation Flow – `POST /trips/{trip_id}/cancel`

### 3.1 Purpose
Allow a driver to cancel a trip **only if there are zero confirmed bookings**. The driver must provide:
- A `reason` (from a predefined list on the frontend – we just store the text).
- A `note` (additional explanation).

This action is automatically logged as a **penalty** (minor infraction) to track driver reliability. Multiple cancellations will lead to warnings or suspension.

### 3.2 Authentication
JWT (must be the driver who owns the trip).

### 3.3 Request Body
```json
{
  "reason": "ظروف طارئة",
  "note": "تعطلت السيارة ولا يمكنني إجراء الرحلة اليوم"
}
```

### 3.4 Validation Rules
1. Driver must own the trip.
2. Trip must be in `published` or `full` status (cannot cancel if `ongoing`, `completed`, or already `cancelled`).
3. **No confirmed bookings** – `COUNT(bookings WHERE trip_id = trip_id AND status = 'confirmed')` must equal `0`.
4. `reason` must be a non-empty string (max 100 chars).
5. `note` is optional but if provided, max 500 chars.

### 3.5 Response (200 OK)
```json
{
  "message": "Trip cancelled successfully. This cancellation has been recorded.",
  "trip_id": "t_456",
  "status": "cancelled",
  "penalty_id": "p_123",
  "penalty_type": "warning"
}
```

### 3.6 Database Updates
1. Update `trips` table:
   ```sql
   UPDATE trips 
   SET status = 'cancelled' 
   WHERE id = $1 AND driver_id = $2;
   ```

2. Insert a record in `penalties` table:
   ```sql
   INSERT INTO penalties (
     id,
     user_id,
     trip_id,
     penalty_type,
     severity,
     reason,
     details,
     created_at
   ) VALUES (
     gen_random_uuid(),
     $driver_id,
     $trip_id,
     'trip_cancellation',
     'minor',
     $reason,
     $note,
     NOW()
   );
   ```

   *Note: `penalty_type` should be added to the `penalties` table if not exists. Already the PRD mentions `warnings, suspensions, bans`, so we extend it with `trip_cancellation`.*

3. **Check for repeated violations:** If the driver has 3+ cancellations in the last 30 days, automatically upgrade to a suspension:
   - If 3–4 cancellations in 30 days → `warning` level.
   - If 5–6 cancellations in 30 days → `suspension` for 7 days.
   - If 7+ cancellations in 30 days → `suspension` for 30 days or `ban`.

   *This logic can be implemented as a background job or a trigger after penalty insertion.*

### 3.7 Error Scenarios
| Scenario | Response |
|----------|----------|
| Trip not found | `404 Not Found` |
| Driver does not own trip | `403 Forbidden` |
| Trip has confirmed bookings | `409 Conflict: Cannot cancel trip. There are confirmed bookings. Please contact support.` |
| Trip is already ongoing/completed | `409 Conflict: Trip is already ongoing or completed. Cannot cancel.` |
| Missing `reason` field | `422 Validation: reason is required` |
| Driver is suspended/banned | `403 Forbidden: Account is suspended. Cannot cancel trips.` |

### 3.8 WebSocket Notification
When a trip is cancelled, all passengers who had **bookings** on this trip (even if not confirmed? – only confirmed matters) should receive a notification:
- Event: `notification:new` with type `trip_cancelled`.
- Message: "The trip from [origin] to [destination] on [date] has been cancelled by the driver."

*Note: Since we ensure no confirmed bookings exist, this will only apply to passengers with `pending` bookings (if any).*

---

## 4. Notification Settings – `GET /settings/notifications` & `PUT /settings/notifications`

### 4.1 Purpose
Allow any user (passenger or driver) to enable/disable specific notification types for:
- **In-app notifications** (app inbox).
- **Push notifications** (FCM/APNS).

### 4.2 Data Model – New Table `notification_settings`

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL,
  enabled_in_app BOOLEAN DEFAULT TRUE,
  enabled_push BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type)
);

CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);
```

### 4.3 Notification Types (Predefined)

| Type | Description | Default |
|------|-------------|---------|
| `booking_confirmed` | Booking confirmed (passenger) / new booking (driver) | Enabled |
| `booking_cancelled` | Booking cancelled by other party | Enabled |
| `trip_reminder` | Reminder 1 hour before departure | Enabled |
| `trip_cancelled` | Trip cancelled by driver | Enabled |
| `driver_offer` | Driver sent an offer on a request (passenger) | Enabled |
| `ride_request_reply` | Passenger accepted/rejected offer (driver) | Enabled |
| `new_message` | New chat message received | Enabled |
| `rating_received` | New rating received | Enabled |
| `delay_report` | Driver reported a delay | Enabled |
| `sos_alert` | SOS triggered (admin only) | Enabled for admins |
| `enforcement_action` | Warning/suspension/ban notification | Enabled |
| `subscription_expiring` | Subscription expiring soon (driver) | Enabled |
| `system_announcement` | Platform announcements | Enabled |

### 4.4 `GET /settings/notifications`

**Authentication:** JWT

**Response (200 OK):**
```json
{
  "settings": [
    {
      "type": "booking_confirmed",
      "label": "تأكيد الحجز",
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
      "type": "trip_reminder",
      "label": "تذكير الرحلة",
      "enabled_in_app": true,
      "enabled_push": true
    },
    {
      "type": "new_message",
      "label": "رسائل جديدة",
      "enabled_in_app": true,
      "enabled_push": false
    }
  ]
}
```

*Note: If a user has no settings in the DB, return the default values (all `enabled_in_app = true`, `enabled_push = true` for passenger types, or admin types as appropriate).*

### 4.5 `PUT /settings/notifications`

**Authentication:** JWT

**Request Body:** (Partial update allowed)
```json
{
  "settings": [
    {
      "type": "new_message",
      "enabled_in_app": true,
      "enabled_push": false
    },
    {
      "type": "trip_reminder",
      "enabled_push": false
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Notification settings updated successfully.",
  "updated_count": 2
}
```

### 4.6 Logic for Sending Notifications

When any system event triggers a notification:
1. Check `notification_settings` for the target `user_id` and `notification_type`.
2. If `enabled_in_app = true` → store the notification in the `notifications` table (in-app inbox).
3. If `enabled_push = true` → send push notification via FCM/APNS.

If the user has **disabled** both, the notification is not delivered (but still logged for audit if needed).

### 4.7 Default Insertion on User Registration

When a new user registers, automatically insert default notification settings for all types:

```sql
INSERT INTO notification_settings (user_id, notification_type)
SELECT 
  $user_id,
  unnest(ARRAY[
    'booking_confirmed', 'booking_cancelled', 'trip_reminder', 
    'trip_cancelled', 'driver_offer', 'ride_request_reply', 
    'new_message', 'rating_received', 'delay_report', 
    'enforcement_action', 'subscription_expiring', 'system_announcement'
  ]) AS notification_type;
```

---

## 5. API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/trips/{trip_id}` | GET | Full trip details with passengers |
| `/trips/{trip_id}/cancel` | POST | Driver cancels trip (with reason + note, auto-penalty) |
| `/settings/notifications` | GET | Get current notification settings |
| `/settings/notifications` | PUT | Update notification settings (partial update allowed) |

---

## 6. Acceptance Criteria

### Trip Details
- [ ] `GET /trips/{trip_id}` returns all trip metadata, vehicle details, and a complete list of passengers with their profiles, seat numbers, and booking status.
- [ ] The endpoint is accessible to: the trip's driver, any passenger on the trip, and admins.
- [ ] If the trip has no bookings, `passengers` array is empty.

### Trip Cancellation
- [ ] Driver can cancel a trip only if `COUNT(bookings WHERE status = 'confirmed') = 0`.
- [ ] Driver must provide a `reason` (text) and optional `note`.
- [ ] A record is inserted into the `penalties` table with `penalty_type = 'trip_cancellation'`, `severity = 'minor'`.
- [ ] If the driver has 3+ cancellations in 30 days, the penalty is upgraded to a suspension.
- [ ] The trip status changes to `cancelled`.
- [ ] Passengers with pending bookings (if any) receive a WebSocket notification.
- [ ] Attempting to cancel a trip with confirmed bookings returns `409 Conflict`.

### Notification Settings
- [ ] `GET /settings/notifications` returns a list of all notification types with their current states.
- [ ] `PUT /settings/notifications` accepts partial updates (only some settings).
- [ ] Notification sending logic respects `enabled_in_app` and `enabled_push` flags.
- [ ] Default settings are inserted when a user registers.
- [ ] Admins see `sos_alert` type by default; regular users do not.

---

## 7. Database Migration Script

```sql
-- Add penalty_type column if not exists
ALTER TABLE penalties ADD COLUMN IF NOT EXISTS penalty_type VARCHAR(30) DEFAULT 'general' 
  CHECK (penalty_type IN ('general', 'trip_cancellation', 'no_show', 'misconduct', 'fraud'));

-- Add severity column if not exists
ALTER TABLE penalties ADD COLUMN IF NOT EXISTS severity VARCHAR(15) DEFAULT 'minor'
  CHECK (severity IN ('minor', 'moderate', 'major'));

-- Add trip_id reference to penalties if not exists
ALTER TABLE penalties ADD COLUMN IF NOT EXISTS trip_id UUID NULL REFERENCES trips(id);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL,
  enabled_in_app BOOLEAN DEFAULT TRUE,
  enabled_push BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);

-- Migration: Insert default settings for all existing users
INSERT INTO notification_settings (user_id, notification_type)
SELECT 
  u.id,
  t.notification_type
FROM users u
CROSS JOIN (SELECT unnest(ARRAY[
  'booking_confirmed', 'booking_cancelled', 'trip_reminder', 
  'trip_cancelled', 'driver_offer', 'ride_request_reply', 
  'new_message', 'rating_received', 'delay_report', 
  'enforcement_action', 'subscription_expiring', 'system_announcement'
]) AS notification_type) t
ON CONFLICT (user_id, notification_type) DO NOTHING;
```

---

## 8. Future Enhancements (Out of Scope)

- **Cancellation with Bookings:** Allowing driver to cancel with passengers booked would require compensation logic (refunds, rebooking assistance). This is a future feature if we ever handle payments.
- **Granular Push Channels:** Setting different tones/vibrations per notification type.
- **Time-Based Notification Muting:** "Do Not Disturb" hours.
- **Notification History:** An endpoint to view past notifications with pagination.
