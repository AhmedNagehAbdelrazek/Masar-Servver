# Driver Flow Audit Results

**Date**: 2026-08-01 | **Feature**: `specs/003-driver-flow-audit` | **Input spec**: [Driver_Flow_Audit_Report.md](./Driver_Flow_Audit_Report.md)

## Audit Conventions

- **Error envelope (actual)**: `{ "status": "error", "message": <string | array>, "code": <string|null> }` — from `utils/ApiError.js` / `middlewares/globalErrorHandler.js`.
- **Success responses**: raw objects, no envelope — from `utils/httpResponse.successResponse`.
- **Schema of record**: union of `docs/db_schema.sql` + `migrations/` (migrations own `trip_seats`, `subscription_plans`, `driver_subscriptions`, `payment_methods`, `uploaded_images`, `passenger_profiles`).
- **Sample data**: masked/placeholder values only — no real PII, no real tokens.
- **Status legend**: ✅ exists · 🟡 exists but incomplete · ❌ missing · ⚪ n/a / not yet built.

---

## 1. Executive Summary

The Masar driver API was audited against the driver-side data flow specification (`Driver_Flow_Audit_Report.md`). **42 endpoints are implemented** and verified against routes/controllers/services/models; **30 more are proposed** to fully cover the 8 driver journeys, the admin workflow, and the passenger booking flow.

**Headline findings**

- **Drivers cannot see their bookings** — no `GET /api/driver/bookings` exists; reservations are only visible as a 10-item dashboard snippet (G03).
- **Ratings, complaints, and penalties have no API path** — all three are stored in the database but exposed by no endpoint, breaking the reputation/after-trip/enforcement journeys (G04, G05, G06).
- **No earnings or lifetime-stats aggregation** — only monthly earnings on the dashboard; no per-period or lifetime breakdown (G07, G08).
- **Notifications are written but never read** — the notification service persists rows; no `GET /api/notifications` exists (G09).
- **Verification has no admin workflow** — driver/vehicle approval (a constitution gate) lacks an admin endpoint (G18).
- **12 data models are orphaned** (stored, not exposed), including `ratings`, `complaints`, `penalties`, `notifications`, `delay_events`, `ride_requests`, `request_offers`, and `trip_attributes`.
- **Database support is strong** — 31/31 driver data elements exist in the schema; 8 are exposed, the rest need endpoints, not migrations. Only chat/live-tracking/badges lack schema (Phase 2).

**Top 3 actions**: (1) implement booking visibility, (2) implement trip edit/cancel, (3) implement ratings endpoints. The Postman collection is reorganized into Driver / Admin / Passenger folders with a success + error example on every endpoint (see §5).

## 2. Complete Endpoint Inventory

**Method**: every row below was verified against `Routes/`, `Controllers/`, `Services/`, and `Models/`. Statuses: ✅ exists · 🟡 exists-but-incomplete · ❌ missing (proposed) · ⚪ n/a.

**Totals**: ✅ 42 implemented endpoints · ❌ 30 proposed/missing · 🟡 7 incomplete.

### 2.1 Auth (shared — Auth folder)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Register Phone | POST | `/api/auth/register/phone` | ✅ | Registration step 1 (country_code, phone, role) |
| Verify OTP | POST | `/api/auth/register/verify-otp` | ✅ | Returns `registration_token` (10 min) |
| Set Password | POST | `/api/auth/register/password` | ✅ | Bearer `registration_token`; returns tokens + user |
| Login | POST | `/api/auth/login` | ✅ | Returns access + refresh tokens |
| Refresh Token | POST | `/api/auth/refresh` | ✅ | Rotates refresh token |
| Logout | POST | `/api/auth/logout` | ✅ | Revokes refresh token |
| Get Me | GET | `/api/auth/me` | ✅ | Returns full profile incl. status, avg_rating, locale |
| Forgot Password | POST | `/api/auth/forgot-password` | ✅ | Sends OTP |
| Forgot Password Verify OTP | POST | `/api/auth/forgot-password/verify-otp` | ✅ | Returns `reset_token` |
| Reset Password | POST | `/api/auth/forgot-password/reset` | ✅ | Bearer `reset_token` |
| Resend OTP | POST | `/api/auth/resend-otp` | ✅ | Purpose: register / forgot_password |

### 2.2 Driver Profile & Vehicle (onboarding — Driver → Profile & Vehicle)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Submit Driver Profile | POST | `/api/auth/onboarding/profile` | ✅ | Validates uploaded image IDs; stores docs + national ID |
| Get Driver Profile | GET | `/api/auth/onboarding/profile` | ✅ | Returns `{ driverProfile }` |
| Get Onboarding Status | GET | `/api/auth/onboarding/status` | ✅ | `{ role, passwordSet, profileSubmitted, profileVerified, vehicleSubmitted, vehicleVerified, fullyVerified }` |
| Submit Vehicle | POST | `/api/auth/onboarding/vehicle` | ✅ | Validates image IDs + plate uniqueness |
| Get Vehicle | GET | `/api/auth/onboarding/vehicle` | ✅ | Returns `{ vehicles }` (all driver vehicles) |
| Upload Image | POST | `/api/upload` | ✅ | multipart, image-only, 20 MB |
| Get Full Driver Profile | GET | `/api/driver/profile` | ❌ | Proposed: aggregate profile + verification + rating + badges |
| Update Driver Profile | PUT | `/api/driver/profile` | ❌ | Proposed: bio, contact, avatar, prefs |
| List My Vehicles | GET | `/api/vehicles` | ❌ | Proposed: dedicated multi-vehicle list |
| Update Vehicle | PUT | `/api/vehicles/{vehicle_id}` | ❌ | Proposed: partial update |

### 2.3 Trips (Driver → Trip Management)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Create Trip | POST | `/api/trips` | ✅ | Recurrence, seats, waypoints, gender filter, instructions; US3 balance gate |
| Get Trip By ID | GET | `/api/trips/{trip_id}` | ✅ | Includes seats, stops, vehicle |
| List My Trips | GET | `/api/trips/driver/my-trips` | ✅ | Optional `status` filter |
| Search Available Trips | GET | `/api/trips/search/available` | ✅ | Passenger-facing; recurrence-expanded |
| Start Trip | POST | `/api/trips/{trip_id}/start` | ✅ | Re-checks balance; sends INSUFFICIENT_BALANCE_START |
| Complete Trip | POST | `/api/trips/{trip_id}/complete` | ✅ | FIFO commission; returns balance + debt flag |
| Edit Trip | PUT | `/api/trips/{trip_id}` | ❌ | Proposed: partial update (seats, fare, stops, time) |
| Cancel Trip | DELETE | `/api/trips/{trip_id}` | ❌ | Proposed: cancel + notify passengers |
| Trip Attributes (service attrs) | — | `trip_attributes` | 🟡 | Stored but not exposed (Constitution VI); no create/read endpoint |

### 2.4 Dashboard & Analytics (Driver → Dashboard)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Get Dashboard | GET | `/api/driver/dashboard` | ✅ | account, schedule, summary metrics, recent reservations |
| Get Earnings Summary | GET | `/api/driver/earnings` | ❌ | Proposed: daily/weekly/monthly aggregation |
| Get Stats | GET | `/api/driver/stats` | ❌ | Proposed: lifetime stats, no-show rate, response rate |

### 2.5 Bookings (Driver → Bookings)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| List Driver Bookings | GET | `/api/driver/bookings` | ❌ | Proposed: bookings for driver's trips, filters by status |
| Get Booking Detail | GET | `/api/driver/bookings/{booking_id}` | ❌ | Proposed: passenger info, trip, agreed fare, reference code |
| Update Booking Status | PUT | `/api/driver/bookings/{booking_id}/status` | ❌ | Proposed (optional): accept/decline — currently auto-confirmed |
| Seat Locks | POST/DELETE | `/api/trips/{trip_id}/seats/lock(/…)` | ✅ | Redis-based; passenger-facing |

### 2.6 Communication (Driver → Communication)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Get Chat History | GET | `/api/chat/{booking_id}` | ❌ | Proposed (Phase 2) |
| Send Message | POST | `/api/chat/{booking_id}` | ❌ | Proposed (Phase 2) |
| Initiate Call | POST | `/api/calls/{booking_id}` | ❌ | Proposed (Phase 2): masked VoIP |

### 2.7 Ratings & Reviews (Driver → Ratings & Reviews)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Create Rating | POST | `/api/ratings` | ❌ | Proposed: stars, punctuality (was_late, late_minutes), review, tags |
| Get My Ratings | GET | `/api/driver/ratings` | ❌ | Proposed: paginated received ratings |
| Ratings aggregation | — | `ratings` | 🟡 | Read in dashboard; no dedicated endpoint (Constitution VII) |

### 2.8 Complaints (Driver → Complaints)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| File Complaint | POST | `/api/complaints` | ❌ | Proposed: booking, accused, category, evidence |
| View My Complaints | GET | `/api/driver/complaints` | ❌ | Proposed: status filters |

### 2.9 Penalties & Enforcement (Driver → Penalties)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| View Penalties | GET | `/api/driver/penalties` | ❌ | Proposed: active + historical penalties, appeal status |

### 2.10 Subscription & Monetization (Driver → Subscription & Earnings)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| List Active Plans | GET | `/api/plans` | ✅ | Cached catalog |
| List Payment Methods | GET | `/api/payment-methods` | ✅ | Public |
| Create Subscription Request | POST | `/api/subscriptions` | ✅ | Screenshot upload; pending admin approval |
| List My Subscriptions | GET | `/api/subscriptions` | ✅ | DTO with balance, rejection reason |
| Get Current Subscription | GET | `/api/subscriptions/current` | ✅ | `{ subscription, total_balance, is_in_debt }` |
| Upgrade Subscription | POST | `/api/subscriptions/{id}/upgrade` | ❌ | Proposed |
| Driver balance / debt | — | `users.total_balance`, `is_in_debt` | 🟡 | Returned via current subscription; no dedicated read |

### 2.11 Admin (Admin folder)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Plans CRUD | GET/POST/PUT/DELETE | `/api/admin/plans(/…)` | ✅ | Create, update, deactivate |
| Payment Methods CRUD | GET/POST/PUT/DELETE | `/api/admin/payment-methods(/…)` | ✅ | Create, update, deactivate |
| Pending Subscriptions | GET | `/api/admin/subscriptions/pending` | ✅ | Masked national ID |
| Approve / Reject Subscription | POST | `/api/admin/subscriptions/{id}/approve` `/reject` | ✅ | First action wins |
| Verification Queue | GET/POST | `/api/admin/verification/…` | ❌ | Proposed: driver + vehicle approve/reject |
| Users Management | GET/PUT | `/api/admin/users(/…)` | ❌ | Proposed: list, detail, status change |
| Trip Moderation | GET/PUT | `/api/admin/trips(/…)` | ❌ | Proposed: unpublish / block |
| Arbitration (complaints) | GET/PUT | `/api/admin/complaints(/…)` | ❌ | Proposed: resolve / dismiss |
| Penalties | POST/GET | `/api/admin/penalties(/…)` | ❌ | Proposed: issue + list |
| Reports & Analytics | GET | `/api/admin/reports/*` | ❌ | Proposed: earnings, activity, verification |

### 2.12 Passenger (Passenger folder — for completeness)

| Endpoint | Method | Path | Status | Notes |
|---|---|---|---|---|
| Book Seat | POST | `/api/bookings` | ❌ | Proposed (Phase 2): after seat lock |
| My Bookings | GET | `/api/bookings` | ❌ | Proposed (Phase 2) |
| Booking Detail | GET | `/api/bookings/{booking_id}` | ❌ | Proposed (Phase 2) |
| Cancel Booking | PUT | `/api/bookings/{booking_id}/cancel` | ❌ | Proposed (Phase 2) |
| Live Tracking | GET | `/api/trips/{trip_id}/live` | ❌ | Proposed (Phase 2) |
| Ride Requests / Offers | POST/GET | `/api/requests(/…)` | ❌ | Proposed (Phase 2): request board |
| Favorites | CRUD | `/api/favorites/…` | ❌ | Proposed (Phase 2) |

### 2.13 Database Field Verification

Every driver data element checked against the schema-of-record (union of `db_schema.sql` + migrations). Status: ✅ stored + exposed · 🟡 stored but not exposed · ❌ not stored.

| Data element | Source | Type | Exposure | Status |
|---|---|---|---|---|
| Full name / phone / email / role / gender / avatar / locale | `users` | VARCHAR etc. | `/api/auth/me`, dashboard | ✅ |
| Account status (active/warned/suspended/banned) | `users.status` | VARCHAR(15) | me (dashboard) | 🟡 |
| Average rating | `users.avg_rating` | NUMERIC(2,1) | dashboard | ✅ |
| Strikes | `users.strikes` | SMALLINT | none | 🟡 |
| Total trips / earnings | `driver_profiles.total_trips`, `total_earnings` | INT/NUMERIC | dashboard (earnings partial) | 🟡 |
| Response rate | `driver_profiles.response_rate` | NUMERIC(5,2) | none | 🟡 |
| License / national ID / docs | `driver_profiles` | various | onboarding | ✅ |
| Vehicle info + verification | `vehicles` | various | onboarding vehicle | 🟡 (verification fields not returned) |
| Trip origin/destination/coords | `trips.origin_*`, `destination_*` | VARCHAR/NUMERIC | create/read/search | ✅ |
| Departure/arrival | `trips.departure_time`, `arrival_time` | TIMESTAMPTZ | create/read/search | ✅ |
| Seats total/available | `trips.total_seats`, `available_seats` | SMALLINT | create/read/search | ✅ |
| Fare + currency | `trips.fare_per_seat`, `currency` | NUMERIC/VARCHAR | create/read/search | ✅ |
| Recurrence | `trips.is_recurring`, `recurrence_days`, `recurrence_end_date` | BOOL/SMALLINT[]/DATE | create/read | ✅ |
| Gender preference | `trips.gender_preference` | ENUM | create/read | ✅ |
| Instructions | `trips.driver_instructions`, `additional_instructions` | TEXT[]/TEXT | create/read | ✅ |
| Status / featured / balance-block | `trips.status`, `is_featured`, `featured_until`, `is_blocked_by_balance` | various | status ✅; featured/block 🟡 | ✅/🟡 |
| Per-seat config | `trip_seats` | SMALLINT/ENUM | create/read | ✅ |
| Waypoints | `trip_stops` | various | create/read | ✅ |
| Service attributes | `trip_attributes` | VARCHAR | none | 🟡 |
| Booking fields (seats, agreed_fare, reference_code, dropoff, payment_status) | `bookings` | various | none (dashboard partial) | 🟡 |
| Passenger identity | `users` via `bookings.passenger_id` | — | dashboard partial | 🟡 |
| Ratings (stars, punctuality, review) | `ratings` | various | none (internal aggregation) | 🟡 |
| Complaints | `complaints` | various | none | 🟡 |
| Penalties | `penalties` | various | none | 🟡 |
| Subscription plans / methods / subscriptions | `subscription_plans`, `payment_methods`, `driver_subscriptions` | various | plans/methods/subscriptions endpoints | ✅ |
| Balance / debt | `users.total_balance`, `is_in_debt` | DECIMAL/BOOL | current subscription | 🟡 |
| In-app notifications | `notifications` | various | none | 🟡 |
| Delay events | `delay_events` | various | none | 🟡 |
| Ride requests / offers | `ride_requests`, `request_offers` | various | none | 🟡 |
| Favorites | `favorite_routes`, `favorite_drivers` | various | none | 🟡 |
| Support tickets | `support_tickets` | various | none | 🟡 |
| Chat / messages | **no table** | — | — | ❌ (needs schema) |
| Live GPS / ETA | **no table** | — | — | ❌ (needs real-time layer) |

#### Integrity rules

| Rule | Verification result |
|---|---|
| Every `trips.driver_id` references `users` with `role='driver'` | ✅ Schema allows; enforced in `tripService.createTrip` (403 for non-drivers) |
| `bookings.trip_id` / `passenger_id` references | ✅ FKs on `bookings` |
| `available_seats` == `COUNT(trip_seats.seat_type='available')` | ✅ Trigger `decrease_trip_seats` / `increase_trip_seats_on_cancel` maintain it |
| `fare_per_seat` / `agreed_fare` non-negative | 🟡 No CHECK constraint; enforced in validators |
| `departure_time` in future for active trips | ✅ Enforced in `tripService.createTrip` (422) |
| `recurrence_days` non-empty when `is_recurring=true` | ✅ Enforced in `tripService.createTrip` (422) |
| `penalties` have `user_id` + valid `type` | ✅ FKs + CHECK `(warning\|suspension\|ban)` |
| `ratings` link booking + rater + ratee | ✅ FKs on `ratings` |
| Role consistency (passenger ≠ driver in a trip) | 🟡 Not schema-enforced; application-level only |

#### Schema inconsistencies found

1. Timestamp naming: `db_schema.sql` uses `created_at`/`updated_at`; migration 001 created `createdat`/`updatedat`; Sequelize models map via `underscored: true`. **Finding**: documentation-consistency issue, not a runtime blocker.
2. Migration 001 typo: column `national_i_d` vs model/schema `national_id`. **Finding**: alignment needed in migration documentation.
3. `trip_seats`, `subscription_plans`, `driver_subscriptions`, `payment_methods`, `uploaded_images`, `passenger_profiles` exist only in migrations, not in `db_schema.sql`. **Finding**: `db_schema.sql` must be updated to include them.
4. Dead import: `Routes/index.js` imports `permissionGuard` and `ROLES` that are never used. **Finding**: code hygiene cleanup.

## 3. Data Flow Diagrams

Each of the 8 driver journeys is mapped to the endpoints that support its steps. `[GAP]` marks a step with no supporting endpoint (see §4).

### 3.1 Onboarding

| Step | Data required | Endpoint |
|---|---|---|
| Register | phone, OTP, password | `POST /api/auth/register/phone` → `POST /api/auth/register/verify-otp` → `POST /api/auth/register/password` |
| Login (returning) | phone + password | `POST /api/auth/login` |
| Check status | verification state | `GET /api/auth/onboarding/status` |
| Upload documents | ID/license/registration images | `POST /api/upload` |
| Submit driver profile | docs, national ID, license | `POST /api/auth/onboarding/profile` |
| Submit vehicle | vehicle + docs | `POST /api/auth/onboarding/vehicle` |
| Get verified | admin approval | `[GAP]` no admin verification-queue endpoint (see §2.11) |

```text
Register(phone) -> VerifyOTP -> SetPassword -> [tokens]
     |-> Login -> onboarding/status
     |-> upload xN -> onboarding/profile -> onboarding/vehicle
     |-> admin approves (GAP: /admin/verification) -> is_verified=true
```

### 3.2 Trip Management

| Step | Data required | Endpoint |
|---|---|---|
| Create trip | origin/dest, seats, waypoints, recurrence, fare | `POST /api/trips` |
| View detail | seats, stops, vehicle | `GET /api/trips/{trip_id}` |
| List mine | own trips, status filter | `GET /api/trips/driver/my-trips` |
| Edit trip | partial updates | `[GAP]` proposed `PUT /api/trips/{trip_id}` |
| Cancel trip | reason + passenger notify | `[GAP]` proposed `DELETE /api/trips/{trip_id}` |
| Start / complete | status transition + commission | `POST /api/trips/{trip_id}/start`, `POST /api/trips/{trip_id}/complete` |

```text
POST /trips (balance gate) -> GET /trips/{id}
     |-> GET /trips/driver/my-trips
     |-> start -> complete (commission FIFO, balance_after, is_in_debt)
     |-> edit (GAP) / cancel (GAP)
```

### 3.3 Dashboard & Planning

| Step | Data required | Endpoint |
|---|---|---|
| Today's schedule | today's trips | `GET /api/driver/dashboard` (schedule.today) |
| Upcoming trips | next trips | `GET /api/driver/dashboard` (schedule.upcoming) |
| Summary metrics | trips/reserved/completed/earnings | `GET /api/driver/dashboard` (summary) |
| Lifetime stats | totals, no-show, response | `[GAP]` proposed `GET /api/driver/stats` |
| Earnings per period | daily/weekly/monthly | `[GAP]` proposed `GET /api/driver/earnings` |

```text
GET /driver/dashboard  (cached 30s)
     |-> account (name/rating/verified)
     |-> schedule (today, upcoming)
     |-> summary (today_trips, completed, monthly_earnings, avg_rating)
     |-> reservation_history (recent bookings)
     |-> stats (GAP) / earnings (GAP)
```

### 3.4 Reservations Handling

| Step | Data required | Endpoint |
|---|---|---|
| View incoming bookings | bookings on my trips | `[GAP]` proposed `GET /api/driver/bookings` |
| View booking detail | passenger, trip, agreed fare | `[GAP]` proposed `GET /api/driver/bookings/{booking_id}` |
| Accept/decline (if needed) | status update | `[GAP]` proposed (currently auto-confirmed) |
| Communicate with passenger | chat / call | `[GAP]` Phase 2 chat/call endpoints |

```text
passenger locks seat -> passenger books (GAP: POST /bookings) -> booking confirmed
     |-> driver sees dashboard reservation_history (partial)
     |-> driver needs: bookings list (GAP), booking detail (GAP), chat (GAP)
```

### 3.5 In-Trip Operations

| Step | Data required | Endpoint |
|---|---|---|
| Live tracking | real-time GPS, ETA | `[GAP]` Phase 2 live tracking (no schema) |
| Drop-off sequencing | dropoff order | `[GAP]` stored in `bookings.dropoff_order`; no read endpoint |
| Delay reporting | minutes, reason | `[GAP]` proposed Phase 3 (`delay_events`) |
| SOS | location | `[GAP]` Phase 2 |

### 3.6 After Trip

| Step | Data required | Endpoint |
|---|---|---|
| Complete trip | mark bookings complete | `POST /api/trips/{trip_id}/complete` |
| Rate passenger | stars + punctuality | `[GAP]` proposed `POST /api/ratings` |
| File complaint | booking, accused, evidence | `[GAP]` proposed `POST /api/complaints` |

```text
complete trip -> commission deducted, balance_after
     |-> rate passenger (GAP: POST /ratings) -> rating stored
     |-> file complaint (GAP: POST /complaints) -> complaint stored
```

### 3.7 Reputation & Penalties

| Step | Data required | Endpoint |
|---|---|---|
| View own rating | rating history | `[GAP]` proposed `GET /api/driver/ratings` |
| View badges | badges | `[GAP]` no badge data model |
| View warnings/suspension/ban | penalties, user status | `[GAP]` proposed `GET /api/driver/penalties` |

### 3.8 Monetization

| Step | Data required | Endpoint |
|---|---|---|
| Subscribe to Pro | plan catalog | `GET /api/plans` |
| Buy featured listing | — | `[GAP]` no featured-purchase endpoint (`trips.is_featured` unused) |
| Submit subscription | screenshot, method | `POST /api/subscriptions` |
| See status | tier, expiry, balance, debt | `GET /api/subscriptions/current` |
| Billing history | transactions | `[GAP]` `subscription_transactions` unused (⚪) |

```text
GET /plans -> POST /subscriptions (screenshot) -> admin approve -> current
     |-> GET /subscriptions/current (tier, balance, is_in_debt, expires_at)
```

## 4. Gap Analysis

**Priority legend**: 🔴 critical (blocks a journey) · 🟠 important (degrades a journey) · 🟡 nice-to-have (enhancement).

### 4.1 Driver-side gaps

| # | Gap | Journey affected | Priority | Recommended action |
|---|---|---|---|---|
| G01 | No trip edit (`PUT /api/trips/{id}`) | Trip Management | 🔴 | Implement partial update (seats, fare, stops, departure) with validation + passenger notification |
| G02 | No trip cancel (`DELETE /api/trips/{id}`) | Trip Management | 🔴 | Implement cancel with reason + notify confirmed passengers |
| G03 | No driver bookings list/detail (`GET /api/driver/bookings(/…)`) | Reservations | 🔴 | Add endpoints returning passenger, trip, agreed fare, reference code |
| G04 | No ratings endpoint (create/list) | After Trip / Reputation | 🔴 | Implement `POST /api/ratings` + `GET /api/driver/ratings` (stars + punctuality per Constitution VII) |
| G05 | No penalties endpoint | Reputation & Penalties | 🔴 | Implement `GET /api/driver/penalties` (type, reason, dates, appeal status) |
| G06 | No complaints endpoints | After Trip / Arbitration | 🟠 | Implement `POST /api/complaints` + `GET /api/driver/complaints` |
| G07 | No earnings aggregation | Monetization / Dashboard | 🟠 | Implement `GET /api/driver/earnings` (periods) — today only available via dashboard |
| G08 | No lifetime stats | Dashboard | 🟠 | Implement `GET /api/driver/stats` (no-show rate, response rate, lifetime totals) |
| G09 | No notifications endpoints | Dashboard / Monetization | 🟠 | Implement `GET /api/notifications` + mark-read; notifications are written but never read |
| G10 | `trip_attributes` stored but unexposed | Trip detail | 🟠 | Expose service attributes in create/read (Constitution VI) |
| G11 | Vehicle verification fields not returned | Onboarding/Profile | 🟠 | Add verification status/notes to vehicle read; add `GET /api/vehicles` list |
| G12 | Driver profile partial (`GET /api/driver/profile`) | Profile | 🟠 | Add aggregate profile endpoint (verification, rating, badges, vehicle) |
| G13 | No chat / masked call | Communication | 🟡 | Phase 2: add chat table + endpoints; VoIP via provider |
| G14 | No booking accept/decline | Reservations | 🟡 | Optional — current model auto-confirms |
| G15 | No featured-listing purchase | Monetization | 🟡 | `trips.is_featured` exists; add purchase/activation flow |
| G16 | Balance/debt only via current subscription | Monetization | 🟡 | Consider dedicated balance read (already visible in current) |
| G17 | Live tracking / SOS / delay reporting | In-Trip | 🟡 | Phase 2/3: real-time layer + `delay_events` endpoints |

### 4.2 Admin-side gaps

| # | Gap | Priority | Recommended action |
|---|---|---|---|
| G18 | No verification queue (drivers/vehicles) | 🔴 | Implement `GET/POST /api/admin/verification/…` — verification currently has no admin UI path |
| G19 | No users management | 🟠 | Implement list/detail/status endpoints |
| G20 | No trip moderation | 🟠 | Implement unpublish/block endpoints |
| G21 | No arbitration (complaints) | 🟠 | Implement resolve/dismiss workflow |
| G22 | No penalties issue/list | 🟠 | Implement issue + list (graduated scale) |
| G23 | No reports/analytics | 🟡 | Implement earnings/activity/verification reports |

### 4.3 Passenger-side gaps

| # | Gap | Priority | Recommended action |
|---|---|---|---|
| G24 | No booking endpoints (book/my/cancel) | 🔴 | Implement after seat lock (Phase 2) |
| G25 | No ratings/complaints endpoints | 🟠 | Shared with driver; implement role-aware |
| G26 | No request board / offers | 🟡 | Phase 2 dual marketplace |
| G27 | No favorites | 🟡 | Phase 2 |
| G28 | No live tracking / chat | 🟡 | Phase 2 |

### 4.4 Data/exposure gaps (stored but not exposed)

- `users.strikes`, `users.status` (beyond me), `driver_profiles.response_rate`, `trips.is_featured`/`featured_until`/`is_blocked_by_balance`, `bookings.*` (beyond dashboard partial), `ratings.*`, `complaints.*`, `penalties.*`, `notifications.*`, `delay_events.*`, `ride_requests.*`, `request_offers.*`, `favorite_routes.*`, `favorite_drivers.*`, `support_tickets.*`, `trip_attributes.*`.

### 4.5 Schema gaps (not stored)

- Chat/messages — no table (Phase 2).
- Live GPS/ETA — no real-time position table (Phase 2).
- Badges — no model (nice-to-have).

## 5. Postman Collection Status

### 5.1 Prescribed folder structure

```text
Masar API
├── Auth (shared)
│   ├── Register Phone
│   ├── Verify OTP
│   ├── Set Password
│   ├── Login
│   ├── Refresh Token
│   ├── Logout
│   ├── Get Me
│   ├── Forgot Password
│   ├── Forgot Password Verify OTP
│   ├── Reset Password
│   └── Resend OTP
├── Driver
│   ├── Profile & Vehicle
│   │   ├── Get Onboarding Status
│   │   ├── Get Driver Profile
│   │   ├── Submit Driver Profile
│   │   ├── Get Vehicle
│   │   ├── Submit Vehicle
│   │   ├── Upload Image
│   │   ├── Get Full Driver Profile (proposed)
│   │   ├── List My Vehicles (proposed)
│   │   └── Update Vehicle (proposed)
│   ├── Trip Management
│   │   ├── Create Trip
│   │   ├── Create Recurring Trip
│   │   ├── Get Trip Details
│   │   ├── List My Trips
│   │   ├── List My Trips (Filtered)
│   │   ├── Start Trip
│   │   ├── Complete Trip
│   │   ├── Edit Trip (proposed)
│   │   └── Cancel Trip (proposed)
│   ├── Dashboard
│   │   ├── Get Dashboard
│   │   ├── Get Earnings Summary (proposed)
│   │   └── Get Stats (proposed)
│   ├── Bookings
│   │   ├── List Bookings (proposed)
│   │   ├── Get Booking Detail (proposed)
│   │   ├── Update Booking Status (proposed)
│   │   └── Seat Locks (shared: lock / release)
│   ├── Communication
│   │   ├── Get Chat History (proposed, Phase 2)
│   │   ├── Send Message (proposed, Phase 2)
│   │   └── Initiate Call (proposed, Phase 2)
│   ├── Ratings & Reviews
│   │   ├── Rate Passenger (proposed)
│   │   └── Get My Ratings (proposed)
│   ├── Complaints
│   │   ├── File Complaint (proposed)
│   │   └── View My Complaints (proposed)
│   ├── Penalties
│   │   └── View Penalties (proposed)
│   ├── Notifications
│   │   ├── List Notifications (proposed)
│   │   └── Mark Notification Read (proposed)
│   └── Subscription & Earnings
│       ├── List Active Plans
│       ├── List Payment Methods
│       ├── Create Subscription Request
│       ├── List My Subscriptions
│       ├── Get Current Subscription
│       └── Upgrade Subscription (proposed)
├── Passenger
│   ├── Trip Discovery
│   │   ├── Search Available Trips
│   │   └── Get Trip Details
│   ├── Booking
│   │   ├── Lock Seat
│   │   ├── Release Seat Lock
│   │   ├── Book Seat (proposed)
│   │   ├── My Bookings (proposed)
│   │   ├── Booking Detail (proposed)
│   │   └── Cancel Booking (proposed)
│   ├── Tracking (proposed, Phase 2)
│   ├── Ratings & Reviews (proposed)
│   ├── Complaints (proposed)
│   ├── Request Board (proposed, Phase 2)
│   └── Favorites (proposed, Phase 2)
└── Admin
    ├── Verification Queue (proposed)
    ├── Users Management (proposed)
    ├── Trip Moderation (proposed)
    ├── Arbitration (proposed)
    ├── Penalties (proposed)
    ├── Reports & Analytics (proposed)
    └── Subscription Management
        ├── Plans CRUD
        ├── Payment Methods CRUD
        ├── Pending Subscriptions
        ├── Approve Subscription
        └── Reject Subscription
```

### 5.2 Collection status

- **Current state**: `postman/masar_api_collection.json` (v2.1.0) — 46 requests, 8 top-level folders, **0 response examples**.
- **Target state (this audit)**: 3 role folders + shared Auth, every request named descriptively, every request has success + error examples, `{{base_url}}` preserved, token-setting tests + status-code assertions, proposed endpoints added as `(proposed)`.
- **Backup**: `postman/masar_api_collection.backup.json` created before reorganization (2026-08-01).
- **Stale entries found**: none — all 46 requests map to mounted routes.
- **Response-example coverage target**: 100% of requests have ≥ 1 success + ≥ 1 error example.

## 6. Recommendations

### Immediate (blocks driver journeys)

1. **Implement booking visibility (G03)** — `GET /api/driver/bookings` + `GET /api/driver/bookings/{id}`. Drivers currently cannot see reservations for their trips outside the 10-item dashboard snippet.
2. **Implement trip edit/cancel (G01, G02)** — `PUT/DELETE /api/trips/{id}` with passenger notification. Without it, drivers cannot recover from mistakes once a trip is published.
3. **Implement ratings (G04)** — `POST /api/ratings` + `GET /api/driver/ratings` (punctuality dimensions per Constitution VII). Ratings are stored and aggregated but have no write/read path.
4. **Implement penalties visibility (G05)** — `GET /api/driver/penalties`. Enforcement data exists; drivers cannot see their graduated-penalty record.
5. **Admin verification queue (G18)** — `GET/POST /api/admin/verification/…`. Driver/vehicle verification is a constitution gate with no admin workflow endpoint.

### Short-term (degrade driver experience)

6. **Earnings + stats aggregation (G07, G08)** — `GET /api/driver/earnings`, `GET /api/driver/stats`. Dashboard shows monthly earnings only; drivers cannot see period or lifetime breakdowns.
7. **Complaints endpoints (G06)** — `POST /api/complaints` + read. Arbitration needs an intake path.
8. **Notifications read path (G09)** — `GET /api/notifications` + mark-read; the notification service writes rows that are never surfaced.
9. **Expose service attributes (G10)** — wire `trip_attributes` into trip create/read (Constitution VI).
10. **Complete driver profile read (G12, G11)** — `GET /api/driver/profile`, `GET /api/vehicles`, return vehicle-verification fields.

### Longer-term (Phase 2/3)

11. **Communication (G13)** — chat table + `/api/chat/{booking_id}` + masked call; Phase 2.
12. **Booking flow (G24)** — `POST /api/bookings` + my-bookings + cancel; seat locks already exist.
13. **In-trip layer (G17)** — live tracking, delay reporting (`delay_events`), SOS.
14. **Dual marketplace (G26)** — request board endpoints over `ride_requests`/`request_offers`.
15. **Admin analytics (G23)** — earnings/activity/verification reports.

### Data/schema housekeeping

16. Update `db_schema.sql` to include migration-only tables (`trip_seats`, `subscription_plans`, `driver_subscriptions`, `payment_methods`, `uploaded_images`, `passenger_profiles`) and reconcile timestamp naming + the `national_i_d` typo.
17. Add non-negative CHECK constraints on `fare_per_seat`/`agreed_fare`; align validators.
18. Remove the dead `permissionGuard`/`ROLES` import in `Routes/index.js`.
19. Sample templates in this report and the Postman collection must use masked values only (no real PII).

## 7. Sample Response Templates

Shapes for **existing** endpoints are derived from the actual controllers/services/models. **Proposed** templates are marked and use the data model. Shared error envelope for every endpoint:

```json
{ "status": "error", "message": "Human-readable message", "code": "CODE" }
```

Validation-error example (422):
```json
{ "status": "error", "message": [ { "field": "phone", "message": "Invalid phone number", "value": "123" } ], "code": "VALIDATION_ERROR" }
```

### 7.1 Auth (shared)

**POST /auth/register/phone** — `{ "country_code": "962", "phone": "790000000", "role": "driver" }`
```json
201 { "message": "OTP sent successfully" }
422 { "status": "error", "message": "Phone number is already registered", "code": "CONFLICT" }
```

**POST /auth/register/verify-otp** — `{ "phone": "+962790000000", "otp": "123456" }`
```json
201 { "registration_token": "eyJ...", "phone": "+962790000000" }
400 { "status": "error", "message": "Invalid OTP", "code": "BAD_REQUEST" }
```

**POST /auth/register/password** — headers `Authorization: Bearer <registration_token>` · `{ "full_name": "Ahmad Al", "gender": "male", "age": 32, "password": "StrongPass123!" }`
```json
201 { "access_token": "eyJ...", "refresh_token": "eyJ...", "user": { "id": "uuid", "phone": "+962790000000", "countryCode": "962", "role": "driver", "fullName": null, "isVerified": false } }
401 { "status": "error", "message": "Invalid or expired registration token", "code": "UNAUTHORIZED" }
```

**POST /auth/login** — `{ "phone": "+962790000000", "password": "StrongPass123!" }`
```json
200 { "access_token": "eyJ...", "refresh_token": "eyJ...", "user": { "id": "uuid", "phone": "+962790000000", "countryCode": "962", "role": "driver", "fullName": "Ahmad Al", "isVerified": true } }
401 { "status": "error", "message": "Invalid phone or password", "code": "UNAUTHORIZED" }
```

**POST /auth/refresh** — `{ "refresh_token": "eyJ..." }`
```json
200 { "access_token": "eyJ...", "refresh_token": "eyJ..." }
401 { "status": "error", "message": "Refresh token has been revoked", "code": "UNAUTHORIZED" }
```

**POST /auth/logout** — `{ "refresh_token": "eyJ..." }`
```json
200 { "message": "Logged out successfully" }
```

**GET /auth/me**
```json
200 { "id": "uuid", "phone": "+962790000000", "countryCode": "962", "fullName": "Ahmad Al", "email": null, "role": "driver", "gender": "male", "age": 32, "avatarUrl": null, "isVerified": true, "avgRating": 4.7, "status": "active", "locale": "ar" }
401 { "status": "error", "message": "Unauthorized", "code": "UNAUTHORIZED" }
```

**POST /auth/forgot-password** — `{ "phone": "+962790000000" }`
```json
200 { "message": "If the phone number is registered, an OTP has been sent" }
```

**POST /auth/forgot-password/verify-otp** — `{ "phone": "+962790000000", "otp": "123456" }`
```json
200 { "reset_token": "eyJ...", "phone": "+962790000000" }
400 { "status": "error", "message": "OTP has expired. Please request a new one.", "code": "BAD_REQUEST" }
```

**POST /auth/forgot-password/reset** — headers `Authorization: Bearer <reset_token>` · `{ "password": "NewPass123!" }`
```json
200 { "message": "Password reset successful" }
401 { "status": "error", "message": "Reset token has already been used or expired", "code": "UNAUTHORIZED" }
```

**POST /auth/resend-otp** — `{ "phone": "+962790000000", "purpose": "register" }`
```json
200 { "message": "OTP resent successfully" }
409 { "status": "error", "message": "Phone number is already registered", "code": "CONFLICT" }
```

### 7.2 Onboarding (Driver → Profile & Vehicle)

**GET /auth/onboarding/status**
```json
200 { "role": "driver", "passwordSet": true, "profileSubmitted": true, "profileVerified": true, "vehicleSubmitted": true, "vehicleVerified": true, "fullyVerified": true }
```

**POST /auth/onboarding/profile** — `{ "full_name": "Ahmad Al", "age": 32, "gender": "male", "nationalID": "1234567890", "userIdentificationFront": 1, "userIdentificationBack": 2, "linceseFront": 3, "linceseBack": 4, "personalImageWithId": 5 }`
```json
201 { "driverProfile": { "id": "uuid", "driverId": "uuid", "nationalID": "1234567890", "idVerified": false } }
400 { "status": "error", "message": "One or more image IDs are invalid", "code": "BAD_REQUEST" }
```

**GET /auth/onboarding/profile**
```json
200 { "driverProfile": { "id": "uuid", "driverId": "uuid", "nationalID": "1234***890", "idVerified": true, "licenseNumber": "L123", "licenseExpiry": "2028-01-01", "bio": null, "totalTrips": 12, "totalEarnings": 245.5, "responseRate": 100 } }
```

**POST /auth/onboarding/vehicle** — `{ "vehicleType": "sedan", "manufacturer": "Toyota", "model": "Corolla", "modelYear": 2020, "color": "white", "plateNumber": "A12345", "seats": 4, "registrationDocFront": 6, "registrationDocBack": 7, "vehiclePhotoFront": 8, "vehiclePhotoBack": 9 }`
```json
201 { "vehicle": { "id": "uuid", "driverId": "uuid", "plateNumber": "A12345", "seats": 4, "isVerified": false } }
409 { "status": "error", "message": "A vehicle with this plate number already exists", "code": "CONFLICT" }
```

**GET /auth/onboarding/vehicle**
```json
200 { "vehicles": [ { "id": "uuid", "manufacturer": "Toyota", "model": "Corolla", "vehicleType": "sedan", "plateNumber": "A12345", "seats": 4, "isVerified": true } ] }
```

**POST /upload** — multipart form-data, field `file`, Bearer token
```json
200 { "image": { "id": 10, "url": "https://cdn.example.com/uploads/abc.png", "filename": "abc.png", "mimetype": "image/png", "size": 24576 } }
422 { "status": "error", "message": "Only image files are allowed", "code": "VALIDATION_ERROR" }
```

### 7.3 Trips (Driver → Trip Management)

**POST /trips** — `{ "origin_city": "Amman", "origin_area": "Abdoun", "origin_lat": 31.9515694, "origin_lng": 35.9239625, "destination_city": "Irbid", "destination_area": "University", "departure_date": "2026-09-01", "departure_time": "08:00", "fare_per_seat": 5, "type_of_trip": "once", "allowed_type": "all", "instructions": ["Be ready 10 mins early"], "additional_instructions": "No eating in car", "seats": [ { "seat_number": 1, "type": "driver" }, { "seat_number": 2, "type": "available" }, { "seat_number": 3, "type": "available" }, { "seat_number": 4, "type": "unavailable" } ], "waypoints": [ { "stop_name": "Swefieh", "stop_lat": 31.98, "stop_lng": 35.9 } ] }`
```json
201 { "trip_id": "uuid", "status": "published", "total_seats": 4, "available_seats": 2, "estimated_earnings": 10, "message": "Trip published successfully!" }
422 { "status": "error", "message": "You need an active plan to publish trips.", "code": "NO_ACTIVE_PLAN" }
422 { "status": "error", "message": "Insufficient balance to publish trip. You need at least 1.00 to cover commission for one seat. Current balance: 0.00.", "code": "INSUFFICIENT_BALANCE" }
422 { "status": "error", "message": "Departure time must be in the future", "code": "VALIDATION_ERROR" }
```

**GET /trips/{trip_id}**
```json
200 { "id": "uuid", "driverId": "uuid", "originCity": "Amman", "originArea": "Abdoun", "destinationCity": "Irbid", "departureTime": "2026-09-01T08:00:00.000Z", "totalSeats": 4, "availableSeats": 2, "farePerSeat": 5, "currency": "JOD", "isRecurring": false, "genderPreference": "all", "status": "published", "seats": [ { "seatNumber": 1, "seatType": "driver" }, { "seatNumber": 2, "seatType": "available" } ], "stops": [ { "stopOrder": 1, "stopName": "Swefieh", "stopLat": 31.98, "stopLng": 35.9 } ], "vehicle": { "id": "uuid", "manufacturer": "Toyota", "model": "Corolla", "plateNumber": "A12345", "seats": 4 } }
404 { "status": "error", "message": "Trip not found", "code": "NOT_FOUND" }
```

**GET /trips/driver/my-trips** — `?status=published`
```json
200 { "trips": [ { "id": "uuid", "originCity": "Amman", "destinationCity": "Irbid", "departureTime": "2026-09-01T08:00:00.000Z", "availableSeats": 2, "status": "published", "seats": [], "stops": [] } ] }
```

**GET /trips/search/available** — `?origin_city=Amman&destination_city=Irbid&date=2026-09-01&gender_preference=all`
```json
200 { "trips": [ { "id": "uuid", "originCity": "Amman", "destinationCity": "Irbid", "departureTime": "2026-09-01T08:00:00.000Z", "availableSeats": 2, "farePerSeat": 5, "seats": [ { "seatNumber": 2, "seatType": "available" } ], "vehicle": { "manufacturer": "Toyota", "model": "Corolla" } } ] }
```

**POST /trips/{trip_id}/start**
```json
200 { "trip_id": "uuid", "status": "in_progress", "message": "Trip started successfully!" }
422 { "status": "error", "message": "Your trip cannot be started because your balance is insufficient. Please subscribe to a plan.", "code": "INSUFFICIENT_BALANCE" }
```

**POST /trips/{trip_id}/complete**
```json
200 { "trip_id": "uuid", "commission": 2.5, "plan_name": "Pro", "balance_after": 7.5, "is_in_debt": false }
422 { "status": "error", "message": "Trip cannot be completed from its current status.", "code": "INVALID_TRIP_STATUS" }
```

### 7.4 Dashboard (Driver → Dashboard)

**GET /driver/dashboard**
```json
200 { "account": { "driver_id": "uuid", "full_name": "Ahmad Al", "phone": "+962790000000", "rating": 4.7, "total_trips_completed": 12, "verified": true, "profile_picture_url": null }, "schedule": { "today": [ { "trip_id": "uuid", "origin_city": "Amman", "destination_city": "Irbid", "departure_time": "2026-09-01T08:00:00.000Z", "available_seats": 2, "total_seats": 4, "status": "published" } ], "upcoming": [] }, "summary": { "today_trips_count": 1, "total_completed_trips": 12, "monthly_earnings": 120.5, "avg_passenger_rating": 4.7 }, "reservation_history": { "recent": [ { "booking_id": "uuid", "trip": { "trip_id": "uuid", "origin_city": "Amman", "destination_city": "Irbid", "departure_time": "2026-09-01T08:00:00.000Z" }, "passenger_name": "Sara K", "seats_booked": 1, "status": "confirmed", "agreed_fare": 5, "created_at": "2026-08-30T10:00:00.000Z", "rating_received": null } ], "pagination": { "total": 1, "page": 1, "limit": 10 } } }
```

### 7.5 Subscription & Monetization (Driver → Subscription & Earnings)

**GET /plans**
```json
200 { "plans": [ { "id": "uuid", "name": "Pro", "period_days": 30, "percentage_cut": 10, "cost": 19.99, "features": ["Feature A"], "is_free": false } ] }
```

**GET /payment-methods** (public)
```json
200 { "payment_methods": [ { "id": "uuid", "name": "Jordan Bank", "type": "bank_account", "account_number": "****4321" } ] }
```

**POST /subscriptions** — `{ "plan_id": "uuid", "screenshot_id": 10, "payment_method": { "type": "bank_account", "account_number": "****4321" } }`
```json
201 { "subscription_id": "uuid", "status": "pending_approval", "message": "Your subscription is pending admin approval." }
409 { "status": "error", "message": "This national ID has already used the free plan.", "code": "FREE_PLAN_ALREADY_USED" }
```

**GET /subscriptions**
```json
200 { "subscriptions": [ { "id": "uuid", "plan": { "name": "Pro", "period_days": 30 }, "balance": 15, "status": "active", "rejection_reason": null, "created_at": "2026-07-01T00:00:00.000Z", "approved_at": "2026-07-02T00:00:00.000Z", "expires_at": "2026-07-31T00:00:00.000Z" } ] }
```

**GET /subscriptions/current**
```json
200 { "subscription": { "id": "uuid", "plan": { "name": "Pro", "percentage_cut": 10 }, "balance": 15, "expires_at": "2026-07-31T00:00:00.000Z" }, "total_balance": 15, "is_in_debt": false }
```

### 7.6 Admin (Admin folder) — existing

**GET /admin/subscriptions/pending**
```json
200 { "subscriptions": [ { "id": "uuid", "driver": { "id": "uuid", "full_name": "Ahmad Al", "phone": "+962790000000", "national_id_masked": "****7890" }, "plan": { "name": "Pro" }, "status": "pending_approval" } ] }
```

**POST /admin/subscriptions/{subscription_id}/approve** — `{ "admin_notes": "OK" }`
```json
200 { "subscription": { "id": "uuid", "status": "active", "activated_at": "2026-08-01T00:00:00.000Z" } }
409 { "status": "error", "message": "This request has already been processed.", "code": "REQUEST_ALREADY_PROCESSED" }
```

**POST /admin/subscriptions/{subscription_id}/reject** — `{ "reason": "Screenshot unclear" }`
```json
200 { "subscription": { "id": "uuid", "status": "rejected", "admin_notes": "Screenshot unclear" } }
```

**GET /admin/plans** / **GET /admin/payment-methods** → `{ "plans": [...] }` / `{ "payment_methods": [...] }` (same DTOs as driver/public, admin-scoped)
**POST/PUT/DELETE /admin/plans(/…)**, **/admin/payment-methods(/…)** → `{ "plan": {...} }` / `{ "payment_method": {...} }` / `{ "deactivated": true }`

### 7.7 Proposed templates (marked PROPOSED)

Shapes follow the data model + conventions. These feed the Postman collection as `(proposed)` requests.

**PROPOSED GET /driver/profile**
```json
200 { "profile": { "id": "uuid", "full_name": "Ahmad Al", "phone": "+962790000000", "email": null, "avatar_url": null, "bio": null }, "verification": { "profile_verified": true, "vehicle_verified": true, "fully_verified": true, "status": "active" }, "avg_rating": 4.7, "vehicles": [ { "id": "uuid", "manufacturer": "Toyota", "model": "Corolla", "plate_number": "A12345", "is_verified": true } ], "badges": [] }
```

**PROPOSED GET /vehicles** → `{ "vehicles": [...] }` · **PROPOSED PUT /vehicles/{id}** → `{ "vehicle": {...} }`

**PROPOSED PUT /trips/{trip_id}** — `{ "fare_per_seat": 6, "departure_time": "2026-09-02T08:00:00.000Z" }`
```json
200 { "trip": { "id": "uuid", "fare_per_seat": 6, "status": "published" } }
403 { "status": "error", "message": "You can only edit your own trips", "code": "FORBIDDEN" }
```

**PROPOSED DELETE /trips/{trip_id}** — `?reason=`
```json
200 { "cancelled": true, "notified_passengers": 1 }
```

**PROPOSED GET /driver/earnings** — `?period=month`
```json
200 { "total": 120.5, "by_day": [ { "date": "2026-08-01", "amount": 15 } ] }
```

**PROPOSED GET /driver/stats**
```json
200 { "total_trips": 12, "total_earnings": 245.5, "avg_rating": 4.7, "no_show_rate": 0.03, "response_rate": 100 }
```

**PROPOSED GET /driver/bookings** — `?status=confirmed`
```json
200 { "bookings": [ { "id": "uuid", "trip_id": "uuid", "passenger": { "id": "uuid", "full_name": "Sara K", "phone": "+962790000001" }, "seats_booked": 1, "agreed_fare": 5, "reference_code": "MSR-ABC123", "payment_status": "pending", "status": "confirmed" } ], "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1 } }
```

**PROPOSED GET /driver/bookings/{booking_id}**
```json
200 { "booking": { "id": "uuid", "trip": { "id": "uuid", "origin_city": "Amman", "destination_city": "Irbid", "departure_time": "2026-09-01T08:00:00.000Z" }, "passenger": { "id": "uuid", "full_name": "Sara K" }, "agreed_fare": 5, "reference_code": "MSR-ABC123", "seat_number": 2, "dropoff_place": null, "payment_status": "pending", "status": "confirmed" } }
```

**PROPOSED POST /ratings** — `{ "booking_id": "uuid", "ratee_id": "uuid", "stars": 5, "was_late": false, "late_minutes": 0, "review": "Great passenger", "tags": ["polite"] }`
```json
201 { "rating": { "id": "uuid", "booking_id": "uuid", "rater_id": "uuid", "ratee_id": "uuid", "stars": 5, "was_late": false, "late_minutes": 0, "is_visible": true } }
422 { "status": "error", "message": "Rating already submitted for this booking", "code": "RATING_ALREADY_SUBMITTED" }
```

**PROPOSED GET /driver/ratings** → `{ "ratings": [...], "pagination": {...} }`

**PROPOSED POST /complaints** — `{ "booking_id": "uuid", "accused_id": "uuid", "category": "misconduct", "description": "...", "evidence_urls": ["https://..."] }`
```json
201 { "complaint": { "id": "uuid", "status": "open", "reference": "CMP-123" } }
```

**PROPOSED GET /driver/complaints** → `{ "complaints": [...], "pagination": {...} }`

**PROPOSED GET /driver/penalties** — `?active=true`
```json
200 { "penalties": [ { "id": "uuid", "type": "warning", "reason": "Late departure", "starts_at": "2026-07-01T00:00:00.000Z", "ends_at": null, "is_appealed": false } ] }
```

**PROPOSED GET /notifications** → `{ "notifications": [ { "id": "uuid", "type": "TRIP_REMINDER", "title": "Reminder", "body": "Trip in 2 hours", "is_read": false, "created_at": "..." } ], "pagination": {...} }`
**PROPOSED PUT /notifications/{id}/read** → `{ "notification": {...} }`

**PROPOSED POST /subscriptions/{id}/upgrade** → `{ "subscription": {...} }`

**PROPOSED Admin** — verification queue, users management, trip moderation, arbitration, penalties, reports (see `contracts/admin-contracts.md` for full shapes):
- `GET /admin/verification/queue` → `{ "queue": [ { "type": "driver", "user": { "id": "uuid", "full_name": "Ahmad Al", "national_id_masked": "****7890" }, "docs": [...] } ] }`
- `POST /admin/verification/drivers/{id}/approve|reject` → `{ "result": { "verified": true } }`
- `GET /admin/users` → `{ "users": [...], "pagination": {...} }`
- `PUT /admin/users/{id}/status` → `{ "user": { "id": "uuid", "status": "suspended" } }`
- `PUT /admin/trips/{id}/moderate` → `{ "trip": { "id": "uuid", "status": "cancelled" } }`
- `PUT /admin/complaints/{id}/resolve` → `{ "complaint": { "id": "uuid", "status": "resolved" } }`
- `POST /admin/penalties` → `{ "penalty": { "id": "uuid", "type": "suspension", "ends_at": "2026-09-01T00:00:00.000Z" } }`
- `GET /admin/reports/earnings` → `{ "totals": { "gross": 1000, "commission": 100 }, "by_day": [] }`

**PROPOSED Passenger** (see `contracts/passenger-contracts.md` for full shapes):
- `POST /bookings` → `201 { "booking": { "id": "uuid", "reference_code": "MSR-XYZ789", "status": "confirmed" } }`
- `GET /bookings` / `GET /bookings/{id}` / `PUT /bookings/{id}/cancel` → booking objects
- `GET /trips/{id}/live` → `{ "driver_location": { "lat": 31.95, "lng": 35.92 }, "eta_minutes": 12, "seats_left": 2 }`
- `POST /requests` → `201 { "request": { "id": "uuid", "status": "open" } }`
- `POST /favorites/drivers` → `201 { "favorite": { "id": "uuid", "driver_id": "uuid" } }`

---

## 8. Acceptance Checklist (Self-Verification)

- [ ] All driver user journeys are fully mapped to endpoints
- [ ] Every data element required by those journeys is either returned by an existing endpoint or identified as a gap
- [ ] The database schema supports all data elements (or migration scripts are outlined)
- [ ] The Postman collection has separate folders for Driver, Admin, and Passenger
- [ ] Every endpoint in the collection has at least one example request and response
- [ ] The final report is clear, actionable, and prioritised
