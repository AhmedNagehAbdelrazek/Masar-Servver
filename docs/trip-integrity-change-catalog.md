# Masar Backend Change Catalog — Trip Integrity Release

**Backend release:** `3d5a381` + `e57c6fe`  
**Dashboard release:** `9695aec`  
**Catalog date:** 2026-11-10

Base paths:

- V1: `/api/v1`
- V2: `/api/v2`

---

## 1. New HTTP endpoint

### Driver abandons an in-progress trip

```http
POST /api/trips/:trip_id/abandon
Authorization: Bearer <driver_token>
Content-Type: application/json
```

#### Request body

`reason` is optional, max 500 characters.

```json
{
  "reason": "vehicle_issue"
}
```

#### Success `200`

```json
{
  "trip": {
    "id": "trip_uuid",
    "status": "abandoned"
  },
  "notified_passengers": 2
}
```

#### Effects

- Trip status changes to `abandoned`.
- All active `confirmed` / `pending` bookings are changed to `cancelled`.
- Booking `cancellation_reason` becomes `trip_abandoned`.
- Seats are released.
- Confirmed passengers receive a `trip_abandoned` notification.
- Socket event `tracking:ended` is emitted with `reason: "abandoned"`.
- Trip is never counted as completed.

#### Errors

| HTTP | Code | Meaning |
|---|---|---|
| 403 | `FORBIDDEN` | Caller is not the trip driver |
| 404 | `TRIP_NOT_FOUND` | Trip does not exist |
| 409 | `TRIP_NOT_IN_PROGRESS` | Trip is not `in_progress` / `ongoing` |

> The existing `POST /trips/:id/cancel` and `DELETE /trips/:id` still cannot stop an already-started trip. Use `abandon`.

---

## 2. Updated HTTP endpoints

### 2.1 Driver trip details

```http
GET /api/trips/:trip_id
```

#### New fields in `trip`

```json
{
  "trip": {
    "status": "published",
    "abandoned_at": null,
    "abandon_reason": null,
    "start_point": {
      "city": "Amman",
      "area": "Abdoun",
      "address": "Abdoun Bridge",
      "lat": 31.95,
      "lng": 35.91
    },
    "end_point": {
      "city": "Irbid",
      "area": "Downtown",
      "address": "Irbid Bus Station",
      "lat": 32.55,
      "lng": 35.85
    },
    "stops": [
      {
        "id": "stop_uuid",
        "stop_order": 1,
        "stop_name": "Salt",
        "city": "Salt",
        "address": "Salt Main Road",
        "stop_type": "both",
        "stop_lat": 32.03,
        "stop_lng": 35.72
      }
    ]
  }
}
```

#### New fields on each passenger

`passengers` now includes every linked booking, including `confirmed`, `completed`, `no_show`, and `cancelled`. The app should filter by `booking_status`.

```json
{
  "passengers": [
    {
      "booking_id": "booking_uuid",
      "booking_status": "confirmed",
      "pickup": {
        "place": "Abdoun Bridge",
        "label": "Abdoun pickup",
        "city": "Amman",
        "area": "Abdoun",
        "lat": 31.95,
        "lng": 35.91,
        "order": 1,
        "type": "stop",
        "stop_id": "stop_uuid",
        "status": "pending",
        "arrived_at": null,
        "picked_up_at": null
      },
      "dropoff": {
        "place": "Irbid Downtown",
        "lat": 32.55,
        "lng": 35.85,
        "order": 2,
        "deadline": "2026-11-10T17:00:00.000Z",
        "dropped_off_at": null
      }
    }
  ]
}
```

- `passengers[].pickup.status` now supports `dropped_off`.
- `trip.status` now supports `abandoned`.
- `trip.abandoned_at` and `trip.abandon_reason` are now exposed.
- The existing `waypoints` field remains.

---

### 2.2 Driver trip list

```http
GET /api/trips/driver/my-trips?status=abandoned
```

Changes:

- `status=abandoned` is accepted.
- Returned `status` can be `abandoned`.
- Each trip now includes:
  - `abandoned_at`
  - `abandon_reason`

---

### 2.3 Mark passenger pickup / drop-off

```http
PATCH /api/trips/:trip_id/pickups/:booking_id
```

#### Request

`pickup_status` now supports `dropped_off`:

```json
{
  "pickup_status": "dropped_off"
}
```

Allowed values:

```text
pending
arrived
picked_up
dropped_off
missed
```

#### Response

```json
{
  "booking_id": "booking_uuid",
  "pickup_status": "dropped_off"
}
```

#### Behavior

- `arrived` sets `arrived_at`.
- `picked_up` sets `picked_up_at`.
- `dropped_off`:
  - Sets `dropped_off_at`
  - Sets booking status to `completed`
  - Sets payment status to `paid_cash`
  - Sets `completed_at`
- `tracking:pickup_status` socket event now carries `state: "dropped_off"`.

---

### 2.4 Complete a trip

```http
POST /api/trips/:trip_id/complete
```

The response shape is unchanged, but completion rules changed.

#### New completion behavior

- Bookings marked `picked_up` or `dropped_off` become `completed`.
- Bookings not marked picked up / dropped off become `no_show`.
- Payment status for completed bookings becomes `paid_cash`.

#### Important for the driver app

The driver should mark passengers as `dropped_off` before completing the trip. Otherwise those passengers will be recorded as `no_show`.

---

### 2.5 Submit a ride-request offer

```http
POST /api/ride-requests/:request_id/offers
```

Request shape is unchanged:

```json
{
  "trip_id": "optional_trip_uuid",
  "offered_fare": 15,
  "message": "I can take you"
}
```

#### New validation

- If `trip_id` is provided:
  - It must belong to the driver.
  - It must be `published` or `full`.
  - It must not have departed.
  - The driver must not have another blocking trip overlapping it.
- If `trip_id` is not provided, the requested time is checked against the driver's existing blocking trips.

#### New error

| HTTP | Code | Meaning |
|---|---|---|
| 409 | `TRIP_TIME_OVERLAP` | Driver already has a trip occupying that time |

---

### 2.6 Passenger accepts/declines an offer

```http
PUT /api/offers/:offer_id
```

Request:

```json
{
  "action": "accept"
}
```

#### New behavior on accept

Accepting an offer now automatically materializes:

- A trip on the driver schedule, either:
  - The offer's linked trip, or
  - A matching trip, or
  - A newly created trip
- A confirmed booking for the passenger

The response now contains populated:

```json
{
  "offer": {
    "id": "offer_uuid",
    "status": "accepted",
    "trip_id": "trip_uuid",
    "booking_id": "booking_uuid",
    "agreed_fare": 15,
    "offered_fare": 15
  }
}
```

#### App change required

After accepting an offer, **do not call `/trips/:id/offers/:offer_id/attach`**. The trip and booking already exist.

If the app calls attach afterwards, it receives:

| HTTP | Code |
|---|---|
| 409 | `OFFER_ALREADY_ATTACHED_TO_A_BOOKING` |

---

### 2.7 Attach an accepted offer to a trip

```http
POST /api/trips/:trip_id/offers/:offer_id/attach
```

This endpoint remains available for legacy/manual flows, but is no longer part of the normal accept flow.

- It now also validates driver time availability.
- It returns `TRIP_TIME_OVERLAP` if the trip conflicts with another trip.
- It returns `OFFER_ALREADY_ATTACHED_TO_A_BOOKING` when the offer was already materialized.

---

### 2.8 Directly accept a ride request

```http
POST /api/ride-requests/:request_id/accept
```

Response shape is unchanged:

```json
{
  "trip": { "...": "..." },
  "booking": { "...": "..." },
  "offer": { "...": "..." }
}
```

New behavior:

- An explicit `trip_id` is checked against the driver's schedule.
- Matching trips are reused when possible.
- A new normal trip is created when no matching trip exists.
- The resulting trip appears in `GET /trips/driver/my-trips` and normal trip search.
- Remaining seats remain bookable.

---

### 2.9 Booking responses

```http
GET /api/bookings
GET /api/bookings/:booking_id
```

Changes:

- Booking status can now become `no_show` when a trip completes and the passenger was never marked picked up.
- Bookings on an abandoned trip become `cancelled` with reason `trip_abandoned`.
- Booking detail now includes:

```json
{
  "dropped_off_at": "2026-11-10T15:30:00.000Z"
}
```

Existing booking status enum remains:

```text
pending
confirmed
cancelled
completed
no_show
```

---

### 2.10 Booking route view

```http
GET /api/bookings/:booking_id/route
```

No shape change, but:

```json
{
  "my_pickup": {
    "pickup_status": "dropped_off"
  }
}
```

`pickup_status` can now be `dropped_off`.

---

## 3. New socket event

### `app:notification`

This is the new generic notification event for app developers.

#### Payload

```json
{
  "type": "new_message",
  "message": "Ahmad sent you a new message.",
  "metadata": {
    "conversation_type": "booking",
    "booking_id": "booking_uuid",
    "trip_id": "trip_uuid",
    "message_id": "message_uuid",
    "sender_id": "user_uuid",
    "sender_name": "Ahmad",
    "created_at": "2026-11-10T12:30:00.000Z"
  }
}
```

- `type` identifies the component/action to show.
- `message` is the localized notification body.
- `metadata` contains navigation and entity IDs.

The existing `notification:new` event is unchanged and still fires with its old payload:

```json
{
  "id": "...",
  "type": "...",
  "title": "...",
  "body": "...",
  "data": { "...": "..." },
  "created_at": "...",
  "timestamp": 123456789
}
```

`app:notification` is emitted when an in-app notification is created. If the user has disabled in-app notifications for a type, only push/SMS may fire.

---

## 4. Updated socket events

### `chat:receive`

Payload is unchanged.

New behavior:

- Chat messages now also create a `NEW_MESSAGE` in-app notification.
- The other participant receives `app:notification`.
- The sender is never notified for their own message.

### `tracking:pickup_status`

Payload:

```json
{
  "trip_id": "trip_uuid",
  "booking_id": "booking_uuid",
  "state": "dropped_off"
}
```

New `state` value:

```text
dropped_off
```

Previous values remain:

```text
arrived
picked_up
missed
```

### `tracking:ended`

Payload unchanged:

```json
{
  "trip_id": "trip_uuid",
  "reason": "abandoned"
}
```

New `reason` value:

```text
abandoned
```

Previously:

```text
completed
cancelled
```

### `tracking:next_pickup`

No payload change, but bookings with `pickup_status = "dropped_off"` are now excluded from "next pickup" calculations.

### `notification:count`

Unchanged.

---

## 5. New / updated notification types

| Type | Recipient | Channels | When |
|---|---|---|---|
| `trip_reminder` | Driver | push + in-app | 10 minutes before departure |
| `trip_abandoned` | Passengers | in-app + push | Driver abandons trip |
| `trip_abandon_warning` | Driver | SMS | No driver activity for 10 minutes during an active trip |
| `new_message` | Chat recipient | in-app + push | New booking/support chat message |

Existing types remain unchanged.

### Reminder behavior

- Job runs every minute.
- Default lead time: **10 minutes**.
- Configurable with `TRIP_REMINDER_LEAD_MINUTES`.
- Recurring trips calculate each occurrence separately.
- Duplicate reminders are prevented by the `trip_reminders` table.
- Driver must have an FCM token registered through the existing:

```http
POST /api/notifications/device
```

### Abandonment behavior

- Default SMS warning: **10 minutes** without activity.
- Default auto-abandon: **20 minutes** without activity.
- Configurable with:
  - `TRIP_ABANDON_WARN_MINUTES`
  - `TRIP_ABANDON_AFTER_MINUTES`

---

## 6. New / updated statuses

### Trip status

```text
published
full
in_progress
ongoing
completed
abandoned   ← new
cancelled
```

### Pickup status

```text
pending
arrived
picked_up
dropped_off   ← new
missed
```

### Booking status

No new enum value, but new behavior:

- `completed`: passenger was picked up/dropped off.
- `no_show`: passenger was not picked up when the trip completed.
- `cancelled` with `cancellation_reason = "trip_abandoned"` on abandoned trips.

---

## 7. App implementation checklist

1. **Driver app**
   - Add "Stop / Abandon Trip" action.
   - Call `POST /trips/:id/abandon` with optional reason.
   - Display trip status `abandoned`.
   - Add `dropped_off` pickup action.
   - Mark passengers dropped off before completing the trip.
   - Handle `no_show` labelling.
   - Handle `TRIP_TIME_OVERLAP` on offer submission and acceptance.

2. **Passenger app**
   - Handle `abandoned` trip status.
   - Handle `no_show` booking status.
   - Read `dropped_off_at`.
   - Render `start_point`, `end_point`, `stops`, and `pickup`/`dropoff` from trip details.
   - Handle payment/refund messaging for abandoned trips.

3. **Chat**
   - Listen to `app:notification`.
   - Map `metadata.conversation_type` to booking/support chat screens.
   - Keep the `notification:new` listener temporarily for backwards compatibility.

4. **Ride-request flow**
   - Do not call `attach` after accepting an offer.
   - Refresh the driver schedule immediately after offer acceptance, because the trip and booking already exist.
   - Treat `409 TRIP_TIME_OVERLAP` as "driver already has a trip at that time".

5. **Push**
   - Ensure FCM token registration uses `POST /notifications/device`.
   - Handle `trip_reminder` notifications deep-linking to `trip_details` using `metadata.trip_id`.

---

## 8. Deployment requirement

Apply:

```text
main-server/migrations/versions/034-trip-integrity-reminders.js
```

This migration adds:

- `trips.abandoned_at`
- `trips.abandon_reason`
- `trips.abandon_warned_at`
- `bookings.dropped_off_at`
- `trip_reminders` table
- `TripStatus.abandoned` enum value
- `PickupStatus.dropped_off` enum value

The migration supports both enum naming conventions present in the shared databases.

Before deployment, also confirm:

- Firebase/FCM credentials are configured.
- `JOB_TRIP_REMINDER_CRON` is enabled.
- `JOB_TRIP_LIFECYCLE_CRON` is enabled.
- The driver app registers its FCM token.

---

## 9. Developer test accounts

Two dedicated accounts are available with the fixed OTP `000000`:

| Role | Phone | Password |
|---|---|---|
| Driver | `+962700000001` | `Test@1234` |
| Passenger | `+962700000002` | `Test@1234` |

The driver comes with a verified vehicle so it can publish trips immediately.
Admins can permanently delete either account and all related history with:

```http
DELETE /api/v1/admin/users/:user_id
Authorization: Bearer <admin_token>
```

V2 uses `/api/v2/admin/users/:user_id`. Only configured developer phones are
eligible. See `docs/developer-accounts.md` for configuration and the full
deletion list.
