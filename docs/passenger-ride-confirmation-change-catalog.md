# Masar Backend Change Catalog — Passenger Ride Confirmation

**Catalog date:** 2026-11-10

Base paths:

- V1: `/api/v1`
- V2: `/api/v2`

This release makes passenger completion depend on the passenger confirming
boarding and leaving, and adds the driver's post-trip passenger confirmation.

---

## 1. New passenger endpoints

### Confirm ride started

```http
POST /api/bookings/:booking_id/ride/start
Authorization: Bearer <passenger_token>
```

No body.

Success `200`:

```json
{
  "booking_id": "booking_uuid",
  "trip_id": "trip_uuid",
  "booking_status": "confirmed",
  "ride_status": "in_progress",
  "passenger_started_at": "2026-11-10T12:00:00.000Z",
  "passenger_ended_at": null,
  "driver_confirmed_at": null,
  "driver_confirmed_on_trip": null,
  "passenger_can_rate": false,
  "driver_can_rate": false
}
```

Effects:

- Sets `passenger_started_at`.
- If the driver has not already marked the pickup, sets
  `pickup_status` to `picked_up` and `picked_up_at`.
- Emits `tracking:ride_status` with `state: "started"`.
- Emits `tracking:pickup_status` with `state: "picked_up"` when applicable.

Errors:

| HTTP | Code | Meaning |
|---|---|---|
| 403 | `FORBIDDEN` | Booking belongs to another passenger |
| 404 | `BOOKING_NOT_FOUND` | Booking does not exist |
| 409 | `RIDE_IS_NOT_ACTIVE` | Booking is cancelled or no-show |
| 409 | `TRIP_IS_NO_LONGER_ACTIVE` | Trip is cancelled/abandoned |
| 409 | `TRIP_HAS_NOT_STARTED_YET` | Trip is still published/full |

### Confirm ride ended

```http
POST /api/bookings/:booking_id/ride/end
Authorization: Bearer <passenger_token>
```

No body.

Success `200`:

```json
{
  "booking_id": "booking_uuid",
  "trip_id": "trip_uuid",
  "booking_status": "completed",
  "ride_status": "completed",
  "passenger_started_at": "2026-11-10T12:00:00.000Z",
  "passenger_ended_at": "2026-11-10T13:10:00.000Z",
  "driver_confirmed_at": null,
  "driver_confirmed_on_trip": null,
  "passenger_can_rate": true,
  "driver_can_rate": true
}
```

Effects:

- Sets `passenger_ended_at`.
- Sets `pickup_status` to `dropped_off`.
- Sets `dropped_off_at`, `completed_at`, and booking status `completed`.
- Sets `payment_status` to `paid_cash` when it was `pending`.
- Emits `tracking:ride_status` with `state: "ended"`.
- Emits `tracking:pickup_status` with `state: "dropped_off"`.

Errors:

| HTTP | Code | Meaning |
|---|---|---|
| 403 | `FORBIDDEN` | Booking belongs to another passenger |
| 409 | `PASSENGER_RIDE_NOT_STARTED` | Passenger did not confirm start first |
| 409 | `TRIP_IS_NO_LONGER_ACTIVE` | Trip is cancelled/abandoned |

Both endpoints are idempotent. Repeating them returns the existing timestamps.

---

## 2. New driver endpoint

### Confirm passengers after the trip

```http
POST /api/trips/:trip_id/confirm-passengers
Authorization: Bearer <driver_token>
Content-Type: application/json
```

The trip must be `completed`. Send at least one booking. Maximum 100.

```json
{
  "passengers": [
    { "booking_id": "booking_uuid_1", "was_on_trip": true },
    { "booking_id": "booking_uuid_2", "was_on_trip": false }
  ]
}
```

Success `200`:

```json
{
  "trip_id": "trip_uuid",
  "confirmed_at": "2026-11-10T14:00:00.000Z",
  "passengers": [
    {
      "booking_id": "booking_uuid_1",
      "passenger_id": "passenger_uuid_1",
      "was_on_trip": true,
      "booking_status": "completed",
      "driver_confirmed_at": "2026-11-10T14:00:00.000Z"
    },
    {
      "booking_id": "booking_uuid_2",
      "passenger_id": "passenger_uuid_2",
      "was_on_trip": false,
      "booking_status": "no_show",
      "driver_confirmed_at": "2026-11-10T14:00:00.000Z"
    }
  ]
}
```

Semantics:

- `was_on_trip: true` confirms the passenger rode. A `no_show` booking is
  restored to `completed`.
- `was_on_trip: false` records the no-show confirmation. It is only allowed
  for a booking that is still `no_show` / was never boarded.
- A `completed` booking cannot be downgraded to `no_show` here; that needs
  admin review. The API returns
  `409 PASSENGER_ALREADY_MARKED_AS_COMPLETED`.
- Emits `tracking:ride_status` with `state: "driver_confirmed"` for each
  booking.

Errors:

| HTTP | Code | Meaning |
|---|---|---|
| 403 | `FORBIDDEN` | Trip belongs to another driver |
| 404 | `TRIP_NOT_FOUND` / `BOOKING_NOT_FOUND` | Missing trip or booking |
| 409 | `TRIP_NOT_COMPLETED` | Trip has not been completed |
| 409 | `PASSENGER_ALREADY_MARKED_AS_COMPLETED` | Cannot mark a completed passenger as no-show |
| 422 | `VALIDATION_ERROR` | Empty list, duplicate booking, or invalid boolean |

---

## 3. New booking / trip response fields

Booking list, booking detail, booking route, and trip-detail passenger objects
now include:

```json
{
  "ride_status": "in_progress",
  "passenger_started_at": "2026-11-10T12:00:00.000Z",
  "passenger_ended_at": null,
  "driver_confirmed_at": null,
  "driver_confirmed_on_trip": null,
  "passenger_can_rate": false,
  "driver_can_rate": false
}
```

`ride_status` values:

```text
not_started
in_progress
awaiting_end
completed
no_show
cancelled
```

- `awaiting_end`: the trip has ended but the passenger has not confirmed the
  end yet.
- `passenger_can_rate`: passenger confirmed the end.
- `driver_can_rate`: trip is completed and the booking is completed.

The booking route response exposes the same fields at the top level next to
`my_pickup`.

---

## 4. Rating rules

### Passenger rating the driver

```http
POST /api/ratings
```

Allowed only after:

```text
passenger_ended_at IS NOT NULL
```

Otherwise:

| HTTP | Code |
|---|---|
| 409 | `RIDE_NOT_COMPLETED` |

### Driver rating the passenger

Allowed only after:

```text
trip.status = completed
booking.status = completed
```

Otherwise:

| HTTP | Code |
|---|---|
| 409 | `TRIP_NOT_COMPLETED` |

Idempotency is unchanged: one rating per booking per rater.

---

## 5. Driver no-show complaints

For a driver filing a `no_show` complaint with `booking_id`:

- `accused_id` must equal the booking passenger.
- The trip must be `completed`.
- The booking must be `no_show` or have
  `driver_confirmed_on_trip = false`.

Otherwise the API returns one of:

| HTTP | Code |
|---|---|
| 409 | `TRIP_NOT_COMPLETED` |
| 409 | `PASSENGER_IS_NOT_MARKED_AS_NO_SHOW` |
| 422 | `VALIDATION_ERROR` (accused is not the booking passenger) |

Passenger complaints against a driver are unchanged.

---

## 6. New push / in-app notifications

| Type | Recipient | When |
|---|---|---|
| `passenger_ride_start_prompt` | Passenger | Trip starts and the passenger has not confirmed boarding |
| `passenger_ride_end_prompt` | Passenger | Driver marks dropped off or trip completes, and the passenger confirmed start but not end |
| `driver_confirm_passengers` | Driver | Trip completes |

Payload metadata includes `trip_id`, `booking_id`, and `action`
(`confirm_ride_start`, `confirm_ride_end`, or `confirm_passengers`).

Passengers who never confirmed start are also prompted after trip completion
so they can still confirm late.

---

## 7. New socket event

### `tracking:ride_status`

```json
{
  "trip_id": "trip_uuid",
  "booking_id": "booking_uuid",
  "state": "started",
  "booking_status": "confirmed",
  "ride_status": "in_progress",
  "passenger_started_at": "2026-11-10T12:00:00.000Z",
  "passenger_ended_at": null,
  "driver_confirmed_at": null,
  "driver_confirmed_on_trip": null,
  "passenger_can_rate": false,
  "driver_can_rate": false
}
```

`state` values:

```text
started
ended
driver_confirmed
```

The existing `tracking:pickup_status` event still fires alongside
`started`/`ended` with `picked_up`/`dropped_off`.

---

## 8. Migration

Apply:

```text
main-server/migrations/versions/035-passenger-ride-confirmation.js
```

V2 also includes the matching Prisma migration:

```text
nest-server/prisma/migrations/20261110120000_passenger_ride_confirmation/migration.sql
```

Both use `IF NOT EXISTS`, so they can run in either order against the shared
database.

Adds to `bookings`:

- `passenger_started_at`
- `passenger_ended_at`
- `driver_confirmed_at`
- `driver_confirmed_on_trip`
- `idx_bookings_trip_driver_confirmed`

---

## 9. App implementation checklist

1. Passenger app
   - Show “Start my ride” while the trip is in progress.
   - Call `POST /bookings/:id/ride/start`.
   - Show “End my ride” after start.
   - Call `POST /bookings/:id/ride/end`.
   - Handle the two push prompts and deep-link using `booking_id`.
   - Use `ride_status` and `passenger_can_rate` to decide when to show rating.
   - Show the end prompt after the driver marks dropped off or the trip completes.

2. Driver app
   - Handle `passenger_ride_start_prompt`/`passenger_ride_end_prompt` metadata
     only where relevant; these go to passengers.
   - After completing a trip, show the passenger confirmation screen using the
     trip passenger list and `driver_confirmed_on_trip`.
   - Submit `POST /trips/:id/confirm-passengers`.
   - Allow a `no_show` complaint only for passengers confirmed as not riding.
   - Use `driver_can_rate` to show the passenger rating action.

3. Live updates
   - Listen to `tracking:ride_status`.
   - Update the booking card on `started`, `ended`, and `driver_confirmed`.
   - Keep the existing `tracking:pickup_status` listener.
