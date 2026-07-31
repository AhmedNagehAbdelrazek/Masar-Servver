
```markdown
# Feature: Driver Trip Creation & Dashboard

## 1. User Story
As a verified driver, I want to create a trip with precise origin/destination details (city, area, coordinates), waypoints, per-seat availability configuration, recurrence (one-time or repeated), passenger gender filters, and additional instructions. I also want a consolidated dashboard to view my account, upcoming schedule, summary metrics, and reservation history.

## 2. Data Model Changes

### 2.1 New/Modified Database Tables

#### `trips` table – ADD these columns:

| Column | Type | Description |
|--------|------|-------------|
| `origin_area` | VARCHAR(120) | Neighborhood/district of origin (e.g., "7th Circle") |
| `origin_lat` | DECIMAL(10,8) | Latitude of origin |
| `origin_lng` | DECIMAL(11,8) | Longitude of origin |
| `destination_area` | VARCHAR(120) | Neighborhood/district of destination |
| `destination_lat` | DECIMAL(10,8) | Latitude of destination |
| `destination_lng` | DECIMAL(11,8) | Longitude of destination |
| `recurrence_days` | SMALLINT[] | Array of day-of-week integers (0=Sunday, 6=Saturday). NULL for one-time trips |
| `recurrence_end_date` | TIMESTAMPTZ | End date for recurring trips. NULL if no end date |
| `driver_instructions` | TEXT[] | e.g., ["Please be ready 10 mins early", "No smoking"] |
| `additional_instructions` | TEXT | e.g., "No eating inside the car" |
| `gender_preference` | VARCHAR(10) | 'all', 'women_only', 'men_only' (maps to trip_attributes) |

*Note: `is_recurring` stays as BOOLEAN (true when recurrence_days is not null).*

#### `trip_seats` – NEW TABLE:

Stores per-seat configuration for each trip (specific seat numbers and their availability).

```sql
CREATE TABLE trip_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seat_number SMALLINT NOT NULL,
  seat_type VARCHAR(15) NOT NULL CHECK (seat_type IN ('driver', 'unavailable', 'available')),
  UNIQUE (trip_id, seat_number)
);

CREATE INDEX idx_trip_seats_trip ON trip_seats(trip_id);
```

**Rules:**
- `seat_type = 'driver'` → the driver's own seat (not bookable by passengers)
- `seat_type = 'unavailable'` → broken/not available for this trip
- `seat_type = 'available'` → bookable by passengers
- `trips.total_seats` = total rows in `trip_seats`
- `trips.available_seats` = COUNT of rows where `seat_type = 'available'`

#### `trip_stops` – Use Existing Table (already defined in PRD):

This table holds waypoints (points the driver will pass through). Ensure it matches:
```sql
-- already exists, but confirm columns:
-- id, trip_id, stop_order, stop_name, stop_lat, stop_lng
```

### 2.2 Mapping Input Fields → Database

| Input Field | Database Column/Table |
|-------------|-----------------------|
| `origin_city` | `trips.origin_city` |
| `origin_area` | `trips.origin_area` (NEW) |
| `origin_lat` | `trips.origin_lat` (NEW) |
| `origin_lng` | `trips.origin_lng` (NEW) |
| `destination_city` | `trips.destination_city` |
| `destination_area` | `trips.destination_area` (NEW) |
| `destination_lat` | `trips.destination_lat` (NEW) |
| `destination_lng` | `trips.destination_lng` (NEW) |
| `waypoints[]` | `trip_stops` (existing) – one row per stop |
| `seats[]` | `trip_seats` (NEW) – one row per seat |
| `departure_date` + `departure_time` | `trips.departure_time` (combine into TIMESTAMPTZ) |
| `type_of_trip: once` | `trips.is_recurring = false`, `recurrence_days = NULL` |
| `type_of_trip: repeated` | `trips.is_recurring = true`, `recurrence_days = [0,2,4]` (example) |
| `repeated_days` | `trips.recurrence_days` (array of integers) |
| `repeated_end_date` | `trips.recurrence_end_date` |
| `allowed_type` | `trips.gender_preference` AND/OR `trip_attributes` (`women_only` / `men_only`) |
| `fare_per_seat` | `trips.fare_per_seat` |
| `instructions` | `trips.driver_instructions` (NEW, TEXT[]) |
| `additional_instructions` | `trips.additional_instructions` (NEW) |

---

## 3. API Endpoints

### 3.1 `GET /vehicles/{vehicle_id}` – Get Vehicle Details

**Purpose:** Returns vehicle info including total seats (so the driver knows how many seats to configure in the trip form).

**Response:**
```json
{
  "vehicle_id": "v_123",
  "make_model": "Toyota Corolla",
  "year": 2021,
  "plate_number": "ABC-1234",
  "total_seats": 5,
  "default_seat_map": [
    {"seat_number": 1, "default_type": "driver"},
    {"seat_number": 2, "default_type": "available"},
    {"seat_number": 3, "default_type": "available"},
    {"seat_number": 4, "default_type": "available"},
    {"seat_number": 5, "default_type": "available"}
  ],
  "verified": true
}
```
*Note: The driver can override `default_type` when creating a trip (e.g., mark seat 5 as unavailable if it's broken).*

---

### 3.2 `POST /trips` – Create a New Trip

**Request Body:**
```json
{
  "vehicle_id": "v_123",
  "origin_city": "Amman",
  "origin_area": "7th Circle",
  "origin_lat": 31.9539,
  "origin_lng": 35.9106,
  "destination_city": "Aqaba",
  "destination_area": "City Center",
  "destination_lat": 29.5267,
  "destination_lng": 35.0078,
  "waypoints": [
    {"stop_name": "Madaba", "stop_lat": 31.7194, "stop_lng": 35.7933},
    {"stop_name": "Karak", "stop_lat": 31.1637, "stop_lng": 35.7621}
  ],
  "departure_date": "2026-08-15",
  "departure_time": "08:00",
  "type_of_trip": "repeated",
  "repeated_days": [1, 3, 5],
  "repeated_end_date": "2026-12-31",
  "allowed_type": "women_only",
  "fare_per_seat": 12.50,
  "seats": [
    {"seat_number": 1, "type": "driver"},
    {"seat_number": 2, "type": "available"},
    {"seat_number": 3, "type": "available"},
    {"seat_number": 4, "type": "unavailable"},
    {"seat_number": 5, "type": "available"}
  ],
  "instructions": ["Please be at the pickup point 10 minutes early.", "Bring your ID"],
  "additional_instructions": "No eating or drinking inside the car."
}
```

**Validation Rules:**
- Driver must be verified (`driver_verified = true`).
- Vehicle must belong to the driver.
- `departure_date` + `departure_time` must be in the future.
- At least 1 seat must be `available`.
- `seat_number` values must match the vehicle's total seats (1 to `total_seats`).
- If `type_of_trip = 'repeated'`, `repeated_days` must contain at least 1 day, and `repeated_end_date` must be > departure_date.
- `allowed_type`: 'all' → no gender filter; 'women_only' → add attribute `women_only=true`; 'men_only' → add attribute `men_only=true` (or handle via filters).

**Response (201 Created):**
```json
{
  "trip_id": "t_456",
  "status": "published",
  "total_seats": 5,
  "available_seats": 3,
  "estimated_earnings": 37.50,
  "message": "Trip published successfully!"
}
```

---

### 3.3 `GET /driver/dashboard` – Aggregated Home Screen

**Purpose:** Returns everything a driver needs on their home screen in one single call.

**Response:**
```json
{
  "account": {
    "driver_id": "u_789",
    "full_name": "Khaled Al-Hassan",
    "phone": "+962790000000",
    "rating": 4.8,
    "total_trips_completed": 145,
    "verified": true,
    "subscription_tier": "pro",
    "subscription_expires": "2026-09-01T00:00:00Z",
    "profile_picture_url": "https://..."
  },
  
  "schedule": {
    "today": [
      {
        "trip_id": "t_456",
        "origin_city": "Amman",
        "destination_city": "Aqaba",
        "departure_time": "2026-08-15T08:00:00Z",
        "available_seats": 3,
        "total_seats": 5,
        "status": "published"
      }
    ],
    "upcoming": [
      {
        "trip_id": "t_457",
        "origin_city": "Amman",
        "destination_city": "Irbid",
        "departure_time": "2026-08-16T07:30:00Z",
        "available_seats": 2,
        "total_seats": 4,
        "status": "published"
      }
    ]
  },
  
  "summary": {
    "today_trips_count": 1,
    "next_trip_reserved_seats": 2,
    "completed_trips_today": 0,
    "total_completed_trips": 145,
    "pending_earnings_today": 0,
    "total_earnings_this_month": 342.50,
    "no_show_rate": 2.3
  },
  
  "reservation_history": {
    "recent": [
      {
        "booking_id": "b_678",
        "trip": {
          "trip_id": "t_450",
          "origin_city": "Amman",
          "destination_city": "Zarqa",
          "departure_time": "2026-08-14T09:00:00Z"
        },
        "passenger_name": "Layla Ahmad",
        "seats_booked": 1,
        "status": "completed",
        "agreed_fare": 3.50,
        "created_at": "2026-08-14T08:15:00Z",
        "rating_received": 5
      },
      {
        "booking_id": "b_679",
        "trip": {
          "trip_id": "t_451",
          "origin_city": "Amman",
          "destination_city": "Dead Sea",
          "departure_time": "2026-08-14T14:00:00Z"
        },
        "passenger_name": "Omar Saleh",
        "seats_booked": 2,
        "status": "confirmed",
        "agreed_fare": 7.00,
        "created_at": "2026-08-14T12:00:00Z",
        "rating_received": null
      }
    ],
    "pagination": {
      "total": 47,
      "page": 1,
      "limit": 10
    }
  }
}
```

---

### 3.4 Optional: Separate Endpoints (if you prefer modularity)

If you prefer separate endpoints, you can implement these individually, but the `dashboard` endpoint (3.3) satisfies the "one endpoint to return all at once" requirement.

| Endpoint | Purpose |
|----------|---------|
| `GET /driver/account` | Returns driver profile and stats |
| `GET /driver/schedule` | Returns today's trips and upcoming trips |
| `GET /driver/summary` | Returns metrics (today_trips, next_reserved, completed, earnings) |
| `GET /driver/reservations?status=completed&page=1` | Returns paginated reservation history with filters |

---

## 4. Business Logic Validation

| Scenario | Behavior |
|----------|----------|
| Driver tries to create trip without verification | Returns `403 Forbidden: Driver not verified` |
| `seats` count doesn't match vehicle total seats | Returns `422 Unprocessable Entity: Seat config mismatch` |
| No `available` seats in the config | Returns `422: At least one seat must be available` |
| Departure time is in the past | Returns `422: Departure time must be in the future` |
| Recurring trip without `repeated_days` | Returns `422: repeated_days required for recurring trips` |
| `allowed_type = 'women_only'` conflicts with driver gender (if driver is male) | Returns `403: Cannot offer women_only trip as male driver` *(optional policy)* |

---

## 5. Acceptance Criteria

- [ ] Driver can create a trip with all required fields and the trip appears in search results.
- [ ] Seat configuration is stored in `trip_seats` and `available_seats` is correctly computed.
- [ ] Waypoints are stored in `trip_stops` with correct order.
- [ ] Recurring trips generate placeholder instances for each day (or are handled at booking time; implementation choice: store recurrence pattern and expand dynamically in queries).
- [ ] Dashboard aggregates all required data in < 500ms (cached).
- [ ] All endpoints validate driver authorization (JWT token).

---

## 6. Notes for Implementation

- **Recurrence Expansion:** For performance, you may either:
  a) Create individual trip records for each occurrence (simpler for search, but lots of rows), or
  b) Store the pattern and expand dynamically when querying (uses less storage, but more complex SQL).
  *Recommendation:* Use pattern expansion dynamically with `generate_series()` for PostgreSQL when querying `trips` with `is_recurring = true` and `recurrence_days` matching the current date.
- **Indexes:** Add indexes on `(origin_city, destination_city, departure_time)`, `(driver_id, departure_time)`, and a GIN index on `recurrence_days` for fast lookups.
- **Caching:** Dashboard responses can be cached for 30 seconds to reduce DB load.
```
