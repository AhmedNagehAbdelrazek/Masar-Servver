# Feature: Driver Home Screen API & Interactive Actions

## 1. Overview
This feature defines the backend API endpoints that power the driver's main home screen (as shown in the UI mockup). The home screen is the driver's primary dashboard after login, displaying:

- Greeting & driver name.
- Current subscription plan and expiration.
- The next upcoming trip (with full details and actions).
- Summary statistics (completed trips, reserved seats for next trip, trips today).
- Recent bookings (last 5 reservations) with passenger details.

In addition, we specify the supporting endpoints for the interactive buttons visible on this screen (e.g., "Start Ride", "View Details").

## 2. User Story
As a driver, when I open the app, I see my home screen with my subscription status, my next trip, key metrics, and recent bookings at a glance. I can tap "Start Ride" to begin the trip, "View Details" to see the full trip itinerary, or interact with other elements. All data is fetched in one efficient call, with minimal latency.

## 3. API Endpoints

### 3.1 `GET /driver/home` – Driver Home Screen Data

**Authentication:** JWT (must be a driver).

**Purpose:** Returns a combined payload that contains everything needed to render the home screen.

**Response (200 OK):**

```json
{
  "driver": {
    "id": "u_123",
    "full_name": "أحمد",
    "profile_picture_url": "https://...",
    "rating": 4.8,
    "total_trips_completed": 142
  },
  "subscription": {
    "tier": "pro",
    "price": 16.00,
    "currency": "JOD",
    "expires_at": "2026-08-15T23:59:59Z",
    "days_remaining": 19
  },
  "next_trip": {
    "trip_id": "t_456",
    "origin_city": "عمان",
    "origin_area": "صويح",
    "destination_city": "إربد",
    "destination_area": "عرش الكل",
    "departure_time": "2026-08-11T08:30:00Z",
    "fare_per_seat": 5.00,
    "currency": "JOD",
    "total_seats": 4,
    "available_seats": 0,
    "booked_seats_count": 3,
    "vehicle": {
      "make_model": "Hyundai Elantra",
      "year": 2021,
      "plate_number": "ABC-1234",
      "color": "White"
    },
    "status": "published",   // published, ongoing, completed
    "passengers": [
      {
        "booking_id": "b_789",
        "passenger_name": "محمد خالد",
        "seats_booked": 2,
        "seat_numbers": [2, 3]
      },
      {
        "booking_id": "b_790",
        "passenger_name": "سارة أحمد",
        "seats_booked": 1,
        "seat_numbers": [4]
      }
    ],
    "can_start": true   // True if the trip is published and departure time is near (within 1 hour) or already past but not started.
  },
  "summary": {
    "completed_trips_today": 1,
    "reserved_seats_for_next_trip": 3,   // same as booked_seats_count above
    "trips_today": 1
  },
  "recent_bookings": [
    {
      "booking_id": "b_789",
      "trip": {
        "trip_id": "t_456",
        "origin_city": "عمان",
        "destination_city": "إربد",
        "departure_time": "2026-08-11T08:30:00Z"
      },
      "passenger_name": "محمد خالد",
      "seats_booked": 2,
      "seat_numbers": [2, 3],
      "agreed_fare": 5.00,
      "status": "confirmed",   // confirmed, completed, no_show, cancelled
      "created_at": "2026-08-10T18:00:00Z"
    },
    {
      "booking_id": "b_790",
      "trip": {
        "trip_id": "t_456",
        "origin_city": "عمان",
        "destination_city": "إربد",
        "departure_time": "2026-08-11T08:30:00Z"
      },
      "passenger_name": "سارة أحمد",
      "seats_booked": 1,
      "seat_numbers": [4],
      "agreed_fare": 5.00,
      "status": "confirmed",
      "created_at": "2026-08-10T19:00:00Z"
    },
    {
      "booking_id": "b_791",
      "trip": {
        "trip_id": "t_455",
        "origin_city": "عمان",
        "destination_city": "السلط",
        "departure_time": "2026-08-10T10:00:00Z"
      },
      "passenger_name": "السامراء",
      "seats_booked": 1,
      "seat_numbers": [1],
      "agreed_fare": 3.50,
      "status": "completed",
      "created_at": "2026-08-09T12:00:00Z"
    }
  ]
}
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| `driver` | Driver's basic profile info. |
| `subscription` | Current subscription tier, price, expiry, and days remaining. |
| `next_trip` | The driver's next upcoming trip (the earliest departure time in the future). If none, this field is `null`. Contains full details and the list of passengers with booked seats. |
| `next_trip.can_start` | Boolean indicating whether the "Start Ride" button should be enabled (trip is published and departure time is within ±1 hour, or already overdue but not marked ongoing). |
| `summary` | Quick stats: completed trips today, reserved seats for the next trip (if any), and total trips scheduled for today (including completed and pending). |
| `recent_bookings` | Last 5 bookings (across all trips) ordered by `created_at DESC`. Shows passenger name, trip info, seats, and status. |

**Implementation Notes:**
- `next_trip` is determined by querying `trips` where `driver_id = current_user` and `departure_time > NOW()` and `status IN ('published', 'full')`, ordered by `departure_time ASC LIMIT 1`.
- `summary.trips_today` counts all trips for today (by departure_date) regardless of status.
- `summary.completed_trips_today` counts trips with `status = 'completed'` for today.
- `recent_bookings` can be fetched from `bookings` joined with `trips` where `trips.driver_id = current_user`, ordered by `bookings.created_at DESC LIMIT 5`.

---

### 3.2 `POST /trips/{trip_id}/start` – Start a Trip

**Authentication:** JWT (driver must own the trip).

**Purpose:** Marks the trip as `ongoing`. This triggers:
- Live tracking starts (driver should start sending location updates via WebSocket).
- Passengers receive a notification that the trip has begun.
- The `can_start` flag becomes `false` for this trip.

**Request:** (Empty body)

**Response (200 OK):**
```json
{
  "message": "Trip started successfully.",
  "trip_id": "t_456",
  "status": "ongoing",
  "tracking_link": "wss://api.masar.app/socket.io?trip=t_456"
}
```

**Error Scenarios:**
- `403 Forbidden` – Driver does not own this trip.
- `409 Conflict` – Trip already started or completed.
- `400 Bad Request` – Trip departure time is more than 1 hour in the future (too early to start).

---

### 3.3 `GET /trips/{trip_id}` – Get Full Trip Details

**Authentication:** JWT (driver or passenger on that trip).

**Purpose:** Returns the complete itinerary of a specific trip, including all waypoints, seat map, passenger list, and status. This is the "View Details" action from the home screen.

**Response:** (Should match the existing `GET /trips/{id}` defined earlier in the PRD, but we ensure it includes all fields.)

*We already have a `GET /trips` endpoint for search; a separate `GET /trips/{trip_id}` should return detailed info, including all seats and passengers.*

---

### 3.4 `GET /driver/subscription` – Subscription Details (Optional)

**Authentication:** JWT (driver).

**Purpose:** If the home screen needs to show subscription upgrade options or detailed billing info, this endpoint provides the full subscription history and current plan.

Not strictly required for home screen if already included in `GET /driver/home`, but useful for a separate "Subscription" page.

---

## 4. Database Queries (Optimization)

To reduce latency, the home screen API should execute the following queries in parallel (or use a single query with JSON aggregation):

**Query 1:** Driver profile + subscription (from `users` and `subscriptions` table – we assume a `subscriptions` table exists; if not, we add it).

**Query 2:** Next trip with vehicle and passenger bookings.

```sql
SELECT 
  t.*,
  json_build_object('make_model', v.make_model, 'year', v.year, 'plate_number', v.plate_number, 'color', v.color) as vehicle,
  (
    SELECT json_agg(
      json_build_object(
        'booking_id', b.id,
        'passenger_name', u.full_name,
        'seats_booked', b.seats_booked,
        'seat_numbers', (SELECT array_agg(seat_number) FROM booking_seats WHERE booking_id = b.id)
      )
    )
    FROM bookings b
    JOIN users u ON b.passenger_id = u.id
    WHERE b.trip_id = t.id AND b.status = 'confirmed'
  ) as passengers
FROM trips t
JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.driver_id = $1 
  AND t.departure_time > NOW()
  AND t.status IN ('published', 'full')
ORDER BY t.departure_time ASC
LIMIT 1;
```

**Query 3:** Summary stats (can be combined with query 2 or separate aggregations).

**Query 4:** Recent bookings (last 5).

Use Redis caching for this endpoint (TTL = 30 seconds) to avoid hitting the DB on every screen refresh.

---

## 5. Edge Cases & Error Handling

| Scenario | Response |
|----------|----------|
| Driver has no upcoming trips | `next_trip: null`; summary fields that depend on it show `0`. |
| Driver has no bookings at all | `recent_bookings: []`. |
| Subscription expired | `subscription` shows `tier: 'free'` (or `null`) and `days_remaining: 0`. |
| Driver is not verified | `403 Forbidden` (home screen should not be accessible). |
| Driver account is suspended/banned | `403 Forbidden` with appropriate message. |

---

## 6. UI Integration Notes (Based on Screenshot)

| UI Element | Data Source |
|------------|-------------|
| Greeting "مرحباً، أحمد" | `driver.full_name` |
| Subscription banner "باقة 16 دينارًا" + expiry days | `subscription.tier`, `subscription.price`, `subscription.days_remaining` |
| Next trip card – origin/destination, time, fare, vehicle | `next_trip.*` |
| "عرض التفاصيل" button | Navigates to `GET /trips/{trip_id}` |
| "بدء الرحلة" button | Calls `POST /trips/{trip_id}/start` |
| Summary tiles (الرحلات المكتملة, المقاعد المحجوزة, رحلات اليوم) | `summary.*` |
| Last bookings list | `recent_bookings` array |

---

## 7. Acceptance Criteria

- [ ] `GET /driver/home` returns a valid JSON response within 500ms (cached) with all required fields.
- [ ] The `next_trip` object includes passenger names and seat numbers for the upcoming trip.
- [ ] The `can_start` flag is correctly computed based on departure time and trip status.
- [ ] `POST /trips/{trip_id}/start` updates the trip status to `ongoing` and notifies passengers via WebSocket.
- [ ] `GET /trips/{trip_id}` returns the detailed trip view, including all waypoints and seat map.
- [ ] All endpoints properly handle JWT authentication and authorization (driver-specific).
- [ ] When the driver has no upcoming trips, the response gracefully handles nulls.

---

## 8. Future Enhancements (Out of Scope)

- Pagination for recent bookings (currently fixed at 5).
- Filtering by date range for summary stats.
- Ability to cancel/end trip from the home screen.
- Multi-language support for the response fields (currently returns data in Arabic from the DB; UI handles translation).
```
