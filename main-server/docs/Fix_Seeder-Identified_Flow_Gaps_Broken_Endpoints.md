# Spec: Fix Seeder-Identified Flow Gaps & Broken Endpoints

## 1. Overview

This specification addresses **13 critical, high, and hygiene issues** discovered while running the mock data seeder (`Main Server/seed-mock.js`). These gaps prevent the platform from functioning end-to-end, break core marketplace loops, and expose security vulnerabilities.

**Priority:** Critical – must be fixed before any user-facing testing.

---

## 2. Critical Fixes

### 2.1 Passenger Booking Flow – Complete Implementation

**Issue #1:** Passenger can lock a seat in Redis (`POST /api/trips/:id/seats/lock`) but nothing converts the lock into a `bookings` row. The core marketplace loop is broken.

**Solution:** Implement the complete passenger booking flow.

#### 2.1.1 New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/bookings` | Create a booking (convert seat lock → confirmed booking) |
| `GET` | `/api/bookings` | List passenger's own bookings (with filters) |
| `GET` | `/api/bookings/:id` | Get booking details |
| `PUT` | `/api/bookings/:id/cancel` | Cancel booking (passenger) |

#### 2.1.2 `POST /api/bookings` – Create Booking

**Authentication:** JWT (passenger)

**Request Body:**
```json
{
  "trip_id": "t_456",
  "seat_number": 3,
  "seats": 1,
  "agreed_fare": 5.00,
  "dropoff_place": "شارع الجامعة",
  "dropoff_deadline": "2026-08-11T09:30:00Z"
}
```

**Validation Rules:**
1. `trip_id` must exist and be in `published` or `full` status.
2. `seat_number` must be available (not booked, not `unavailable`).
3. `agreed_fare` must match `trips.fare_per_seat` (or be validated).
4. Passenger must not be suspended/banned.
5. Atomic seat lock using Redis + database transaction.

**Logic:**
1. Check Redis lock exists for `seat:{tripId}:{seatNumber}` with passenger's `user_id`.
2. If lock doesn't exist → return `404 Not Found: Seat lock expired or not held`.
3. Begin database transaction:
   - Create `bookings` row with `status = 'confirmed'`.
   - Create `booking_seats` row(s) for seat numbers.
   - Update `trips.available_seats` (decrement).
   - Update `trip_seats.seat_type = 'unavailable'` for the booked seat(s).
   - Delete the Redis lock.
4. Commit transaction.
5. Notify driver via WebSocket (`notification:new` with type `booking_confirmed`).
6. Notify passenger via WebSocket.

**Response (201 Created):**
```json
{
  "booking_id": "b_789",
  "trip_id": "t_456",
  "seat_numbers": [3],
  "status": "confirmed",
  "reference_code": "MSR-7H2KQ",
  "message": "Booking confirmed successfully!"
}
```

**Error Scenarios:**
- `404 Not Found: Trip not found`
- `409 Conflict: Seat already booked`
- `409 Conflict: Trip is already ongoing or completed`
- `403 Forbidden: Account is suspended`
- `422 Validation: agreed_fare does not match trip fare`

#### 2.1.3 `GET /api/bookings` – List Passenger Bookings

**Authentication:** JWT (passenger)

**Query Parameters:**
- `status` – `confirmed`, `completed`, `cancelled`, `no_show` (optional)
- `trip_id` – filter by specific trip (optional)
- `page` – default 1
- `limit` – default 20

**Response (200 OK):**
```json
{
  "bookings": [
    {
      "booking_id": "b_789",
      "trip": {
        "trip_id": "t_456",
        "origin_city": "عمان",
        "destination_city": "إربد",
        "departure_time": "2026-08-11T08:30:00Z",
        "fare_per_seat": 5.00
      },
      "driver": {
        "id": "u_123",
        "full_name": "أحمد العلي",
        "rating": 4.8
      },
      "seat_numbers": [3],
      "agreed_fare": 5.00,
      "status": "confirmed",
      "created_at": "2026-08-10T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

#### 2.1.4 `PUT /api/bookings/:id/cancel` – Cancel Booking

**Authentication:** JWT (passenger who owns the booking)

**Logic:**
1. Verify booking belongs to the passenger.
2. Verify booking is `confirmed` (not already completed/cancelled).
3. Verify trip departure time is more than 1 hour away (free cancellation window).
4. Begin transaction:
   - Update `bookings.status = 'cancelled'`.
   - Update `trips.available_seats` (increment).
   - Update `trip_seats.seat_type = 'available'` for the seats.
5. Commit transaction.
6. Notify driver.

**Response (200 OK):**
```json
{
  "message": "Booking cancelled successfully",
  "booking_id": "b_789",
  "status": "cancelled"
}
```

**Error Scenarios:**
- `403 Forbidden: Cannot cancel booking. It belongs to another user.`
- `409 Conflict: Booking is already completed or cancelled.`
- `409 Conflict: Cannot cancel within 1 hour of departure.`

---

### 2.2 Ride Request & Driver Offer Flow – Complete Implementation

**Issue #2:** Models exist but no routes/controllers/services.

**Solution:** Implement the full Request-Board flow.

#### 2.2.1 New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/ride-requests` | Passenger posts a ride request |
| `GET` | `/api/ride-requests` | List ride requests (with filters) |
| `GET` | `/api/ride-requests/:id` | Get request details |
| `PUT` | `/api/ride-requests/:id` | Update/cancel request |
| `POST` | `/api/ride-requests/:id/offers` | Driver sends offer on request |
| `PUT` | `/api/offers/:id` | Passenger accepts/declines offer |
| `GET` | `/api/ride-requests/:id/offers` | List offers on a request |
| `GET` | `/api/driver/offers` | Driver's sent offers |

#### 2.2.2 `POST /api/ride-requests` – Passenger Posts Request

**Authentication:** JWT (passenger)

**Request Body:**
```json
{
  "origin_place": "عمان - الدوار السابع",
  "origin_time": "2026-08-20T09:00:00Z",
  "destination_place": "إربد - شارع الجامعة",
  "arrival_deadline": "2026-08-20T10:30:00Z",
  "seats_needed": 1,
  "max_budget": 5.00,
  "additional_notes": "أحتاج مساحة للأمتعة"
}
```

**Response (201 Created):**
```json
{
  "request_id": "rq_123",
  "status": "open",
  "created_at": "2026-08-11T10:00:00Z",
  "message": "Ride request posted successfully. Drivers will be notified."
}
```

**Logic:**
1. Create `ride_requests` row with `status = 'open'`.
2. Notify matching drivers (WebSocket `notification:new` with type `ride_request_reply`).
3. Auto-scan for matching trips (background job or immediate).

#### 2.2.3 `POST /api/ride-requests/:id/offers` – Driver Sends Offer

**Authentication:** JWT (driver)

**Request Body:**
```json
{
  "trip_id": "t_456",
  "offered_fare": 5.00,
  "message": "أنا بمر من هناك الساعة 9:15"
}
```

**Validation Rules:**
1. Driver must be verified.
2. Request must be `open`.
3. Driver must not have already sent an offer on this request.
4. Driver must not be suspended/banned.

**Response (201 Created):**
```json
{
  "offer_id": "of_456",
  "status": "sent",
  "message": "Offer sent to passenger. Waiting for response."
}
```

**Logic:**
1. Create `request_offers` row with `status = 'sent'`.
2. Notify passenger via WebSocket (`notification:new` with type `driver_offer`).

#### 2.2.4 `PUT /api/offers/:id` – Passenger Accepts/Declines Offer

**Authentication:** JWT (passenger who owns the request)

**Request Body:**
```json
{
  "action": "accept" // or "decline"
}
```

**If `accept`:**
1. Verify offer is `sent`.
2. Begin transaction:
   - Update `request_offers.status = 'accepted'`.
   - Update `ride_requests.status = 'accepted'`.
   - Create a `booking` automatically from the trip + passenger.
   - Update trip seat availability.
3. Commit transaction.
4. Notify driver.

**If `decline`:**
1. Update `request_offers.status = 'declined'`.
2. Notify driver.
3. If all offers declined, request remains `open` for new offers.

**Response (200 OK):**
```json
{
  "message": "Offer accepted successfully. Booking created.",
  "booking_id": "b_789",
  "trip_id": "t_456"
}
```

---

### 2.3 Fix Penalties Model Drift

**Issue #3:** `penalties.details` column missing in database but model expects it.

#### 2.3.1 Migration

```sql
-- Add the missing column
ALTER TABLE penalties ADD COLUMN IF NOT EXISTS details TEXT;

-- Verify column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'penalties' AND column_name = 'details';
```

#### 2.3.2 Model Fix

If `details` was never meant to exist, remove it from the model:

```javascript
// Models/Penalty.js
// Remove or comment out the 'details' attribute
// If keeping, ensure migration is run before production
```

---

## 3. High-Priority Fixes

### 3.1 Complete Trip Finalizes Bookings

**Issue #4:** `completeTrip` flips trip to `completed` but bookings stay `confirmed`, `paymentStatus` stays `pending`.

**Solution:**

**Modified Logic in `Services/tripService.js:completeTrip`:**
1. Update `trip.status = 'completed'`.
2. **UPDATE** `bookings` where `trip_id = tripId` and `status = 'confirmed'`:
   - Set `bookings.status = 'completed'`.
   - Set `bookings.payment_status = 'paid'` (since cash was collected on board).
   - Set `bookings.completed_at = NOW()`.
3. Trigger auto-rating flow (or prompt both parties).
4. Update driver's `total_trips_completed` increment.
5. Update driver's earnings stats.

```sql
-- Query to finalize bookings
UPDATE bookings 
SET status = 'completed', 
    payment_status = 'paid', 
    completed_at = NOW()
WHERE trip_id = $1 AND status = 'confirmed';
```

---

### 3.2 Secure Payment Methods Endpoint

**Issue #5:** `GET /api/payment-methods` is fully public.

**Solution:**

```javascript
// Routes/paymentMethodRoutes.js
router.route('/')
  .get(protect, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), paymentMethodController.getAll)
  .post(protect, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), paymentMethodController.create);

router.route('/:id')
  .get(protect, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), paymentMethodController.get)
  .put(protect, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), paymentMethodController.update)
  .delete(protect, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), paymentMethodController.delete);
```

---

### 3.3 Support Ticket CRUD

**Issue #6:** Model exists but no endpoints.

#### 3.3.1 New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/support-tickets` | User creates support ticket |
| `GET` | `/api/support-tickets` | List user's tickets (or all for admin) |
| `GET` | `/api/support-tickets/:id` | Get ticket details |
| `PUT` | `/api/support-tickets/:id` | Update ticket (admin only) |
| `POST` | `/api/support-tickets/:id/messages` | Add message to ticket |
| `PUT` | `/api/support-tickets/:id/status` | Update status (admin only) |

#### 3.3.2 `POST /api/support-tickets` – Create Ticket

**Authentication:** JWT (user)

**Request Body:**
```json
{
  "title": "مشكلة في الحجز",
  "category": "booking_issue",
  "description": "لم أستطع إلغاء الحجز",
  "priority": "medium", // optional: low, medium, high
  "booking_id": "b_789", // optional, links to booking
  "trip_id": "t_456" // optional, links to trip
}
```

**Response (201 Created):**
```json
{
  "ticket_id": "st_123",
  "reference_code": "TKT-7H2KQ",
  "status": "open",
  "message": "Ticket created. Support team will respond within 24 hours."
}
```

**Logic:**
1. Create `support_tickets` row with `status = 'open'`.
2. Notify admin via WebSocket (`admin:ticket_new`).
3. If user is an admin/agent, they get a direct notification.

---

### 3.4 Delay Event Reporting

**Issue #7:** Model exists but no endpoints.

#### 3.4.1 New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/bookings/:id/delay` | Report a delay (passenger or driver) |
| `GET` | `/api/bookings/:id/delays` | Get delay events for booking |
| `GET` | `/api/driver/delays` | List driver's reported delays (admin only) |

#### 3.4.2 `POST /api/bookings/:id/delay`

**Authentication:** JWT (passenger or driver of the trip)

**Request Body:**
```json
{
  "party": "driver", // or "passenger"
  "delay_minutes": 15,
  "reason": "ازدحام مروري"
}
```

**Response (201 Created):**
```json
{
  "delay_id": "de_123",
  "booking_id": "b_789",
  "recorded_at": "2026-08-11T08:45:00Z",
  "message": "Delay reported. It will be reflected in the rating."
}
```

**Logic:**
1. Create `delay_events` row.
2. Notify other party via WebSocket (`notification:new` with type `delay_report`).
3. Delay duration will be available in the rating prompt after trip completion.

---

### 3.5 Favorite Drivers & Routes

**Issue #8:** Model exists but no endpoints.

#### 3.5.1 New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/favorites/drivers` | Add favorite driver |
| `DELETE` | `/api/favorites/drivers/:driverId` | Remove favorite driver |
| `GET` | `/api/favorites/drivers` | List favorite drivers |
| `POST` | `/api/favorites/routes` | Add favorite route |
| `DELETE` | `/api/favorites/routes/:routeId` | Remove favorite route |
| `GET` | `/api/favorites/routes` | List favorite routes |

#### 3.5.2 `POST /api/favorites/drivers`

**Authentication:** JWT (passenger)

**Request Body:**
```json
{
  "driver_id": "u_123"
}
```

**Response (201 Created):**
```json
{
  "message": "Driver added to favorites",
  "driver_id": "u_123"
}
```

**Logic:**
1. Create `favorite_drivers` row.
2. Driver will receive notifications when the favorite passenger searches for trips (optional).

#### 3.5.3 `POST /api/favorites/routes`

**Authentication:** JWT (passenger)

**Request Body:**
```json
{
  "origin_city": "عمان",
  "destination_city": "إربد"
}
```

**Response (201 Created):**
```json
{
  "message": "Route added to favorites",
  "route_id": "fr_123"
}
```

**Logic:**
1. Create `favorite_routes` row.
2. User gets push notifications when new trips match this route (if enabled in settings).

---

### 3.6 Passenger Profile Creation

**Issue #9:** Registration creates only `User` row; `PassengerProfile` is never created.

**Solution:** Modify `Services/authService.js:register`:

```javascript
// After user creation, create passenger profile if role is passenger
if (role === ROLES.PASSENGER) {
  await PassengerProfile.create({
    user_id: newUser.id,
    preferences: {}, // default empty
    saved_routes: [], // default empty
    emergency_contacts: [], // default empty
    notifications_enabled: true,
    created_at: new Date()
  });

  // Also create default notification settings
  await createDefaultNotificationSettings(newUser.id);
}
```

**Also add endpoint to update passenger profile:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/profile/passenger` | Get passenger profile |
| `PUT` | `/api/profile/passenger` | Update passenger profile |

#### 3.6.1 `PUT /api/profile/passenger`

**Authentication:** JWT (passenger)

**Request Body (partial update):**
```json
{
  "preferences": {
    "smoking_allowed": false,
    "women_only": true,
    "ac_required": true
  },
  "emergency_contacts": [
    {
      "name": "أحمد",
      "phone": "+962790000001",
      "relationship": "أخ"
    }
  ],
  "saved_routes": [
    {
      "origin_city": "عمان",
      "destination_city": "إربد"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully"
}
```

---

## 4. Low-Priority / Hygiene Fixes

### 4.1 Fix Constants

**Issue #10:** `SIGNUP_ROLES = [ROLES.PASSENGER, ROLES.RIDER]` – `ROLES.RIDER` doesn't exist.

```javascript
// config/constants.js
const SIGNUP_ROLES = [ROLES.PASSENGER, ROLES.DRIVER]; // Fix this

// Remove ROLES.RIDER entirely or define it properly
```

### 4.2 Fix Typo

**Issue #11:** `"reservatoin"` → `"reservation"`

```javascript
// config/constants.js
ADMIN_RESOURCES: {
  // ...
  reservation: { ... }, // Fix typo here
}
```

### 4.3 Trip Seats Occupancy Strategy

**Issue #12:** `trip_seats.seat_type` never updates on booking/cancel.

**Decision:** We will keep occupancy logic consistent with seeder:

- On booking creation: Set `trip_seats.seat_type = 'unavailable'`.
- On booking cancellation: Set `trip_seats.seat_type = 'available'`.
- On trip completion: Keep `unavailable` (since booking is completed).
- On driver marking seat as unavailable permanently: `seat_type = 'unavailable'`.

**Implementation:**
- Add this logic to `bookingService.createBooking` and `bookingService.cancelBooking`.
- No migration needed; this is business logic.

### 4.4 Socket Event Documentation

**Issue #13:** `startTrip` returns a `tracking_link` but no documented socket event contract.

**Solution:** Document in the WebSocket spec (already covered in our earlier spec). Ensure the client knows to:
1. Connect to Socket.IO at `wss://api.masar.app/socket.io?token=JWT`.
2. Join room `trip:{tripId}`.
3. Listen for `tracking:update` events.
4. Send `tracking:location` events (driver only).

---

## 5. Missing Endpoints Summary

### Passenger Flow (Critical)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings` | List passenger bookings |
| `GET` | `/api/bookings/:id` | Get booking details |
| `PUT` | `/api/bookings/:id/cancel` | Cancel booking |

### Ride Request Flow (Critical)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/ride-requests` | Passenger posts request |
| `GET` | `/api/ride-requests` | List requests |
| `GET` | `/api/ride-requests/:id` | Get request details |
| `PUT` | `/api/ride-requests/:id` | Update/cancel request |
| `POST` | `/api/ride-requests/:id/offers` | Driver sends offer |
| `PUT` | `/api/offers/:id` | Accept/decline offer |
| `GET` | `/api/ride-requests/:id/offers` | List offers |

### Support (High)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/support-tickets` | Create ticket |
| `GET` | `/api/support-tickets` | List tickets |
| `GET` | `/api/support-tickets/:id` | Get ticket |
| `PUT` | `/api/support-tickets/:id` | Update ticket |
| `POST` | `/api/support-tickets/:id/messages` | Add message |

### Delays (High)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/bookings/:id/delay` | Report delay |
| `GET` | `/api/bookings/:id/delays` | List delays |

### Favorites (High)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/favorites/drivers` | Add favorite driver |
| `DELETE` | `/api/favorites/drivers/:driverId` | Remove favorite |
| `GET` | `/api/favorites/drivers` | List favorites |
| `POST` | `/api/favorites/routes` | Add favorite route |
| `DELETE` | `/api/favorites/routes/:routeId` | Remove favorite |
| `GET` | `/api/favorites/routes` | List favorite routes |

### Passenger Profile (High)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/profile/passenger` | Get passenger profile |
| `PUT` | `/api/profile/passenger` | Update passenger profile |

---

## 6. Migration Checklist

Run these migrations in order:

```sql
-- 1. Fix penalties.details
ALTER TABLE penalties ADD COLUMN IF NOT EXISTS details TEXT;

-- 2. Add completed_at to bookings (if missing)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- 3. Add payment_status to bookings (if missing)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- 4. Verify booking_seats table exists (junction for seat numbers)
-- If not, create it:
CREATE TABLE IF NOT EXISTS booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_number SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, seat_number)
);

-- 5. Index optimization
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_trip ON bookings(passenger_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_trip_seats_trip ON trip_seats(trip_id);
```

---

## 7. Acceptance Criteria

### Booking Flow
- [ ] Passenger can lock a seat via Redis.
- [ ] Passenger converts lock to confirmed booking via `POST /api/bookings`.
- [ ] Passenger can list their bookings.
- [ ] Passenger can cancel booking (within cancellation window).
- [ ] Driver receives WebSocket notification on new booking.
- [ ] `trips.available_seats` and `trip_seats.seat_type` update correctly.

### Ride Request Flow
- [ ] Passenger can post ride request.
- [ ] Driver can see open requests.
- [ ] Driver can send offer on request.
- [ ] Passenger can accept/decline offer.
- [ ] Accepting creates a confirmed booking.
- [ ] WebSocket notifications are triggered.

### Security
- [ ] `GET /api/payment-methods` requires admin authentication.
- [ ] All endpoints validate JWT tokens.
- [ ] Access control is enforced (passenger-only, driver-only, admin-only).

### Data Integrity
- [ ] `penalties.details` column exists and is populated.
- [ ] `bookings.status = 'completed'` when trip completes.
- [ ] `bookings.payment_status = 'paid'` when trip completes.
- [ ] Passenger profiles are created on registration.
- [ ] Favorites, delays, support tickets are fully CRUD-operational.

---

## 8. Implementation Order

1. **Database Migrations** – Add missing columns (`penalties.details`, `bookings.completed_at`, `bookings.payment_status`).
2. **Booking Service** – Implement `createBooking`, `cancelBooking`, `getBookings`, `getBookingById`.
3. **Ride Request Service** – Implement full request/offer flow.
4. **Support Ticket Service** – Implement CRUD.
5. **Delay Event Service** – Implement report/list endpoints.
6. **Favorites Service** – Implement endpoints.
7. **Passenger Profile Service** – Implement get/update.
8. **Trip Completion Fix** – Update `completeTrip` to finalize bookings.
9. **Security Fix** – Add `protect` middleware to payment methods.
10. **Constants Fix** – Update `SIGNUP_ROLES` and typo.
