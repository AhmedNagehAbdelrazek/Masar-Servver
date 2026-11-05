# Feature: Driver Flow Completion & API Hardening

## 1. User Story
As a driver and platform operator, I need all missing API endpoints that support the complete driver journey—from trip management to bookings, ratings, penalties, and admin verification—so that drivers can fully use the platform. App developers also need a Postman collection that documents every endpoint with example requests, responses, and clear comments for enum values and error scenarios.

## 2. Goals
- **Close all critical gaps** (G01–G05, G18) and **important gaps** (G06–G12, G19–G21) from the driver flow audit.
- **Ensure all stored data is exposed** where required (ratings, complaints, penalties, notifications, trip_attributes, vehicle verification fields, etc.).
- **Provide a complete, self-documenting Postman collection** that includes:
  - Every endpoint (existing + new) in the correct actor folder (Auth, Driver, Admin, Passenger).
  - At least one successful response example and one error response example.
  - **Inline comments** in the request body description (or as JSON comments using `//` or `/* */`) that list all possible enum values, validation rules, and field descriptions.
  - Pre‑request scripts to set authentication tokens automatically (when required).
  - Tests for status code and basic structure.

## 3. Endpoints to Implement (by Priority)

### 3.1 Critical (Must have for MVP)
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/trips/{trip_id}` | PUT | Edit trip (partial update: fare, departure, seats, stops, attributes, instructions) – notify confirmed passengers if time changes. | 🔴 |
| `/api/trips/{trip_id}` | DELETE | Cancel trip – notify all booked passengers, release seats, update status. | 🔴 |
| `/api/driver/bookings` | GET | List all bookings for driver's trips with filters (status, date). Includes passenger info, agreed fare, reference code. | 🔴 |
| `/api/driver/bookings/{booking_id}` | GET | Get a single booking detail. | 🔴 |
| `/api/ratings` | POST | Submit a rating for a booking (stars, was_late, late_minutes, review, tags). Must be idempotent per booking per rater. | 🔴 |
| `/api/driver/ratings` | GET | List ratings received by the driver (pagination). | 🔴 |
| `/api/driver/penalties` | GET | List active and historical penalties with reason, type, dates. | 🔴 |
| `/api/admin/verification/queue` | GET | List pending driver and vehicle verification requests. | 🔴 |
| `/api/admin/verification/drivers/{driver_id}/approve` | POST | Approve driver (set idVerified = true). | 🔴 |
| `/api/admin/verification/drivers/{driver_id}/reject` | POST | Reject with reason. | 🔴 |
| `/api/admin/verification/vehicles/{vehicle_id}/approve` | POST | Approve vehicle. | 🔴 |
| `/api/admin/verification/vehicles/{vehicle_id}/reject` | POST | Reject with reason. | 🔴 |

### 3.2 Important (Should be done within next sprint)
| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/api/complaints` | POST | File a complaint against a user (booking, accused, category, evidence). | 🟠 |
| `/api/driver/complaints` | GET | View complaints filed by or against the driver. | 🟠 |
| `/api/driver/earnings` | GET | Aggregated earnings (daily/weekly/monthly). | 🟠 |
| `/api/driver/stats` | GET | Lifetime stats (total trips, no‑show rate, response rate, avg rating, etc.). | 🟠 |
| `/api/notifications` | GET | List notifications for the authenticated user (driver/passenger). | 🟠 |
| `/api/notifications/{id}/read` | PUT | Mark notification as read. | 🟠 |
| `/api/trips/{trip_id}/attributes` | GET | Return service attributes (or include them in `GET /trips/{id}` response). If not already, ensure `trip_attributes` are exposed. | 🟠 |
| `/api/driver/profile` | GET | Full driver profile (aggregate from user, driver_profiles, vehicles, ratings summary, badges). | 🟠 |
| `/api/vehicles` | GET | List all vehicles for the driver (include verification status). | 🟠 |
| `/api/vehicles/{vehicle_id}` | PUT | Update vehicle details (partial). | 🟠 |
| `/api/admin/users` | GET | List users with filters (role, status). | 🟠 |
| `/api/admin/users/{user_id}` | PUT | Update user status (suspend/ban/activate). | 🟠 |
| `/api/admin/trips/{trip_id}` | PUT | Moderate a trip (unpublish, block). | 🟠 |
| `/api/admin/complaints` | GET | List complaints with filters. | 🟠 |
| `/api/admin/complaints/{complaint_id}` | PUT | Resolve/dismiss complaint. | 🟠 |
| `/api/admin/penalties` | POST | Issue a penalty (warning/suspension/ban). | 🟠 |

### 3.3 Nice‑to‑have (Phase 2/3 – defer unless time)
- Passenger booking endpoints (POST /bookings, GET /bookings, cancel) – currently seat locks exist but no final booking record. This is required for passenger flow, but not critical for driver MVP.
- Chat, live tracking, SOS, delay reporting, request board, favorites – these are Phase 2/3.

## 4. Functional Requirements

### 4.1 Validation and Business Rules
- **Trip edit**: Only the driver who owns the trip can edit; if departure time changes, notify all confirmed passengers via push/SMS.
- **Trip cancel**: Only the driver can cancel; if trip is already in progress, disallow; refund logic not needed (no in‑app payments), but seat locks must be released.
- **Booking list**: Must include `passenger_name`, `passenger_phone` (masked), `seats_booked`, `agreed_fare`, `status`, `reference_code`, `booking_created_at`. Filter by `status` (confirmed, completed, cancelled, no_show).
- **Ratings**: A user can rate the same booking only once. `was_late` and `late_minutes` must be optional but if present, `late_minutes` must be >= 0. The rating should update the driver's average rating.
- **Penalties**: Must return all penalties (active and expired) with `type`, `reason`, `starts_at`, `ends_at`, `is_appealed` (future). Use `users.status` to reflect current enforcement state.
- **Admin verification**: Must show driver documents (IDs, license) and vehicle docs; after approval, set `profileVerified` and/or `vehicleVerified` in `driver_profiles`/`vehicles`. Full verification only when both are true.
- **Complaints**: Must link to a booking (optional? – could be user‑level). Category enum: `no_show`, `lateness`, `misconduct`, `fraud`, `other`. Evidence URLs optional.
- **Notifications**: Expose all unread/read notifications with `type`, `title`, `body`, `created_at`. Mark read should soft‑delete or set `is_read = true`.
- **Earnings**: Compute from completed trips and commission deduction. Provide daily, weekly, monthly aggregation.
- **Stats**: Compute from database (count trips, sum earnings, no‑show rate from bookings where status = no_show, response rate from driver_profiles if stored).

### 4.2 Authentication & Authorization
- All endpoints except auth must be authenticated via JWT.
- Role‑based access: driver endpoints only for drivers, admin endpoints only for admins.
- Drivers cannot view bookings for other drivers' trips.

### 4.3 Error Handling
- Use the existing error envelope: `{ "status": "error", "message": <string|array>, "code": <string|null> }`.
- For validation, return `VALIDATION_ERROR` with an array of field‑specific messages.
- For forbidden actions, return `FORBIDDEN` with appropriate message.
- For not found, return `NOT_FOUND`.

## 5. Postman Collection Updates

### 5.1 Requirements
- **All endpoints** (existing and new) must have:
  - A descriptive name (e.g., "Edit Trip").
  - The correct method and URL with `{{base_url}}`.
  - Request headers (Authorization for authenticated endpoints).
  - **Request body examples** (for POST/PUT) with **comments** (use Postman's `//` or block comments inside the body JSON) that describe each field, its type, valid enum values, and constraints.
    - Example:
      ```json
      // POST /api/trips
      // Fields:
      //   type_of_trip: "once" | "repeated"
      //   allowed_type: "all" | "women_only" | "men_only"
      //   seats: array of { seat_number: number, type: "driver" | "available" | "unavailable" }
      {
        "origin_city": "Amman",
        "type_of_trip": "once",
        "allowed_type": "all",
        ...
      }
      ```
  - **At least one successful response example** (status 2xx) with the expected structure.
  - **At least one error response example** (e.g., 400, 401, 403, 422, 404) with the standard error envelope.
- **Pre‑request scripts**: For all endpoints that require auth, include a script that sets the Bearer token from environment variables (e.g., `pm.environment.get("access_token")`). For admin endpoints, ensure the token has admin role.
- **Tests**: Include a basic test script that checks for status code 200/201 (or appropriate) and that the response has required fields (for critical endpoints).

### 5.2 Folder Structure
The collection must already be organised as per the audit (Auth, Driver, Admin, Passenger). Ensure every new endpoint is placed in the correct subfolder (e.g., Driver → Trip Management, Driver → Bookings, etc.).

### 5.3 Documentation
- For each endpoint, the description field should summarise the purpose, who can call it, and any special business logic (e.g., "Only the trip owner can edit").
- For enums like `type_of_trip`, `allowed_type`, `seat_type`, `penalty_type`, `complaint_category`, `booking_status`, etc., list all possible values in the description or comments.

## 6. Non‑Functional Requirements
- **Performance**: All new read endpoints should return in < 500ms; writes < 1s (indexes on relevant columns).
- **Logging**: All administrative actions (approvals, penalties, moderation) must be logged with actor ID and timestamp.
- **Idempotency**: For rating submission and complaint filing, ensure they are idempotent (e.g., check for existing rating/complaint to avoid duplicates).
- **Database**: Ensure foreign keys and constraints are in place; add indexes for fields used in filters (booking status, trip driver_id, etc.).
- **Testing**: Unit and integration tests for all new endpoints with > 80% coverage.

## 7. Acceptance Criteria
- [ ] All critical endpoints (section 3.1) are implemented and deployed to staging.
- [ ] All important endpoints (section 3.2) are implemented and deployed to staging.
- [ ] The Postman collection is updated with all endpoints, including comments and examples, and exported as a JSON file in the repository.
- [ ] A driver can successfully create, edit, cancel a trip; view their bookings; rate passengers; view ratings and penalties; and see earnings/stats.
- [ ] An admin can view verification queue, approve/reject drivers and vehicles; manage users, moderate trips, and issue penalties.
- [ ] All endpoints pass integration tests and manual verification.
- [ ] The `db_schema.sql` is updated to reflect all tables (including those from migrations) and any missing constraints.
- [ ] Dead code (like unused imports) is cleaned up.

## 8. Timeline
- **Critical endpoints**: 3 days (immediate).
- **Important endpoints**: 5 days (next sprint).
- **Postman updates**: 1 day (can be done in parallel).

## 9. Dependencies
- None; all required database tables already exist (except chat/live tracking which are not in this scope).
- Use existing services and models.

## 10. Developer Notes
- For earnings aggregation, use the `bookings` table where status = 'completed' and `driver_id` (through trips) to sum `agreed_fare`. Commission is already deducted via `trips.complete`; net earnings may be stored in `driver_profiles.total_earnings` but if not, compute on the fly.
- For stats, compute `no_show_rate` = (no_show bookings / total bookings for driver's trips) * 100.
- Notifications: ensure you have a `notifications` table with `user_id`, `type`, `title`, `body`, `is_read`, `created_at`; create notification on trip edit/cancel and on admin actions (e.g., approval).
- The admin verification queue should show pending profiles and vehicles with their associated image URLs (from `uploaded_images`). Provide endpoints to approve/reject that set the `idVerified` (for drivers) and `isVerified` (for vehicles) flags.
