## 📋 Specification Body

```markdown
# Driver Flow Audit & Postman Reorganization

## 1. Objective
Produce a complete audit report covering:
- All driver‑side user journeys (from onboarding to trip completion)
- Every data element a driver needs (profile, vehicle, trips, bookings, earnings, ratings, penalties)
- Verification that each data element is either:
  - Exposed via an existing API endpoint, or
  - Stored in the database and can be exposed if needed (gap identified)
- A structured Postman collection with separate folders for **Driver**, **Admin**, and **Passenger** flows, including a request/response example for every endpoint.

## 2. Audit Scope

### 2.1 Driver User Journeys (To Be Mapped to Endpoints)
| Journey | Steps | Data Required |
|---------|-------|---------------|
| **Onboarding** | Register, OTP, upload ID/vehicle docs, get verified | User profile, vehicle details, verification status, approval queue |
| **Trip Management** | Create trip (with waypoints, seat config, recurrence), edit, cancel, view details | Full trip data, seat availability, stop list, recurrence info |
| **Dashboard & Planning** | See today’s schedule, upcoming trips, summary metrics (trips count, reserved seats, completed, earnings) | Account info, today’s trips, next trip reservations, lifetime stats, earnings per period |
| **Reservations Handling** | View incoming bookings, accept/decline (if needed), communicate with passengers | Booking list, passenger details, chat history, agreed fare |
| **In‑Trip Operations** | Live tracking, drop‑off sequencing, delay reporting, SOS | Real‑time GPS, ETA, passenger drop‑off order, delay flags |
| **After Trip** | Complete trip, rate passenger, file complaint about passenger | Booking status, ratings (including punctuality), complaint system |
| **Reputation & Penalties** | View own rating, badges, warnings/suspensions/ban status | Rating history, active penalties, enforcement actions |
| **Monetization** | Subscribe to Pro, buy featured listings, see subscription status | Subscription tier, expiry, featured trips status, billing history (if any) |

### 2.2 Data Integrity Checks
- Every `trip` must have a `driver_id` that references a `users` row with `role = 'driver'`.
- `bookings.trip_id` must reference existing `trips`; `bookings.passenger_id` must exist.
- `available_seats` in `trips` must equal `COUNT(seat_type='available')` from `trip_seats`.
- `fare_per_seat` and `agreed_fare` must be non‑negative.
- `departure_time` must be in the future (for active trips) – unless historical.
- `recurrence_days` must be a non‑empty array when `is_recurring = true`.
- `penalties` must have `user_id` and a valid `type` (warning/suspension/ban).
- `ratings` must link to a `booking_id` and have both `rater_id` and `ratee_id`.
- All references to `users` must have a `role` consistent with the action (e.g., a passenger cannot be a driver in a trip).

### 2.3 Endpoint Inventory (Current vs. Required)
Based on the PRD and existing database schema, the following endpoints should exist (or be created) for drivers:

| Category | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| **Auth** | `POST /auth/register` | ✅ | Supports driver role |
| | `POST /auth/verify-otp` | ✅ | |
| | `POST /auth/login` | ✅ | |
| **Driver Profile** | `GET /driver/profile` | ❓ | Not explicitly defined; should return full driver data including verification status, rating, badges |
| | `PUT /driver/profile` | ❓ | Update name, contact, preferences |
| **Vehicle** | `GET /vehicles` | ❓ | List driver’s vehicles |
| | `POST /vehicles` | ❓ | Register new vehicle (docs) |
| | `GET /vehicles/{id}` | ✅ | Included in spec above |
| | `PUT /vehicles/{id}` | ❓ | Update vehicle info |
| **Trips** | `POST /trips` | ✅ | Defined in previous spec (with all new fields) |
| | `GET /trips` | ✅ | Search for trips (driver sees own too) |
| | `GET /trips/{id}` | ❓ | Get full trip detail (including seats, stops) |
| | `PUT /trips/{id}` | ❓ | Edit trip (should support partial updates) |
| | `DELETE /trips/{id}` | ❓ | Cancel trip (with notification to passengers) |
| **Dashboard** | `GET /driver/dashboard` | ✅ | Aggregated home screen (defined earlier) |
| **Bookings** | `GET /driver/bookings` | ❓ | List all bookings for driver’s trips (with filters by status) |
| | `GET /driver/bookings/{id}` | ❓ | Get booking detail (passenger info, trip, agreed fare) |
| | `PUT /driver/bookings/{id}/status` | ❓ | Accept/decline/cancel booking (if needed – currently reservations are auto‑confirmed) |
| | `POST /driver/bookings/{id}/complete` | ❓ | Mark trip as complete (driver confirms arrival) |
| **Communication** | `GET /chat/{booking_id}` | ❓ | Retrieve chat history |
| | `POST /chat/{booking_id}` | ❓ | Send message |
| | `POST /calls/{booking_id}` | ❓ | Initiate masked call (via VoIP) |
| **Ratings** | `POST /ratings` | ✅ | Create rating for a booking |
| | `GET /driver/ratings` | ❓ | See all ratings received (with pagination) |
| **Complaints** | `POST /complaints` | ✅ | File complaint |
| | `GET /driver/complaints` | ❓ | View complaints filed by or against driver |
| **Enforcement** | `GET /driver/penalties` | ❓ | View active/historical penalties |
| **Subscription** | `GET /driver/subscription` | ❓ | Current tier, expiry, features |
| | `POST /driver/subscription` | ❓ | Subscribe/upgrade |
| **Analytics** | `GET /driver/earnings` | ❓ | Earnings summary (daily/weekly/monthly) |
| | `GET /driver/stats` | ❓ | Lifetime stats (total trips, no‑show rate, etc.) |

> **Gap Analysis:** The endpoints marked ❓ are not explicitly defined in the PRD but are implied by driver workflows. The audit must confirm if they exist in the actual implementation; if not, they should be added to the roadmap.

## 3. Postman Collection Reorganization

### Folder Structure
```
Masar API
├── Auth (shared)
│   ├── Register
│   ├── Verify OTP
│   ├── Login
│   └── Refresh Token
├── Driver
│   ├── Profile & Vehicle
│   │   ├── Get Profile
│   │   ├── Update Profile
│   │   ├── List Vehicles
│   │   ├── Register Vehicle
│   │   └── Get Vehicle Details
│   ├── Trip Management
│   │   ├── Create Trip
│   │   ├── Get Trip Details
│   │   ├── Update Trip
│   │   ├── Cancel Trip
│   │   └── List My Trips (with filters)
│   ├── Dashboard
│   │   └── Get Dashboard (aggregated)
│   ├── Bookings
│   │   ├── List Bookings
│   │   ├── Get Booking Detail
│   │   ├── Complete Trip
│   │   └── (optional) Accept/Decline Booking
│   ├── Communication
│   │   ├── Get Chat History
│   │   ├── Send Message
│   │   └── Initiate Call
│   ├── Ratings & Reviews
│   │   ├── Rate Passenger
│   │   └── Get My Ratings
│   ├── Complaints
│   │   ├── File Complaint
│   │   └── View My Complaints
│   ├── Penalties
│   │   └── View Penalties
│   └── Subscription & Earnings
│       ├── Get Subscription
│       ├── Upgrade Subscription
│       ├── Get Earnings Summary
│       └── Get Stats
├── Passenger
│   ├── (similar structure: search trips, book, track, rate, etc.)
└── Admin
    ├── Verification Queue
    ├── Users Management
    ├── Trip Moderation
    ├── Arbitration
    ├── Penalties
    ├── Reports & Analytics
    └── Subscription Management
```

Each endpoint in the collection **must** include:
- A descriptive name (e.g., "Create Trip")
- The HTTP method and URL (e.g., `POST {{base_url}}/trips`)
- Request headers (Authorization: Bearer, Content-Type: JSON)
- Example request body (if applicable)
- Example response body (success and error states)
- Pre‑request scripts and tests (for auth token, status code validation)

## 4. Audit Report Deliverables

The final audit will produce a markdown report containing:

1. **Executive Summary** – High‑level findings, number of endpoints, missing gaps.
2. **Complete Endpoint Inventory** – Table with endpoint, method, existing/planned, and notes.
3. **Data Flow Diagrams** – For each driver journey, show the sequence of API calls and data dependencies.
4. **Gap Analysis** – List of missing endpoints or incomplete data returns (e.g., driver cannot see their total earnings via a single endpoint).
5. **Postman Collection Status** – Whether the collection is organised as prescribed, and a checklist of which endpoints have responses defined.
6. **Recommendations** – Prioritised list of actions (e.g., implement `GET /driver/earnings`, add `total_earnings` to dashboard, etc.).
7. **Sample Response Templates** – For every endpoint, include a JSON schema (as already defined in the specs) to ensure consistency.

## 5. How to Execute This Audit

1. **Review current codebase** – Identify all existing endpoints and their request/response structures.
2. **Compare with the inventory** – Mark each as ✅ (exists), ❌ (missing), or 🟡 (exists but incomplete).
3. **Verify database schema** – Check that every field required by the endpoints is present in the database; if not, note the migration needed.
4. **Test each endpoint** – Use Postman to send requests and capture real responses (or use mock data) to ensure they work as expected.
5. **Organise the Postman collection** – Create the folder structure and move endpoints accordingly. Add examples.
6. **Generate the report** – Compile findings into a single markdown document (this can be done manually or automated with a script).

## 6. Acceptance Criteria for the Audit

- [ ] All driver user journeys are fully mapped to endpoints.
- [ ] Every data element required by those journeys is either returned by an existing endpoint or identified as a gap.
- [ ] The database schema supports all data elements (or migration scripts are outlined).
- [ ] The Postman collection has separate folders for Driver, Admin, and Passenger.
- [ ] Every endpoint in the collection has at least one example request and response.
- [ ] The final report is clear, actionable, and prioritised.

---

**Use this specification to generate the audit task. After running `/speckit.specify` with this content, you will have a feature/task in your plan to produce the report.** You can then execute the audit manually or with tooling, and the output will guide the next steps in development.
```