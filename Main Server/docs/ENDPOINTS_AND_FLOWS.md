# Endpoints & Flows — App Developer Guide

> Source of truth: `Main Server/Routes/*`, `Main Server/sockets/*`, `Main Server/Services/*`.
> If this doc disagrees with code, code wins. Generated from the 013-maps-tracking-journey codebase (167 REST endpoints + 36 socket events).

## How to read this document

- **Base URL**: `{{base_url}}` = `/api` (e.g. `{{base_url}}/trips` → `/api/trips`).
- **Auth**: every non-public endpoint needs `Authorization: Bearer <access_token>`. Some need a role (`driver`, `passenger`, `admin`, `support`, `moderator`).
- **Success shape**: endpoints return the payload directly (localized). Lists return `{data: [...], pagination: {page, limit, total, total_pages}}`.
- **Error shape**: `{status: "error", message: "...", message_en: "...", code: "SOME_CODE"}`. Switch on `code`, show `message`.
- **Every endpoint has a key** like `[trip-3]`. **Every socket event has a key** like `[sock-20]`. The [Flows](#flows) section chains keys into complete user journeys — implement flows, not lone endpoints.
- Locales: `?lang=ar|en|both` or `Accept-Language` header. Default `ar`.

---

## 1. Auth & onboarding — `auth-*`

### [auth-1] POST /api/auth/register/phone — public
**Use:** first screen of signup; stores role/country and sends the OTP.
**Request:** body `{country_code: "JO" (2-letter), phone: "799123456" (local digits), role: "passenger"|"driver"}`.
**Response:** `201 {message: "OTP_SENT"}`.
**Watch out:** `409 PHONE_NUMBER_IS_ALREADY_REGISTERED`.

### [auth-2] POST /api/auth/register/verify-otp — public
**Use:** OTP screen; verifies the code, returns a single-use registration token.
**Request:** body `{phone: "<full phone from auth-1>", otp: "123456" (6 digits)}`.
**Response:** `201 {registration_token: "<JWT, 10 min>", phone: "..."}`.
**Watch out:** `400` invalid/expired/max-attempts; `409` if the phone got registered meanwhile.

### [auth-3] POST /api/auth/register/password — registration token
**Use:** set-password screen; creates the account and logs the user in.
**Request:** header `Authorization: Bearer <registration_token>`; body `{password: "Aa1!xxxx" (8+ chars, upper+lower+digit+special), confirmPassword: "<must match>"}`.
**Response:** `201 {access_token, refresh_token, user: {id, phone, countryCode, role, fullName, isVerified}}`.
**Watch out:** `401` missing/expired/already-used token. Also auto-assigns the free driver plan + notification defaults.

### [auth-4] POST /api/auth/login — public
**Use:** login screen.
**Request:** body `{phone: "<registered full phone>", password: "...", role: "passenger"|"driver"|"admin"}`.
**Response:** `200 {access_token, refresh_token, user: {...}}`.
**Watch out:** `401` wrong credentials; `403` banned/suspended/role-mismatch.

### [auth-5] POST /api/auth/refresh — public
**Use:** silent token rotation when the access token expires (auth interceptor).
**Request:** body `{refresh_token: "..."}`.
**Response:** `200 {access_token, refresh_token (new rotated pair)}`.
**Watch out:** `401` invalid/expired/revoked; the old refresh token dies on use.

### [auth-6] POST /api/auth/logout — any signed-in user
**Use:** logout button.
**Request:** body `{refresh_token: "..." (optional, revoked if given)}`.
**Response:** `200 {message: "LOGGED_OUT"}`.
**Watch out:** tolerates bad tokens; always succeeds once authenticated.

### [auth-7] GET /api/auth/me — any signed-in user
**Use:** app launch / profile load; who am I.
**Request:** none.
**Response:** `200 {id, phone, countryCode, fullName, email, role, gender, age, avatarUrl, isVerified, avgRating, status, locale}`.
**Watch out:** `404` if the account was deleted after the token was issued.

### [auth-8] POST /api/auth/change-password — any signed-in user
**Use:** change-password form in settings.
**Request:** body `{current_password: "...", new_password: "..." (must differ, strength rules)}`.
**Response:** `200 {message, requires_relogin: true}`.
**Watch out:** revokes all refresh tokens — other devices log out.

### [auth-9] POST /api/auth/forgot-password — public
**Use:** forgot-password screen.
**Request:** body `{phone: "<registered full phone>"}`.
**Response:** `200 {message: "OTP_IF_REGISTERED"}`.
**Watch out:** always returns the same message, even for unknown phones (anti-enumeration).

### [auth-10] POST /api/auth/forgot-password/verify-otp — public
**Use:** reset-code screen; returns a single-use reset token.
**Request:** body `{phone: "...", otp: "123456"}`.
**Response:** `200 {reset_token: "<JWT, 10 min>", phone: "..."}`.
**Watch out:** `400` invalid/expired/max-attempts.

### [auth-11] POST /api/auth/forgot-password/reset — reset token
**Use:** new-password screen; sets the password and kills all sessions.
**Request:** header `Authorization: Bearer <reset_token>`; body `{password: "...", confirmPassword: "..."}`.
**Response:** `200 {message: "PASSWORD_RESET_SUCCESSFUL"}`.
**Watch out:** `401` missing/used/expired token.

### [auth-12] POST /api/auth/resend-otp — public
**Use:** "resend code" button on either OTP screen.
**Request:** body `{phone: "...", purpose: "register"|"forgot_password"}`.
**Response:** `200 {message: "OTP_RESENT"|"OTP_IF_REGISTERED"}`.
**Watch out:** `409` if purpose is `register` and the phone is already registered.

### [auth-13] POST /api/auth/onboarding/profile — driver
**Use:** driver onboarding, identity step (submit once).
**Request:** body `{fullName (≤120), age (18–100), gender ("male"|"female"), userIdentificationFront/Back, linceseFront/linceseBack (note spelling), personalImageWithId (UploadedImage ids from [auth-19]), nationalID (5–30 chars)}`.
**Response:** `201 {driverProfile: {...}}`.
**Watch out:** `409` profile exists; `400` bad image ids; flips verification to pending if a vehicle exists.

### [auth-14] GET /api/auth/onboarding/profile — driver
**Use:** prefill / resume the identity step.
**Request:** none.
**Response:** `200 {driverProfile: {...}|null}`.
**Watch out:** `null` means never submitted.

### [auth-15] POST /api/auth/onboarding/vehicle — driver
**Use:** driver onboarding, vehicle step.
**Request:** body `{vehicleType ("sedan"|"suv"|"van"|"bus"|"hatchback"), manufacturer (≤80), model (≤80), modelYear (last 10y, optional), color (≤30, optional), plateNumber (required, unique), codeNumber (optional), seats (1–50), registrationDocFront/Back, vehiclePhotoFront/Back (image ids)}`.
**Response:** `201 {vehicle: {...}}`.
**Watch out:** one vehicle per driver; `409` plate taken; sets verification pending.

### [auth-16] GET /api/auth/onboarding/vehicle — driver
**Use:** resume / display vehicle onboarding state.
**Request:** none.
**Response:** `200 {vehicles: [...]}`.
**Watch out:** plural `{vehicles}` here vs singular `{vehicle}` on submit.

### [auth-17] GET /api/auth/onboarding/status — driver
**Use:** route the driver to the next pending onboarding step (checklist flags).
**Request:** none.
**Response:** `200 {role, passwordSet, profileSubmitted, profileVerified, vehicleSubmitted, vehicleVerified, fullyVerified}`.
**Watch out:** `fullyVerified` = `user.isVerified`; gate publishing on it.

### [auth-18] POST /api/auth/onboarding/profile/passenger — passenger
**Use:** passenger onboarding (one submission only).
**Request:** body `{fullname (≤120), national_id (5–30), age (18–100), home_address, gender ("male"|"female")}`.
**Response:** `201 {passengerProfile: {...}}`.
**Watch out:** `409` if nationalID/homeAddress already set.

### [auth-19] POST /api/upload — any signed-in user
**Use:** upload one image first, then use its `id` in onboarding/vehicle forms.
**Request:** `multipart/form-data`, single file field `file` (`jpeg|png|webp|gif`, ≤10MB).
**Response:** `200 {id (int), url, filename, cached (bool), provider}`.
**Watch out:** sha256-deduplicated — re-uploading the same bytes returns the existing id with `cached: true`.

### [auth-20] GET /api/healthz — public
**Use:** load-balancer / uptime probe. Not an app screen.
**Request:** none.
**Response:** `200 {status: "ok", timestamp, uptime (seconds)}`.
**Watch out:** checks nothing (DB/Redis down still returns ok).

### [auth-21] GET /api/health/realtime — public
**Use:** monitoring dashboards (socket delivery stats).
**Request:** none.
**Response:** `200 {active_connections, active_users, events_delivered_total, delivery_p99_ms, reconnects_total, rate_limited_total, failures_total, alerting: {...}}`.
**Watch out:** plain `res.json`, not the standard envelope; counters are per-process.

---

## 2. Trips, seats & maps — `trip-*`, `seat-*`, `maps-*`, `vehicle-*`, `verif-*`, `plan-*`, `dash-*`

### [trip-1] POST /api/trips — driver
**Use:** driver create-trip form → publish.
**Request:** body `{origin_city*, destination_city*, departure_time* (ISO8601 with timezone, future), type_of_trip* ("once"|"repeated"), repeated_days (if repeated), repeated_end_date (if repeated), fare_per_seat*, seats* ([{seat_number, type: "driver"|"available"|"unavailable"}] must match vehicle total, exactly 1 driver seat), origin_lat/lng, destination_lat/lng, waypoints/stops/pickup_point/dropoff_point (optional), allowed_type, instructions, additional_instructions}`.
**Response:** `201 {trip_id, status, total_seats, available_seats, estimated_earnings, total_profit, message}`.
**Watch out:** `403` unverified / no vehicle; `422` seat mismatch, time overlap, balance/plan gate; route compute is best-effort (`route_status` may be `failed` — trip still publishes).

### [trip-2] GET /api/trips/driver/my-trips — driver
**Use:** driver my-trips / history screen.
**Request:** query `{status (optional trip-status filter)}`.
**Response:** `200 {trips: [{trip_id, origin_city, destination_city, departure_time, fare_per_seat, status, seats[], waypoints[]}]}`.
**Watch out:** statuses are swept current first; no pagination.

### [trip-3] GET /api/trips/search/available — any signed-in user
**Use:** passenger search screen (also powers round-trip `returning_trips`).
**Request:** query `{origin_city, destination_city, gender_preference ("all"|"women_only"|"men_only"), time_from/time_to ("HH:MM"), vehicle_type, seats (min), date, return_date (all optional)}`.
**Response:** `200 {trips: [{trip + driver{id, full_name, rating, avatar} + vehicle}], returning_trips: [...]}`.
**Watch out:** records a `RecentSearch` for passengers; `date` is the range start.

### [trip-4] GET /api/trips/:trip_id — any signed-in user
**Use:** trip-detail screen (driver, vehicle, seats, confirmed passengers).
**Request:** params `{trip_id}`.
**Response:** `200` full trip object (see `tripService.getTripById`).
**Watch out:** participant gate is currently commented out — any signed-in user can read; `404` if missing.

### [trip-5] GET /api/trips/:trip_id/options — any signed-in user
**Use:** booking form — seat count + pickup/drop-off points before seat selection.
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, available_seats, pickup_points[], drop_off_points[], points/stops[]}`.
**Watch out:** `409` unless trip is `published|full`.

### [trip-6] GET /api/trips/:trip_id/seats — any signed-in user
**Use:** seat-picker screen (live lock state included).
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, status, total_seats, available_seats, seats: [{seat_number, seat_type, is_available, is_locked, locked_by}], empty_seats[], empty_seats_count}`.
**Watch out:** Redis down is treated as unlocked (fail-open).

### [trip-7] GET /api/trips/:trip_id/empty-seats — any signed-in user
**Use:** interchangeable alias of `[trip-6]`.
**Request:** params `{trip_id}`.
**Response:** `200` same shape as `[trip-6]`.
**Watch out:** same handler as `[trip-6]`.

### [trip-8] POST /api/trips/:trip_id/start — driver
**Use:** driver "start trip" button.
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, status: "in_progress", message, tracking_link (wss url)}`.
**Watch out:** only from `published|full`; `400` if >1h before departure; `422` no plan / insufficient balance. Notifies confirmed passengers.

### [trip-9] POST /api/trips/:trip_id/complete — driver
**Use:** driver "end trip" button.
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, commission, plan_name, balance_after, is_in_debt}`.
**Watch out:** only from `in_progress|ongoing`; bookings flip to completed/`paid_cash`; compacts the driven path; emits `[sock-27]`.

### [trip-10] PUT /api/trips/:trip_id — driver
**Use:** edit-trip screen (fields, attributes, stops).
**Request:** params `{trip_id}`; body `{fare_per_seat, departure_time/arrival_time, gender_preference, driver_instructions, additional_instructions, attributes ([{attr_key, attr_value}] replaces all), stops (replaces all) — all optional}`.
**Response:** `200 {trip: {id, origin_city, destination_city, departure_time, fare_per_seat, status, attributes[], notified_passengers}}`.
**Watch out:** `422` if completed/cancelled; departure change re-checks overlap and notifies passengers.

### [trip-11] POST /api/trips/:trip_id/cancel — driver
**Use:** driver cancel-with-reason flow (records an escalating penalty).
**Request:** params `{trip_id}`; body `{reason* (≤500), note (≤500, optional)}`.
**Response:** `200 {message, trip_id, status: "cancelled", penalty_id, penalty_type}`.
**Watch out:** `409` if any confirmed booking exists or trip isn't `published|full`; repeat cancels can suspend the driver.

### [trip-12] DELETE /api/trips/:trip_id — driver
**Use:** legacy cancel path (no penalty record).
**Request:** params `{trip_id}`.
**Response:** `200 {trip: {id, status: "cancelled", notified_passengers}}`.
**Watch out:** `403` once started; `409` if already cancelled; cancels confirmed+pending bookings.

### [trip-13] GET /api/trips/:trip_id/attributes — any signed-in user
**Use:** trip-detail amenities section (smoking, AC, …).
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, attributes: [{attr_key, attr_value}]}`.
**Watch out:** no ownership check; `404` if trip missing.

### [trip-14] GET /api/trips/:trip_id/passengers — driver
**Use:** driver passenger list / rate-a-passenger dropdown.
**Request:** params `{trip_id}`; query `{status (booking-status filter, optional)}`.
**Response:** `200 {trip_id, trip_status, route, departure_time, passengers: [{booking_id, passenger{id, full_name, profile_picture_url, rating}, seats_booked, seat_numbers, booking_status}]}`.
**Watch out:** defaults to confirmed+completed; `403` on other drivers' trips.

### [trip-15] PATCH /api/trips/:trip_id/stops — driver
**Use:** driver edit-route flow — wholesale stop replacement.
**Request:** params `{trip_id}`; body `{stops*: [{lat|stop_lat, lng|stop_lng, name|stop_name, city, address, stop_type}]}`.
**Response:** `200 {trip_id, stops (count), route_status}`.
**Watch out:** `422` if started or `TOO_MANY_WAYPOINTS`; recompute failure sets `failed`, never errors; notifies booked passengers.

### [trip-16] POST /api/trips/:trip_id/pickup-preview — passenger
**Use:** "will the driver pick me up here?" check before confirming a booking.
**Request:** params `{trip_id}`; body `{pickup_type ("stop"|"custom", optional), pickup_stop_id (uuid, optional), lat/lng (decimals, for custom)}`.
**Response:** `200 {accepted (bool), distance_from_route_m, detour_seconds, reason|null}`.
**Watch out:** `reason` is `PICKUP_TOO_FAR_FROM_ROUTE` / `PICKUP_DETOUR_TOO_LONG`; routeless legacy trips auto-accept.

### [trip-17] GET /api/trips/:trip_id/route — driver, admin
**Use:** driver navigation screen — full route, ordered pickups, nav links.
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, route_status, route_version, polyline, distance_m, duration_s, stops[], pickups: [{booking_id, first_name, seats, lat, lng, pickup_order, pickup_status}], navigation_url, navigation_legs[]}`.
**Watch out:** owner or staff only; first names only, never phones.

### [trip-18] GET /api/trips/:trip_id/route/actual — driver, passenger
**Use:** trip-history / receipt map (planned + actually driven).
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, route_status, polyline, actual_path_polyline|null, actual_distance_m, actual_duration_s, started_at, completed_at}`.
**Watch out:** must be driver or booked passenger; `actual_*` null until post-completion compaction.

### [trip-19] PATCH /api/trips/:trip_id/pickups/:booking_id — driver
**Use:** driver pickup checklist (arrived / picked up / missed).
**Request:** params `{trip_id, booking_id}`; body `{pickup_status*: "arrived"|"picked_up"|"missed"}`.
**Response:** `200 {booking_id, pickup_status}`.
**Watch out:** booking must be confirmed; `missed` keeps booking `CONFIRMED` (never pollutes driver no-show rate); arrived/missed notify the passenger.

### [trip-20] POST /api/trips/:trip_id/offers/:offer_id/attach — driver
**Use:** convert an accepted ride-request offer into a booking on this trip.
**Request:** params `{trip_id, offer_id}`.
**Response:** `201 {booking: {id, reference_code, ...}, offer: {...}}`.
**Watch out:** `409` if offer not accepted / already attached / trip started / no seats left.

### [seat-1] POST /api/trips/:trip_id/seats/lock — any signed-in user
**Use:** hold seat(s) for 5 minutes during checkout (passenger picks seats).
**Request:** params `{trip_id}`; body `{seat_number (int) XOR seat_numbers (int[]) — exactly one}`.
**Response:** `200` single `{lock_id, seat_number, expires_in: 300, message}` or multi `{lock_ids[], seat_numbers[], expires_in: 300, message}`.
**Watch out:** trip must be `published`; `404` seat missing; `409` locked by someone else (multi-lock rolls back).

### [seat-2] DELETE /api/trips/:trip_id/seats/lock/:seat_number — any signed-in user
**Use:** release a hold (checkout cancel / timeout / seat change).
**Request:** params `{trip_id, seat_number}`.
**Response:** `200 {message: "SEAT_LOCK_RELEASED"}`.
**Watch out:** `404` if expired/missing; `403` if held by another passenger.

### [maps-1] POST /api/maps/route-preview — driver
**Use:** live preview while the driver builds a trip (nothing is saved).
**Request:** body `{origin_lat/origin_lng/destination_lat/destination_lng (flat, preferred) OR origin/destination ({lat|stop_lat, lng|stop_lng} fallback), stops[] (optional), departure_time (optional, for suggested arrival)}`.
**Response:** `200 {polyline, distance_m, duration_s, suggested_arrival (ISO8601), cached (bool)}`.
**Watch out:** 30 previews/min/user (fail-open); `429 RATE_LIMITED`; identical/close points → `422 ORIGIN_DESTINATION_TOO_CLOSE`.

### [maps-2] POST /api/maps/reverse-geocode — any signed-in user
**Use:** pin-drop pickers (tap → city/area/label).
**Request:** body `{lat* (-90..90), lng* (-180..180)}`.
**Response:** `200 {city, area, label}` (request locale; mock returns Amman).
**Watch out:** `502 MAPS_UNAVAILABLE` when the provider is down and mock is off.

### [vehicle-1] GET /api/vehicles — driver
**Use:** driver vehicle/garage screen.
**Request:** none.
**Response:** `200 {vehicles: [{id, manufacturer, model, vehicle_type, model_year, plate_number, code_number, color, seats, is_verified}]}` (newest first).
**Watch out:** single-vehicle drivers get one row.

### [vehicle-2] PUT /api/vehicles/:vehicle_id — driver
**Use:** edit-vehicle form.
**Request:** params `{vehicle_id}`; body `{manufacturer, model, vehicle_type, model_year (last 10y), plate_number, code_number, color, seats (1–50) — all optional}`.
**Response:** `200 {vehicle: {...}}`.
**Watch out:** `403` on others' vehicles; `409` plate taken.

### [verif-1] GET /api/driver/verification-status — driver
**Use:** verification-status screen (state + rejection fixes).
**Request:** none.
**Response:** `200 {status: {value, can_edit, submitted_at, rejected_at, rejection_reason, fields_to_fix[]}, driver: {...}, vehicle: {...}}` (enveloped).
**Watch out:** `status` drives whether resubmit is allowed.

### [verif-2] GET /api/driver/verification — driver
**Use:** prefill the verification form when resuming.
**Request:** none.
**Response:** `200 {driver: {...docs}, vehicle: {...}}` (enveloped; null fields = never submitted).
**Watch out:** —.

### [verif-3] PUT /api/driver/verification — driver
**Use:** submit / resubmit the verification package (resets to pending).
**Request:** body `{full_name, national_id, license_number, license_expiry, user_identification_front/back, lincese_front/back, personal_image_with_id (image ids, optional), vehicle*: {manufacturer, model, vehicle_type, plate_number, seats, +optional year/color/code/docs}}`.
**Response:** `200 {status: "pending", submitted_at}` (enveloped).
**Watch out:** `phone` field forbidden; `422` bad doc ids / duplicate plate or national id; only when editable.

### [plan-1] GET /api/plans — driver
**Use:** subscribe / plan-picker screen.
**Request:** none.
**Response:** `200 {plans: [{id, name, period_days, percentage_cut, cost, status, features[], is_free, free_offer}]}`.
**Watch out:** Redis-cached; free auto-assigned plans excluded; active only.

### [dash-1] GET /api/driver/dashboard — driver
**Use:** driver dashboard load (stats, schedules, recent bookings).
**Request:** none.
**Response:** `200 {account: {...}, schedule: {today[], upcoming[10]}, summary: {today_trips_count, total_completed, monthly_earnings, avg_rating}, reservation_history: {recent[10], pagination}}`.
**Watch out:** Redis-cached ~30s; `404` if driver/vehicle missing.

---

## 3. Passenger marketplace — `book-*`, `ride-*`, `offer-*`, `fav-*`, `profile-*`, `rate-*`

### [book-1] GET /api/bookings — passenger
**Use:** My Trips list (upcoming + history).
**Request:** query `{status ("pending"|"confirmed"|"cancelled"|"completed"|"no_show", optional), trip_id (optional), page (≥1), limit (1–100)}`.
**Response:** `200 {data: [{id, reference_code, status, seats_booked, seat_numbers, agreed_fare, trip{...}, pickup_*, dropoff_*}], pagination}`.
**Watch out:** expired trips are swept and statuses synced before filtering.

### [book-2] POST /api/bookings — passenger
**Use:** "Book" button after locking seats.
**Request:** body `{trip_id* (published/full trip), seat_numbers* (int[], unique positive), seats (must match length), agreed_fare* (must equal current fare), pickup_point (TripStop uuid OR {name, lat, lng}), pickup_type/pickup_stop_id (optional explicit model), drop_off_point (uuid OR {name, lat, lng}), dropoff_place (≤255), dropoff_deadline (ISO8601 with timezone)}`.
**Response:** `201 {booking: {id, reference_code (/^MSR-/), status, payment_status, seats_booked, seat_numbers, agreed_fare, pickup_*, dropoff_*, trip{...}, driver{id, full_name, phone_masked}, vehicle{...}}}`.
**Watch out:** needs a prior `[seat-1]` lock held by the caller (`404 SEAT_LOCK_EXPIRED`); `409` no seats / not bookable; `422` if a custom pickup is rejected (`PICKUP_TOO_FAR_FROM_ROUTE` / `PICKUP_DETOUR_TOO_LONG`). Missing pickup defaults to trip origin.

### [book-3] GET /api/bookings/:booking_id — passenger
**Use:** booking detail / tracking entry screen.
**Request:** params `{booking_id}`.
**Response:** `200 {booking: {...same detail as book-2...}}`.
**Watch out:** `403` not the owner; `404` missing.

### [book-4] GET /api/bookings/:booking_id/driver-profile — passenger, driver, admin
**Use:** "driver info" screen — full PII reveal for a confirmed booking.
**Request:** params `{booking_id}`.
**Response:** `200 {driver: {id, first_name, last_name, phone, age, gender, is_professional_driver, driver_stats{...}, vehicle_details{...}}}`.
**Watch out:** only booking passenger, trip driver, or admin, and only while `confirmed` — else `403/409`.

### [book-5] PUT /api/bookings/:booking_id/cancel — passenger
**Use:** "cancel booking" button.
**Request:** params `{booking_id}`.
**Response:** `200 {booking: {id, status, cancelled_at}}`.
**Watch out:** `409` if already cancelled/completed or <1h to departure; frees seats, recomputes route, notifies driver.

### [book-6] GET /api/bookings/:booking_id/route — passenger, driver
**Use:** map/tracking screen — planned route plus only my pickup.
**Request:** params `{booking_id}`.
**Response:** `200 {trip_id, booking_id, route_status, route_version, polyline, distance_m, duration_s, my_pickup{lat, lng, label, pickup_status}, actual_path_polyline|null}`.
**Watch out:** owner, trip driver, or staff only; `actual_*` null until compacted.

### [book-7] PATCH /api/bookings/:booking_id/pickup — passenger
**Use:** "edit pickup location" before the cutoff.
**Request:** params `{booking_id}`; body `{pickup_type ("stop"|"custom"), pickup_stop_id (uuid, if stop), lat/lng (if custom)}`.
**Response:** `200 {booking_id, pickup_type, detour_seconds}`.
**Watch out:** only while `confirmed` and before the cutoff (`422 PICKUP_EDIT_CUTOFF_PASSED`); same validation as booking; notifies driver.

### [book-8] POST /api/bookings/:booking_id/delay — passenger, driver
**Use:** "I'm running late" button (either party reports their own lateness).
**Request:** params `{booking_id}`; body `{party*: "driver"|"passenger" (must be the reporter), delay_minutes* (1–720), reason (≤1000)}`.
**Response:** `201 {delay_event: {id, booking_id, party, delay_minutes, reason, reported_by, created_at}}`.
**Watch out:** `403` if reporting the other party; notifies the counterparty.

### [book-9] GET /api/bookings/:booking_id/delays — passenger, driver
**Use:** delay history on trip detail.
**Request:** params `{booking_id}`; query `{party (filter, optional), page, limit}`.
**Response:** `200 {data: [delay_event], pagination}`.
**Watch out:** must be booking passenger or trip driver, else `403`.

### [ride-1] POST /api/ride-requests — passenger
**Use:** "no suitable trip → ask drivers" (demand-driven board).
**Request:** body `{origin_city* (≤120), destination_city* (≤120), origin_place/destination_place (≤255), origin_lat (-90..90), origin_lng (-180..180), origin_time* (ISO8601 with tz), arrival_deadline (ISO8601 with tz), seats_needed (1–8), max_budget (≥0), attributes_preferred (object), note (≤1000)}`.
**Response:** `201 {ride_request: {id, origin_city, destination_city, origin_time, seats_needed, max_budget, status, expires_at, created_at}}`.
**Watch out:** expiry derives from deadline or origin+TTL; datetimes without timezone → `422`.

### [ride-2] GET /api/ride-requests — passenger, driver
**Use:** passengers see their own requests; drivers browse open demand.
**Request:** query `{status (open|offered|accepted|expired|cancelled), page, limit}`.
**Response:** `200 {data: [ride_request], pagination}`.
**Watch out:** stale open/offered rows auto-expire on read.

### [ride-3] GET /api/ride-requests/:request_id — passenger, driver
**Use:** request detail with offers.
**Request:** params `{request_id}`.
**Response:** `200 {ride_request: {id, origin_city, destination_city, status, passenger_name, passenger_phone_masked, offers: [...]}}`.
**Watch out:** owner or any driver; other passengers get `403`.

### [ride-4] GET /api/ride-requests/:request_id/matches — passenger
**Use:** "published trips like this" suggestions (no booking).
**Request:** params `{request_id}`.
**Response:** `200 {ride_request_id, matches: [{trip_id, score_rank, origin{...}, destination{...}, departure_time, available_seats, fare_per_seat, currency, driver{...}}] (max 10)}`.
**Watch out:** owner only; window origin−24h…+48h, seats ≥ needed.

### [ride-5] PUT /api/ride-requests/:request_id — passenger
**Use:** edit or withdraw a request.
**Request:** params `{request_id}`; body `{action: "cancel", origin_city, destination_city, origin_time, arrival_deadline, seats_needed, max_budget, note}`.
**Response:** `200 {ride_request: {...}}`.
**Watch out:** owner only; cancel declines all sent offers; `409` if accepted/expired/cancelled.

### [ride-6] POST /api/ride-requests/:request_id/offers — driver
**Use:** driver bids on an open request.
**Request:** params `{request_id}`; body `{offered_fare* (≥0), message (≤1000), trip_id (linked trip, optional)}`.
**Response:** `201 {offer: {id, request_id, driver_id, trip_id, offered_fare, message, status, agreed_fare, booking_id, created_at}}`.
**Watch out:** one pending offer per driver per request; flips request open→offered; `409` if closed.

### [ride-7] GET /api/ride-requests/:request_id/offers — passenger, driver
**Use:** compare bids on a request.
**Request:** params `{request_id}`.
**Response:** `200 {data: [offer], pagination}`.
**Watch out:** request owner or a driver who already offered; other drivers get `403`.

### [ride-8] POST /api/ride-requests/:request_id/accept — driver
**Use:** direct acceptance with no offer/negotiation. Body is optional (`{}` or none).
**Request:** params `{request_id}`; optional body `{trip_id, fare_per_seat, origin_time, seats, type_of_trip, repeated_days, repeated_end_date, allowed_type, instructions, additional_instructions, pickup_point, dropoff_point, waypoints, stops}`.
**Response:** `201 {trip, booking, offer}`.
**Watch out:** `trip_id` must be the driver's own published/full trip. Without it the closest matching trip is used, or a new trip is created from the request (fare defaults to `max_budget`, departure to the request time or `now + 1h`). The booking pickup is the request origin and is included in the trip route by the post-booking recompute. `409` when the request is no longer open or has no seats.

### [offer-1] PUT /api/offers/:offer_id — passenger
**Use:** accept / decline one bid.
**Request:** params `{offer_id}`; body `{action*: "accept"|"decline"}`.
**Response:** `200 {offer: {...}}`.
**Watch out:** owner only, offer must be `sent`; accept marks the request accepted and auto-declines the rest.

### [offer-2] PUT /api/offers/:offer_id/price — passenger
**Use:** set the final negotiated fare before the driver materializes the booking.
**Request:** params `{offer_id}`; body `{agreed_fare* (≥0)}`.
**Response:** `200 {offer: {...}}`.
**Watch out:** only after accept while the request is active; `409` otherwise.

### [fav-1] GET /api/favorites/drivers — passenger
**Use:** favorite-drivers list for quick rebooking.
**Request:** query `{page, limit}`.
**Response:** `200 {data: [{id, passenger_id, driver_id, driver_name, created_at}], pagination}`.
**Watch out:** —.

### [fav-2] POST /api/favorites/drivers — passenger
**Use:** heart button on a driver.
**Request:** body `{driver_id* (must be a driver user)}`.
**Response:** `200 {favorite_driver: {...}, created (bool)}`.
**Watch out:** `404` if target isn't a driver; `400` on self; idempotent.

### [fav-3] DELETE /api/favorites/drivers/:driver_id — passenger
**Use:** unfavorite a driver.
**Request:** params `{driver_id}`.
**Response:** `200 {message: "FAVORITE_DRIVER_REMOVED"}`.
**Watch out:** `404` if not favorited.

### [fav-4] GET /api/favorites/routes — passenger
**Use:** saved city-pairs for one-tap search on home.
**Request:** none.
**Response:** `200 {data: [{id, passenger_id, origin_city, destination_city, label, created_at}]}` (no pagination, newest first).
**Watch out:** —.

### [fav-5] POST /api/favorites/routes — passenger
**Use:** bookmark a frequent city pair.
**Request:** body `{origin_city* (≤120), destination_city* (≤120), label (≤100, e.g. "Home–Work")}`.
**Response:** `201 {favorite_route: {...}}`.
**Watch out:** idempotent on the pair (resending updates the label).

### [fav-6] DELETE /api/favorites/routes/:origin_city/:destination_city — passenger
**Use:** remove a bookmark.
**Request:** params `{origin_city, destination_city}` (exact strings).
**Response:** `200 {message: "FAVORITE_ROUTE_REMOVED"}`.
**Watch out:** `404` if the pair isn't saved.

### [profile-1] GET /api/profile/passenger — passenger
**Use:** profile screen header.
**Request:** none.
**Response:** `200 {passenger_profile: {full_name, age, gender, phone, national_id, home_address}}`.
**Watch out:** auto-creates an empty row on first read.

### [profile-2] PUT /api/profile/passenger — passenger
**Use:** edit profile / preferences form.
**Request:** body `{preferred_gender ("male"|"female"|"any"), smoking_preference, national_id (5–30), home_address, saved_routes (array), emergency_contacts (array)}`.
**Response:** `200 {passenger_profile: {...}}`.
**Watch out:** at least one field required (`400` otherwise).

### [profile-3] GET /api/profile/passenger/account-summary — passenger
**Use:** account-health / safety screen (counts only).
**Request:** none.
**Response:** `200 {account_summary: [{type: "alerts"|"violations"|"sanctions"|"complaints", count}]}`.
**Watch out:** —.

### [profile-4] GET /api/profile/passenger/home — passenger
**Use:** app launch — next booking + recent trips.
**Request:** none.
**Response:** `200 {passenger{id, full_name, rating}, next_booking{booking_id, trip, driver, vehicle}|null, last_searched_trips[5], last_trips[5]}`.
**Watch out:** never cached; sweeps expired trips first.

### [rate-1] POST /api/ratings — passenger, driver
**Use:** rate the other party after the ride (both directions).
**Request:** body `{booking_id*, stars* (1–5), was_late (bool), late_minutes (≥0), review (≤500), tags (non-empty strings[])}`.
**Response:** `200 {rating: {...}, already_rated (bool)}`.
**Watch out:** only booking passenger or trip driver; one rating per rater per booking — repeats return the existing row with `already_rated: true`.

---

## 4. Driver account — `driver-*`, `sub-*`, `pay-*`

### [driver-1] GET /api/driver/bookings — driver
**Use:** driver bookings / history screens (own trips only, earliest departure first).
**Request:** query `{status (BOOKING_STATUS filter), date_from/date_to (created-at bounds), page (≥1), limit (1–100)}`.
**Response:** `200 {data: [booking + trip + passenger], pagination}`.
**Watch out:** stale trips are swept first so expired trips read terminal.

### [driver-2] GET /api/driver/bookings/:booking_id — driver
**Use:** booking detail on the driver's side.
**Request:** params `{booking_id}`.
**Response:** `200 {booking: detail + trip + stops + passenger}`.
**Watch out:** `404` missing; `403` if not on the caller's trip.

### [driver-3] GET /api/driver/offers — driver
**Use:** driver "my bids" screen (ride-request offers sent).
**Request:** query `{status (REQUEST_OFFER_STATUS filter), page, limit}`.
**Response:** `200 {data: [offer + nested request{origin_city, destination_city, origin_time, seats_needed, status}], pagination}`.
**Watch out:** stale offers expire first.

### [driver-4] GET /api/driver/ratings — driver
**Use:** driver ratings screen (summary + list).
**Request:** query `{page, limit (service caps 50), sort ("recent"|"highest"|"lowest")}`.
**Response:** `200 {summary: {average_rating, total_ratings, punctuality_rate, distribution[5..1]}, data: [rating + rater], pagination}`.
**Watch out:** only visible ratings count; default sort recent.

### [driver-5] GET /api/driver/penalties — driver
**Use:** penalties / violations screen.
**Request:** query `{active ("true"|"false", unexpired only), page, limit}`.
**Response:** `200 {data: [penalty] (newest first), pagination}`.
**Watch out:** —.

### [driver-6] GET /api/driver/complaints — driver
**Use:** complaints screen (filed by me + filed against me).
**Request:** query `{direction ("filed"|"against", default both), status (COMPLAINT_STATUS), page, limit}`.
**Response:** `200 {data: [complaint + direction], pagination}`.
**Watch out:** —.

### [driver-7] GET /api/driver/earnings — driver
**Use:** earnings charts (completed bookings aggregates).
**Request:** query `{period ("day"|"week"|"month", default month), from/to (ISO8601 bounds)}`.
**Response:** `200 {period, currency: "JOD", total, breakdown: [{bucket, earnings, trips}]}`.
**Watch out:** read-only grouping; defaults to last day/week/month.

### [driver-8] GET /api/driver/stats — driver
**Use:** dashboard stat cards (lifetime counters).
**Request:** none.
**Response:** `200 {stats: {total_trips, total_bookings, no_show_rate, response_rate, avg_rating, total_earnings, completed_trips, cancelled_trips}}`.
**Watch out:** zeros for empty accounts.

### [driver-9] GET /api/driver/profile — driver
**Use:** profile header (masked PII + vehicles).
**Request:** none.
**Response:** `200 {profile: {user{id, full_name, phone(masked), role, status, avg_rating}, driver{...national_id(masked)}, verification{...}, vehicles[], ratings_summary{avg, count}}}`.
**Watch out:** `404` if user missing; phone/national ID masked server-side.

### [driver-10] GET /api/driver/profile/full — driver
**Use:** full profile page (vehicle, subscription card, stats, menu).
**Request:** none.
**Response:** `200 {driver: {...}, vehicle (object|null), subscription (card|null), stats: {...}, menu_items: []}`.
**Watch out:** subscription failures degrade to `null`; suspended users rejected.

### [driver-11] GET /api/driver/personal-data — driver
**Use:** edit-personal-data screen (values + which fields are locked).
**Request:** none.
**Response:** `200 {personal_data, vehicle|null, editable_now[], locked_fields[], rejected_fields[]}`.
**Watch out:** fields lock when verification is pending/approved; rejected lists admin-flagged fields.

### [driver-12] PUT /api/driver/personal-data — driver
**Use:** save personal-data form.
**Request:** body `{full_name (3–120), display_name (≤120|null), email (email|null), phone (non-empty), age (18–100|null), avatar_url (null ok), national_id (5–30), vehicle: {manufacturer, model, model_year, color, plate_number, total_seats (1–15)}}`.
**Response:** `200 {personal_data, vehicle, editable_now, locked_fields, rejected_fields, verification_status, requires_verification (bool), message}`.
**Watch out:** `403` on locked fields when verified/pending; `409` email/phone/plate clash; identity edits reset status to pending.

### [driver-13] GET /api/driver/account-status — driver
**Use:** account standing / settings screen (penalties, deletion eligibility).
**Request:** none.
**Response:** `200 {status, verification_status, is_verified, is_suspended, is_banned, suspension_details{reason, starts_at, ends_at}|null, active_penalties[], is_deletion_requested, can_delete, can_logout: true}`.
**Watch out:** `can_delete` false when banned or a request is pending.

### [driver-14] POST /api/driver/delete-account — driver
**Use:** delete-account confirmation screen.
**Request:** body `{reason (free text|null), confirmation* (must be `true`)}`.
**Response:** `200 {request_id, status: "pending", estimated_completion}`.
**Watch out:** `422` unless confirmation is true; `409` if a request is pending; clears FCM token; ~5 business days (Fri/Sat skipped).

### [driver-15] POST /api/driver/delete-account/cancel — driver
**Use:** undo-delete action.
**Request:** none.
**Response:** `200 {request_id, status: "cancelled"}`.
**Watch out:** `404` if no pending request.

### [driver-16] GET /api/driver/home — driver
**Use:** driver home on app open (subscription, next trip, today summary).
**Request:** none.
**Response:** `200 {driver: {...}, subscription|null, next_trip|null, summary: {completed_trips_today, reserved_seats_for_next_trip, trips_today}, recent_bookings: []}`.
**Watch out:** `403` unless verified and active; sweeps stale trips first.

### [driver-17] GET /api/driver/subscription — driver
**Use:** subscription details screen.
**Request:** none.
**Response:** `200 {subscription: {tier, price, currency: "JOD", expires_at, days_remaining, balance, plan_name, free_trips}|null, history: [{id, plan_name, period_days, balance, status, created_at, expires_at}]}`.
**Watch out:** same verified+active gate as home; `days_remaining` clamped ≥0.

### [sub-1] POST /api/subscriptions — driver
**Use:** subscribe/checkout submit (paid plan + payment screenshot).
**Request:** body `{plan_id* (active non-free plan), payment_method_id* (active method), screenshot_id* (uploaded-image id), resubmit (bool, replaces prior pending)}`.
**Response:** `201 {subscription_id, status: "pending_approval", message}`.
**Watch out:** `422` inactive plan / free plan / bad method or screenshot; `409` duplicate request unless `resubmit: true`.

### [sub-2] GET /api/subscriptions — driver
**Use:** subscription history list.
**Request:** none.
**Response:** `200 {subscriptions: [{id, plan{name, period_days}, balance, status, rejection_reason, created_at, approved_at, expires_at, free_trips?}]}` (newest first).
**Watch out:** `free_trips` only when the plan snapshot has an offer.

### [sub-3] GET /api/subscriptions/current — driver
**Use:** gate driving/commission state (effective plan + debt flag).
**Request:** none.
**Response:** `200 {subscription: {id, plan{name, percentage_cut}, balance, expires_at, free_trips?}|null, total_balance, is_in_debt}`.
**Watch out:** `subscription: null` on free/no active plan.

### [pay-1] GET /api/payment-methods — any signed-in user
**Use:** payment destinations for the subscribe form.
**Request:** none.
**Response:** `200 {methods: [{id, name, account_number, type, email}]}` (active only).
**Watch out:** no roleGuard — any signed-in user.

### [pay-2] GET /api/payment-methods/all — admin
**Use:** admin payment-settings list (includes inactive).
**Request:** none.
**Response:** `200 {methods: [{..., is_active}]}`.
**Watch out:** admin only.

### [pay-3] POST /api/payment-methods — admin
**Use:** admin add-method form.
**Request:** body `{name* (≤100), account_number* (≤50), type* ("bank_account"|"e_wallet"|"mobile_money"), email (optional)}`.
**Response:** `201 {payment_method: {...}}`.
**Watch out:** validation errors on missing/invalid fields.

### [pay-4] PUT /api/payment-methods/:method_id — admin
**Use:** admin edit-method form.
**Request:** params `{method_id}`; body `{name, account_number, type, email — all optional}`.
**Response:** `200 {payment_method: {...}}`.
**Watch out:** `404 PAYMENT_METHOD_NOT_FOUND`.

### [pay-5] DELETE /api/payment-methods/:method_id — admin
**Use:** admin disable action (soft-delete, keeps snapshots intact).
**Request:** params `{method_id}` (no validate middleware).
**Response:** `200 {message: "PAYMENT_METHOD_DEACTIVATED"}`.
**Watch out:** `404` if unknown.

---

## 5. Admin & moderation — `admin-*`, `mod-*`, `asub-*`, `aver-*`, `atrip-*`, `sos-*`, `support-*`, `complain-*`

### [admin-1] GET /api/admin/dashboard/summary — admin
**Use:** admin home (KPIs, alerts, top routes, recent trips, pending items).
**Request:** none.
**Response:** `200 {kpis: {total_drivers, active_drivers, total_trips, active_trips, total_vehicles, pending_documents}, alerts[], top_routes[], recent_trips[], pending_requests[], latest_complaints[]}`.
**Watch out:** no pagination.

### [admin-2] GET /api/admin/dashboard/recent-trips — admin
**Use:** dashboard trips widget (optional status filter).
**Request:** query `{page, limit, status (published|full|in_progress|ongoing|completed|cancelled|canceled)}`.
**Response:** `200 {data: [{trip_id, driver{id, name}, route{origin, destination}, departure_time, status, passengers_count, reservations_count}], pagination}`.
**Watch out:** unknown status values pass through raw.

### [admin-3] GET /api/admin/dashboard/top-routes — admin
**Use:** dashboard chart (top 5 origin→destination pairs).
**Request:** none.
**Response:** `200 {top_routes: [{origin, destination, trips_count}]}`.
**Watch out:** loaded together with `[admin-1]`.

### [admin-4] GET /api/admin/dashboard/pending-requests — admin
**Use:** dashboard approval queue (pending-verification drivers).
**Request:** query `{page, limit, status (validated but ignored)}`.
**Response:** `200 {data: [{driver_id, name, phone(masked), submitted_at, pending_documents[]}], pagination}`.
**Watch out:** service always returns the pending bucket regardless of `status`.

### [admin-5] GET /api/admin/dashboard/latest-complaints — admin
**Use:** dashboard complaints widget.
**Request:** query `{page, limit, status (validated but ignored)}`.
**Response:** `200 {data: [{id, complainant{name}, accused{name}, date, subject, status}], pagination}`.
**Watch out:** `status` validated but not applied.

### [admin-6] GET /api/admin/dashboard/drivers — admin
**Use:** admin drivers table (search, filter, sort).
**Request:** query `{page, limit, search (≤120, name/phone), status ("active"|"suspended"|"pending"|"blocked"), registration_from/to ("YYYY-MM-DD"), sort_by ("created_at"|"full_name"|"avg_rating"), sort_order ("asc"|"desc")}`.
**Response:** `200 {data: [{id, name, phone(masked), registration_date, avg_rating, total_trips, balance, account_status}], pagination}`.
**Watch out:** `pending` = unverified/pending/rejected; `blocked` = banned.

### [admin-7] GET /api/admin/dashboard/drivers/stats/summary — admin
**Use:** count cards above the drivers table.
**Request:** none.
**Response:** `200 {total_drivers, active_drivers, suspended_drivers, pending_drivers}`.
**Watch out:** declare-before-`:driver_id` route; no params.

### [admin-8] GET /api/admin/dashboard/drivers/:driver_id — admin
**Use:** driver dossier header.
**Request:** params `{driver_id}`.
**Response:** `200 {id, name, phone(masked), age|null, city (null), avatar_url, account_status, trip_stats{total, completed, canceled}, balance, avg_rating, reviews_count}`.
**Watch out:** `404 DRIVER_NOT_FOUND` if the id isn't a driver.

### [admin-9] GET /api/admin/dashboard/drivers/:driver_id/overview — admin
**Use:** dossier overview tab.
**Request:** params `{driver_id}`.
**Response:** `200 {personal_info{name, phone, registration_date, last_login, city}, trip_statistics{total, completed, canceled, avg_rating}, balance_details{...}|null}`.
**Watch out:** `balance_details` null with no subscription.

### [admin-10] GET /api/admin/dashboard/drivers/:driver_id/trips — admin
**Use:** dossier trips tab (status + month filters).
**Request:** params `{driver_id}`; query `{page, limit, status ("all"|"pending"|"completed"|"canceled"|"cancelled"|"active"), month ("YYYY-MM")}`.
**Response:** `200 {data: [{trip_id, route{origin, destination}, date_time, passengers_count, reservations_count, price, status}], pagination}`.
**Watch out:** `pending` = published+full; `active` = in_progress+ongoing.

### [admin-11] GET /api/admin/dashboard/drivers/:driver_id/evaluations — admin
**Use:** dossier evaluations tab (summary + distribution + reviews).
**Request:** params `{driver_id}`; query `{page, limit, status (validated but ignored)}`.
**Response:** `200 {summary{average_rating, total_reviews}, distribution[{rating, count}], top_tags[], reviews[{passenger_name, passenger_avatar, rating, comment, was_late, date}], pagination}`.
**Watch out:** —.

### [admin-12] GET /api/admin/dashboard/drivers/:driver_id/account-log — admin
**Use:** dossier account tab (penalties + complaints timeline).
**Request:** params `{driver_id}`.
**Response:** `200 {summary{violations, warnings, suspensions, complaints_against, complaints_by}, log: [{title, reason, related_trip_id, date, type, status ("pending"|"resolved"), direction?}]}`.
**Watch out:** open items map to `pending`.

### [admin-13] GET /api/admin/dashboard/drivers/:driver_id/car — admin
**Use:** dossier car tab.
**Request:** params `{driver_id}`.
**Response:** `200 {car_info{make, model, year, color, plate_number, seats}|null, car_photos{front, rear}, document_status[{key, status}], vehicle_verified (bool)}`.
**Watch out:** `car_info` null with no vehicle row.

### [admin-14] GET /api/admin/dashboard/drivers/:driver_id/documents — admin
**Use:** dossier documents tab (grouped personal + vehicle docs).
**Request:** params `{driver_id}`.
**Response:** `200 {personal_documents[{key, document_url, upload_date, status ("approved"|"rejected"|"pending"|"missing"), reason?}], vehicle_documents[...]}`.
**Watch out:** insurance key is always `not_tracked_yet`.

### [admin-15] POST /api/admin/dashboard/drivers/:driver_id/status — admin
**Use:** set driver status from the dossier.
**Request:** params `{driver_id}`; body `{status*: "active"|"suspended"|"pending"|"blocked"}`.
**Response:** `200 {driver: {id, account_status}}`.
**Watch out:** `409` no-op; audited.

### [admin-16] POST /api/admin/dashboard/drivers/:driver_id/account-status — admin
**Use:** suspend / reactivate / unblock (standing actions).
**Request:** params `{driver_id}`; body `{action*: "suspend"|"reactivate"|"unblock", reason (≤500, optional)}`.
**Response:** `200 {driver: {id, account_status}}`.
**Watch out:** suspend writes a suspension Penalty; `409` no-op; audited.

### [admin-17] POST /api/admin/dashboard/drivers/:driver_id/documents/:document_key/approve — admin
**Use:** approve one document (`id_front|id_back|face_photo|license_front|license_back|registration_front|registration_back|insurance`).
**Request:** params `{driver_id, document_key (2–40 chars)}`.
**Response:** `200 {document: {key, status: "approved", decided_by, decided_at}}`.
**Watch out:** `400` unknown key or no backing file; audited.

### [admin-18] POST /api/admin/dashboard/drivers/:driver_id/documents/:document_key/reject — admin
**Use:** reject one document with reason.
**Request:** params `{driver_id, document_key}`; body `{reason (≤2000, optional)}`.
**Response:** `200 {document: {key, status: "rejected", decided_by, decided_at, reason?}}`.
**Watch out:** same `400`s as approve; audited.

### [admin-19] GET /api/admin/dashboard/reservations — admin
**Use:** admin reservations view (all bookings with context).
**Request:** query `{page, limit, status (pending|confirmed|cancelled|canceled|completed|no_show)}`.
**Response:** `200 {data: [{reservation_id, reference_code, driver{id, name}|null, passenger{id, name}|null, trip{id, origin, destination, departure_time}|null, seats_booked, price, currency, status}], pagination}`.
**Watch out:** invalid status values are silently ignored (no filter).

### [mod-1] GET /api/admin/complaints — admin
**Use:** moderation queue (status/category filters).
**Request:** query `{status ("open"|"reviewing"|"resolved"|"dismissed"), category ("no_show"|"lateness"|"misconduct"|"fraud"|"safety"|"overcharging"|"other"), page, limit}`.
**Response:** `200 {data: [{id, category, description, status, reporter_name, accused_name, booking_id, evidence_urls, created_at}], pagination}`.
**Watch out:** —.

### [mod-2] PUT /api/admin/complaints/:complaint_id — admin
**Use:** move a complaint reviewing/resolved/dismissed.
**Request:** params `{complaint_id}`; body `{status* ("reviewing"|"resolved"|"dismissed"), resolution (≤2000, required when resolved)}`.
**Response:** `200 {complaint: {id, status, resolution, resolved_by, resolved_at}}`.
**Watch out:** `404` missing; dismissed without resolution defaults the text; audited.

### [mod-3] GET /api/admin/users — admin
**Use:** user-management table (role/status filters).
**Request:** query `{role ("passenger"|"driver"|"admin"|"support"|"moderator"), status ("active"|"warned"|"suspended"|"banned"), page, limit}`.
**Response:** `200 {data: [{id, full_name, phone(masked), role, status, avg_rating, created_at}], pagination}`.
**Watch out:** served directly from the controller; phone masked.

### [mod-4] PUT /api/admin/users/:user_id — admin
**Use:** change a user's enforcement status (+ optional reason notice).
**Request:** params `{user_id}`; body `{status* ("active"|"warned"|"suspended"|"banned"), reason (≤500, optional)}`.
**Response:** `200 {user: {id, status, updated_by}}`.
**Watch out:** `404` missing; audited; in-app notice only when a reason is given (suspend/ban also revoke live sessions → `[sock-31]`/`[sock-32]`).

### [mod-5] PUT /api/admin/trips/:trip_id — admin
**Use:** moderate a trip (unpublish / block / restore).
**Request:** params `{trip_id}`; body `{action* ("unpublish"|"block"|"restore"), reason (≤500, optional)}`.
**Response:** `200 {trip: {id, status, is_blocked_by_balance, moderated}}`.
**Watch out:** `404` missing; block also cancels the trip; audited.

### [mod-6] POST /api/admin/penalties — admin
**Use:** issue an append-only penalty (warn/suspend/ban).
**Request:** body `{user_id*, type* ("warning"|"suspension"|"ban"), reason* (≤2000), complaint_id (optional), details (≤4000, optional), ends_at (ISO8601 — required for suspension, forbidden for ban, must be future)}`.
**Response:** `200 {penalty: {id, user_id, type, reason, details, starts_at, ends_at, issued_by}}`.
**Watch out:** `404` user missing; syncs `users.status`; suspensions/bans revoke live sessions best-effort; audited.

### [asub-1] GET /api/admin/plans — admin
**Use:** admin plans screen (includes inactive).
**Request:** none.
**Response:** `200 {plans: [{id, name, period_days, percentage_cut, cost, status, features[], is_free, free_offer, is_active}]}`.
**Watch out:** driver catalog (`[plan-1]`) hides free/inactive instead.

### [asub-2] POST /api/admin/plans — admin
**Use:** create a subscription plan.
**Request:** body `{name* (≤100), period_days* (≥1), percentage_cut (0–100), cost (≥0), status ("most_requested"|"frequent"|"popular"|null), features (string[] ≤200 each), is_free (bool), free_offer ({type: "trips"|"credit", value > 0}, required if is_free)}`.
**Response:** `201 {plan: {...}}`.
**Watch out:** `409` on a second active free plan; invalidates plans cache; audited.

### [asub-3] PUT /api/admin/plans/:plan_id — admin
**Use:** edit plan pricing/badge/features/free-offer.
**Request:** params `{plan_id}`; body `{same fields as asub-2, all optional}`.
**Response:** `200 {plan: {...}}`.
**Watch out:** `404` missing; same single-free-plan `409`; audited.

### [asub-4] DELETE /api/admin/plans/:plan_id — admin
**Use:** soft-deactivate a plan (no new subscriptions).
**Request:** params `{plan_id}` (no validate middleware).
**Response:** `200 {message: "PLAN_DEACTIVATED"}`.
**Watch out:** `404` missing.

### [asub-5] GET /api/admin/payment-methods — admin
**Use:** admin payment-method configuration (includes inactive).
**Request:** none.
**Response:** `200 {methods: [{id, name, account_number, type, email, is_active}]}`.
**Watch out:** driver list (`[pay-1]`) shows active only.

### [asub-6] POST /api/admin/payment-methods — admin
**Use:** add a payment destination.
**Request:** body `{name* (≤100), account_number* (≤50), type* ("bank_account"|"e-wallet"|"mobile_money"), email (optional)}`.
**Response:** `201 {method: {...}}`.
**Watch out:** audited.

### [asub-7] PUT /api/admin/payment-methods/:method_id — admin
**Use:** edit a payment destination.
**Request:** params `{method_id}`; body `{name, account_number, type, email — all optional}`.
**Response:** `200 {method: {...}}`.
**Watch out:** `404` missing; audited.

### [asub-8] DELETE /api/admin/payment-methods/:method_id — admin
**Use:** soft-deactivate a payment method.
**Request:** params `{method_id}` (no validate middleware).
**Response:** `200 {message: "PAYMENT_METHOD_DEACTIVATED"}`.
**Watch out:** `404` missing.

### [asub-9] GET /api/admin/subscriptions/pending — admin
**Use:** payment-request review queue (masked national IDs).
**Request:** query `{status (default pending_approval), sort ("oldest"|"newest")}` (no express-validator; invalid status throws).
**Response:** `200 {pending: [{subscription_id, driver{id, full_name, phone, national_id_masked}, plan{name, cost, is_active}, payment_method{name}, screenshot_id, screenshot_url, submitted_at}]}`.
**Watch out:** —.

### [asub-10] POST /api/admin/subscriptions/:subscription_id/approve — admin
**Use:** approve a subscription (activates, credits balance, merges same-plan renewals).
**Request:** params `{subscription_id}`.
**Response:** `200 {message, subscription_id, balance_added}`.
**Watch out:** `409` double-action or inactive plan; notifies the driver.

### [asub-11] POST /api/admin/subscriptions/:subscription_id/reject — admin
**Use:** reject a subscription with reason.
**Request:** params `{subscription_id}`; body `{reason* (≤500)}`.
**Response:** `200 {message, subscription_id}`.
**Watch out:** `409` double-action; notifies the driver.

### [aver-1] GET /api/admin/verification/queue — admin
**Use:** verification review queue.
**Request:** query `{status ("pending"|"approved"|"rejected"|"unverified"), search (≤100, name/phone), page, limit}`.
**Response:** `200 {requests: [{id, status{value, submitted_at}, driver{...}, vehicle{...}, documents[{field, url, status}]}], meta: {pagination}}` (envelope, not success wrapper).
**Watch out:** —.

### [aver-2] POST /api/admin/verification/drivers/:driver_id/approve — admin
**Use:** approve identity docs (marks profile + vehicle verified).
**Request:** params `{driver_id}`.
**Response:** `200 {driver_id, id_verified: true, notified (bool)}`.
**Watch out:** `404` profile/driver missing; notifies driver. Gate: driver can't publish until this happens.

### [aver-3] POST /api/admin/verification/drivers/:driver_id/reject — admin
**Use:** reject identity docs with fixes.
**Request:** params `{driver_id}`; body `{reason* (≤2000), fields_to_fix* (non-empty: national_id|license|personal_photo|vehicle_registration|vehicle_photo|vehicle_details|personal_details)}`.
**Response:** `200 {driver_id, id_verified: false, reason, notified}`.
**Watch out:** `404` profile missing; notifies driver with the fix list.

### [aver-4] POST /api/admin/verification/vehicles/:vehicle_id/approve — admin
**Use:** approve a vehicle (promotes owner to approved when fully verified).
**Request:** params `{vehicle_id}`.
**Response:** `200 {vehicle_id, is_verified: true, notified}`.
**Watch out:** `404` vehicle missing; notifies owner.

### [aver-5] POST /api/admin/verification/vehicles/:vehicle_id/reject — admin
**Use:** reject a vehicle (owner back to rejected).
**Request:** params `{vehicle_id}`; body `{reason* (≤2000), fields_to_fix* (non-empty allowed keys)}`.
**Response:** `200 {vehicle_id, is_verified: false, reason, notified}`.
**Watch out:** `404` vehicle missing; notifies owner.

### [atrip-1] GET /api/admin/trips/:trip_id/route — admin, support, moderator
**Use:** support investigation of any trip's planned route + pickups.
**Request:** params `{trip_id}`.
**Response:** `200` same shape as `[trip-17]`.
**Watch out:** every view audited (`trip.route_viewed`); `404` missing.

### [atrip-2] GET /api/admin/trips/:trip_id/route/actual — admin, support, moderator
**Use:** dispute/incident review of the recorded GPS path.
**Request:** params `{trip_id}`.
**Response:** `200 {trip_id, route_status, polyline, actual_path_polyline, actual_distance_m, actual_duration_s, started_at, completed_at}`.
**Watch out:** `403` unless the trip is completed; audited.

### [sos-1] GET /api/admin/sos — admin
**Use:** admin safety monitor (SOS list).
**Request:** query `{status ("pending"|"acknowledged"|"resolved"|"cancelled"), page, limit}`.
**Response:** `200 {data: [{id, user_id, user_name, trip_id, booking_id, lat, lng, urgency, escalation_level, status, triggered_at}], pagination}`.
**Watch out:** polled by the SOS screen; the escalation job re-alerts every 60s.

### [sos-2] POST /api/admin/sos/:id/ack — admin
**Use:** claim ownership of an incident.
**Request:** params `{id (SOS event uuid)}`.
**Response:** `200 {sos_event: {...}}`.
**Watch out:** `404` missing; `409` already closed; idempotent when already acknowledged.

### [sos-3] POST /api/admin/sos/:id/resolve — admin
**Use:** close an SOS (broadcasts `[sock-17]`).
**Request:** params `{id}`; body `{resolution_note (≤500, optional)}`.
**Response:** `200 {sos_event: {...}}`.
**Watch out:** `404` missing; `409` already resolved/cancelled.

### [support-1] POST /api/support-tickets — passenger, driver, admin, support, moderator
**Use:** help screen → file a ticket (notifies staff).
**Request:** body `{category* (≤50), subject* (≤150), description* (≤5000), priority ("low"|"medium"|"high"|"urgent"), booking_id (optional), trip_id (optional)}`.
**Response:** `201 {support_ticket: {id, reference_code, user_id, user_name, category, subject, description, priority, status, assigned_to, booking_id, trip_id, resolution_notes, created_at, updated_at}}`.
**Watch out:** `404` if `booking_id` is unknown.

### [support-2] GET /api/support-tickets — passenger, driver, admin, support, moderator
**Use:** ticket list screens (staff see all; users see own).
**Request:** query `{status ("open"|"in_progress"|"resolved"|"closed"), priority, page, limit}`.
**Response:** `200 {data: [ticket without messages], pagination}`.
**Watch out:** —.

### [support-3] GET /api/support-tickets/:ticket_id — passenger, driver, admin, support, moderator
**Use:** open one thread with messages (chronological).
**Request:** params `{ticket_id}` (no validate middleware).
**Response:** `200 {support_ticket: {..., messages: [{id, ticket_id, sender_id, sender_name, sender_role, message, created_at}]}}`.
**Watch out:** `404` missing; `403` on other users' tickets.

### [support-4] PUT /api/support-tickets/:ticket_id — admin, support, moderator
**Use:** staff triage (assign, priority, category, notes).
**Request:** params `{ticket_id}`; body `{assigned_to (uuid), priority, category (≤50), resolution_notes (≤4000) — all optional}`.
**Response:** `200 {support_ticket: {...without messages}}`.
**Watch out:** `404` missing.

### [support-5] PUT /api/support-tickets/:ticket_id/status — admin, support, moderator
**Use:** advance/close ticket workflow status.
**Request:** params `{ticket_id}`; body `{status* ("open"|"in_progress"|"resolved"|"closed")}`.
**Response:** `200 {support_ticket: {...without messages}}`.
**Watch out:** `409` closed tickets can't reopen.

### [support-6] POST /api/support-tickets/:ticket_id/messages — passenger, driver, admin, support, moderator
**Use:** reply in a ticket thread (owner or staff).
**Request:** params `{ticket_id}`; body `{message* (≤4000)}`.
**Response:** `201 {ticket_message: {id, ticket_id, sender_id, sender_name, sender_role, message, created_at}}`.
**Watch out:** `403` on someone else's ticket; `404` missing.

### [complain-1] POST /api/complaints — passenger, driver, admin, support, moderator
**Use:** file a complaint against another user (trip/booking screen).
**Request:** body `{accused_id* (≠ self), booking_id (optional), category* ("no_show"|"lateness"|"misconduct"|"fraud"|"safety"|"overcharging"|"other"), description* (≤2000), evidence_urls (http(s) URLs[], optional)}`.
**Response:** `200 {complaint: {id, accused_id, category, status, created_at}, already_filed (bool)}`.
**Watch out:** idempotent — same open reporter/accused/booking/category returns `already_filed: true`; `404` accused missing.

---

## 6. Chat, notifications & settings — `chat-*`, `notif-*`, `notifset-*`

### [chat-1] GET /api/chat/bookings/:bookingId/messages — any signed-in user
**Use:** booking chat history (membership-only, readable after completion/cancel).
**Request:** params `{bookingId}`; query `{before_id (uuid cursor), limit (1–100), page (≥1)}`.
**Response:** `200 {data: [{id, sender_id, sender_name, message, message_type, booking_id, support_ticket_id, is_read, read_at, created_at}], pagination}`.
**Watch out:** —.

### [chat-2] GET /api/chat/tickets/:ticketId/messages — any signed-in user
**Use:** support-ticket chat history (owner or staff).
**Request:** params `{ticketId}`; query `{before_id, limit, page}`.
**Response:** `200` same message shape with `support_ticket_id` set.
**Watch out:** —.

### [notif-1] GET /api/notifications/ — any signed-in user
**Use:** notification inbox (newest first, optional unread filter).
**Request:** query `{limit, page, unread ("true"|"false"|omitted)}`.
**Response:** `200 {data: [{id, type, title, body, data, is_read, created_at}], pagination}`.
**Watch out:** —.

### [notif-2] PUT /api/notifications/:notification_id/read — any signed-in user
**Use:** mark one notification read (re-emits the unread badge).
**Request:** params `{notification_id}` (no param validator in code; controller/service require an owned id). No body.
**Response:** `200 {notification: {id, is_read: true}}`.
**Watch out:** an owned id is required.

### [notif-3] PUT /api/notifications/read-all — any signed-in user
**Use:** mark every unread notification owned by the caller as read (re-emits the unread badge).
**Request:** no body.
**Response:** `200 {marked: number}`.
**Watch out:** only the caller's notifications are touched.

### [notif-4] DELETE /api/notifications — any signed-in user
**Use:** clear the caller's notification inbox.
**Request:** no body.
**Response:** `200 {deleted: number}`.
**Watch out:** only the caller's notifications are deleted; other users are untouched.

### [notif-5] POST /api/notifications/device — any signed-in user
**Use:** register/refresh the FCM device token used for push delivery. Call on login, app start, and whenever the SDK rotates the token.
**Request:** body `{fcm_token* (string, 1–4096 chars)}`.
**Response:** `200 {device: {registered: true}}`.
**Watch out:** the same token is detached from any other account first (shared phone / account switch), and tokens are never included in audit payloads.

### [notif-6] DELETE /api/notifications/device — any signed-in user
**Use:** stop push delivery for this device (call on logout).
**Request:** body `{fcm_token (string, optional)}` — when supplied, the stored token must match.
**Response:** `200 {device: {registered: boolean}}` (`false` = no token remains on the account).
**Watch out:** a stale logout with an old token leaves the newer registration intact.

### [notifset-1] GET /api/settings/notifications/ — any signed-in user
**Use:** per-type channel toggles screen.
**Request:** none.
**Response:** `200 {settings: [{type, enabled_in_app, enabled_push}]}` (missing rows default all-true).
**Watch out:** —.

### [notifset-2] PUT /api/settings/notifications/ — any signed-in user
**Use:** save per-type toggles.
**Request:** body `{settings*: non-empty [{type* (NOTIFICATION_TYPE), enabled_in_app (bool), enabled_push (bool)}]}`.
**Response:** `200 {updated_count}`.
**Watch out:** —.

### [notifset-3] GET /api/settings/notifications/grouped — driver
**Use:** grouped settings screen (categories + master switch).
**Request:** none.
**Response:** `200 {categories: [{key, label, types[]}], master_switch (true if all on)}`.
**Watch out:** driver only.

### [notifset-4] PUT /api/settings/notifications/grouped — driver
**Use:** master-switch or per-type grouped update.
**Request:** body `{master_switch (bool, hard-overwrites everything, exclusive with updates) XOR updates (non-empty [{type*, enabled*, channel ("in_app"|"push", omitted = both)}])}`.
**Response:** `200` grouped view `{master_switch, categories}`.
**Watch out:** driver only.

---

## 7. Socket events — `sock-*`

Connect with the access token (`auth: {token}`), always emit **with an ack callback** and check `status`. Ack errors look like `{status: "error", code, message}`.

### Chat
- **[sock-1] `chat:join`** (client→server) `{booking_id? (CONFIRMED booking + active trip) | support_ticket_id? (owner/agent)}` → ack `{room}`. Join the conversation room for a screen.
- **[sock-2] `chat:leave`** (client→server) same payload → ack `{left: true}`. Leave when the screen closes.
- **[sock-3] `chat:send`** (client→server) `{booking_id? | support_ticket_id?, message* (non-empty, sanitized), message_type?}` → ack `{id, created_at}`. Persists then broadcasts. Rate-limited. Errors: membership, `RATE_LIMITED`.
- **[sock-4] `chat:typing`** (both) `{booking_id? | support_ticket_id?, is_typing (bool)}` → ack `{throttled}`. Throttled to 1500ms; forwarded to other members as…
- **[sock-5] `chat:read`** (client→server) `{booking_id? (whole room) | message_id? (single, not own) | support_ticket_id?}` → ack. Broadcasts read receipts.
- **[sock-6] `chat:receive`** (server→client) `{id, sender_id, sender_name, message, message_type, booking_id|null, support_ticket_id|null, created_at, timestamp}`. Deduplicate by `id` (own messages echo).
- **[sock-7] `chat:read_ack`** (server→client) `{message_id|booking_id|support_ticket_id, read_by, read_at, timestamp}`.
- **[sock-8] `chat:typing`** (server→client) `{is_typing, sender_id, timestamp}`.

### Notifications
- **[sock-9] `notification:read`** (client→server) `{notification_id?}` → ack `{notification_id}` + refreshed count.
- **[sock-10] `notification:read_all`** (client→server) `{}` → ack `{marked}` + refreshed count.
- **[sock-11] `notification:new`** (server→client) `{id, type, title, body, data, created_at, timestamp}` on `user:{id}` — all devices.
- **[sock-12] `notification:count`** (server→client) `{unread_count, timestamp}` — badge; pushed on connect, after reads, after each in-app notification.

### SOS
- **[sock-13] `sos:trigger`** (client→server) `{trip_id* (must be an active-trip member), lat*, lng*, urgency? (default HIGH)}` → ack `{sos_event_id, reused}`. Rate-limited. Reuses the existing active SOS instead of duplicating.
- **[sock-14] `sos:ack`** (server→client) `{status: "received", sos_event_id, assigned_support_id: null, timestamp}` — show "help is on the way" state.
- **[sock-15] `sos:alert`** (server→client, admin room) `{sos_event_id, user_id, user_name, trip_id, lat, lng, driver_lat|null, driver_lng|null, urgency, escalation_level (0|1), triggered_at, timestamp}` — repeated every 60s until resolved.
- **[sock-16] `admin:sos_alert`** (server→client) duplicate of `[sock-15]` for admin dashboards on the admin namespace.
- **[sock-17] `sos:resolved`** (server→client) `{sos_event_id, resolution, resolved_at, resolved_by, timestamp}` — closes the incident UI.

### Live tracking
- **[sock-18] `tracking:join`** (client→server) `{trip_id*}` → ack `{room: "trip:<id>"}`. Driver of the trip OR `CONFIRMED` passenger, trip must be `in_progress` — strangers, cancelled bookings, and finished trips are refused.
- **[sock-19] `tracking:start`** (client→server, driver) `{trip_id*}` → broadcasts initial `tracking:update` (null coords, `en_route`).
- **[sock-20] `tracking:location`** (client→server, driver, max 1 per 2s) `{trip_id*, lat*, lng*, speed? (km/h, enables ETA), heading?, accuracy?, recorded_at? (>5 min old is discarded), occurrence_date? (recurring trips)}` or batch `{trip_id*, points: [...≤60]}` → ack single = `tracking:update` object, batch = `{trip_id, received, stored}`. Persisted before broadcast; non-drivers dropped.
- **[sock-21] `tracking:stop`** (client→server, driver) `{trip_id*}` → `tracking:update` with `status: "stopped"`.
- **[sock-22] `tracking:update`** (server→client, room) `{trip_id, driver_lat, driver_lng, eta_minutes|null, status ("en_route"|"stopped"), timestamp}`. NOTE: each passenger also gets a personal copy on `user:{id}` with the ETA to **their own** pickup — use the personal copy for the passenger ETA banner.
- **[sock-23] `tracking:next_pickup`** (server→client, driver) `{trip_id, booking_id, label|null, distance_m|null, remaining_count}` — advances as pickups are marked.
- **[sock-24] `tracking:proximity`** (server→client, passenger, once per booking) `{trip_id, booking_id, state: "near" (≈1 km) | "arrived" (≈150 m)}` + matching push notification.
- **[sock-25] `tracking:pickup_status`** (server→client, room) `{trip_id, booking_id, state: "arrived"|"picked_up"|"missed"}`.
- **[sock-26] `tracking:route_updated`** (server→client, room) `{route_version}` → refetch `[trip-17]` or `[book-6]`.
- **[sock-27] `tracking:ended`** (server→client, room) `{trip_id, reason: "completed"}` → stop sending locations, close the map screen.

### Presence, enforcement, misc
- **[sock-28] `presence:heartbeat`** (client→server) `{}` → ack `{status: "online"}`. Keep-alive refreshing the Redis presence TTL.
- **[sock-29] `presence:status`** (server→client) `{user_id, status ("online"|"offline"), last_seen, timestamp}` — on join and transitions.
- **[sock-30] `enforcement:ack`** (client→server) `()` — acknowledge revocation before disconnect. No other payload.
- **[sock-31] `enforcement:revoke`** (server→client) `{action ("suspend"|"ban"), reason, duration|null, effective_at}` → then sockets are force-closed. Treat as terminal: log out, don't auto-reconnect.
- **[sock-32] `force_disconnect`** (server→client) `{reason: "SESSION_TERMINATED"}` → log out immediately.
- **[sock-33] `home:invalidate`** (server→client) `{trip_id}` → refetch `[driver-16]` / `[profile-4]` after booking and ride-request changes.
- **[sock-34] `admin:ticket_assign`** (client→server, admin/support/moderator) `{support_ticket_id*, agent_id*}` → ack. Agent takes a ticket and auto-joins its room.
- **[sock-35] `admin:ticket_resolve`** (client→server, admin/support/moderator) `{support_ticket_id*, solution?}` → resolves + notifies owner.
- **[sock-36] `admin:driver_online`** (server→client, admin feed) `{driver_id, lat: null, lng: null, timestamp}`.

---

## Flows

Notation: `[key]` = do this endpoint/event. `⏳` = wait for someone/something else. `◇` = branch. End state is stated so you know when the flow is done.

### F1 — Passenger signup flow
`[auth-1]` (phone + role=passenger) → `[auth-2]` (OTP) → `[auth-3]` (password, header = registration token) → `[auth-18]` (profile, one shot) → done (logged in, tokens stored, open `[auth-5]` refresh interceptor + socket connect).

### F2 — Driver signup & approval flow
`[auth-1]` (role=driver) → `[auth-2]` → `[auth-3]` → `[auth-19]` (upload each ID/license/vehicle image, keep ids) → `[auth-13]` (identity profile) → `[auth-15]` (vehicle) → check `[auth-17]` (flags) → ⏳ **wait for admin approval** (`[aver-2]` + `[aver-4]`; rejections arrive with `fields_to_fix` → fix via `[verif-3]`) → ⏳ **subscribe** (F3 — publishing is gated on an active plan/balance) → done (`fullyVerified: true`, can publish via F4).
While waiting, poll `[auth-17]`; a rejection reasons via `[verif-1]`.

### F3 — Driver subscription flow
`[plan-1]` (pick plan) → `[pay-1]` (pick payment method) → `[auth-19]` (payment screenshot → id) → `[sub-1]` (submit; `resubmit: true` to replace a pending one) → ⏳ **wait for admin** (`[asub-9]` queue → `[asub-10]` approve / `[asub-11]` reject+reason) → verify `[sub-3]` (`is_in_debt: false`) → done ( publishing/trip-start gates pass).

### F4 — Create-trip flow (driver)
(optional) `[maps-1]` live while building (preview polyline/duration/arrival) → `[trip-1]` (publish; route auto-computes, `route_status` may be `failed` — still published, `[sock-26]`/retry recovers) → fix route via `[trip-15]` (replace stops) → review `[trip-17]` (pickups in order + `[navigation_url]`) → `[trip-8]` (start, ≤1h before departure, needs plan/balance) → F6 live trip → `[trip-9]` (complete; commission deducted, bookings completed) → `[rate-1]` rate passengers → done.
Cancel paths: `[trip-11]` (with penalty record) or `[trip-12]` (legacy) — only before start. After start, trips end via `[trip-9]` only.

### F5 — Search & book flow (passenger)
`[trip-3]` (search; optionally save via `[fav-5]`) → `[trip-5]` (options: seats + pickup/drop-off points) → `[trip-6]` (seat map) → `[seat-1]` (hold seats, 5-min TTL) → `[trip-16]` (pickup preview: accepted? detour?) → `[book-2]` (create, `agreed_fare` must equal current fare) → done (booking `confirmed`, driver notified). On lock expiry: redo `[seat-1]`.
Manage afterwards: `[book-7]` (edit pickup before cutoff), `[book-5]` (cancel; <1h → `409`), `[book-8]`/`[book-9]` (delays), `[book-3]` (detail), `[book-6]` (map).

### F6 — Live tracking flow (trip `in_progress` only)
Driver: `[sock-18]` join → `[sock-19]` start → loop `[sock-20]` (≤1/2s; batch `points[]` after offline gaps) → follow `[sock-23]` next-pickup guidance → mark each pickup `[trip-19]` → `[sock-21]` at the end (or just `[trip-9]`, which emits `[sock-27]`).
Passenger: `[sock-18]` join → listen `[sock-22]` (use the **personal** copy for the ETA banner) → `[sock-24]` near → be ready → `[sock-24]` arrived → `[sock-25]` picked_up → done for this passenger.
Everyone: `[sock-26]` → refetch `[trip-17]`/`[book-6]`; `[sock-27]` → close map, stop sending. Join refused for strangers, cancelled bookings, finished trips (`[sock-18]` error).
SOS mid-trip: `[sock-13]` → `[sock-14]` + admin `[sock-15]` → admin `[sos-2]`/`[sos-3]` → `[sock-17]`.

### F7 — Ride-request board flow (demand-driven)
Passenger: `[ride-1]` (post need) → (optionally `[ride-4]` published-trip alternatives) → compare `[ride-7]` offers → `[offer-1]` accept → `[offer-2]` final fare → ⏳ driver attaches via `[trip-20]` → done (normal `confirmed` booking, continues in F5/F6).
Driver: browse `[ride-2]` → `[ride-6]` bid (one pending per driver/request) → ⏳ passenger decision → if accepted, `[trip-20]` → done.
Direct path: driver browses `[ride-2]` → `[ride-8]` accept (no offer needed) → booking lands on an existing matching trip or a newly created one → done.
Withdraw anytime via `[ride-5]` (cancel declines sent offers).

### F8 — Chat flow (booking + support)
Open `[chat-1]`/`[chat-2]` history → `[sock-1]` join room → `[sock-3]` send (ack = persisted) → receive `[sock-6]` (dedupe by `id`) → `[sock-5]` mark read → `[sock-7]` receipts → `[sock-2]` leave on screen close. Typing: `[sock-4]` ↔ `[sock-8]`. Limits: chat 10 msgs/10s, location 1/2s, SOS 5/min. After >2-min disconnect: REST-refetch history, then sockets again.

### F9 — SOS flow
Passenger/driver on a live trip: `[sock-13]` (lat/lng + trip) → `[sock-14]` "received" (reused if one is already active) → admins get `[sock-15]`/`[sock-16]` (with last driver position) every 60s + job escalation after 5 min → admin `[sos-1]` monitor → `[sos-2]` claim → `[sos-3]` close → `[sock-17]` to reporter + admins → done. REST mirrors exist (`[sos-1..3]`) for non-socket admin clients.

### F10 — Rating flow
After completion: passenger and driver each call `[rate-1]` once per booking (stars + punctuality + tags) → feeds `[driver-4]` summary, `[admin-11]` evaluations, punctuality badges → done. Repeats return `already_rated: true` with the existing row (immutable).

### F11 — Complaint → penalty → enforcement flow
Reporter: `[complain-1]` (accused ≠ self; same open triple returns `already_filed`) → admin triages `[mod-1]` → `[mod-2]` (reviewing → resolved/dismissed) → `[mod-6]` penalty (warning/suspension/ban; suspensions/bans trigger `[sock-31]` → `[sock-32]`, client must log out, never auto-reconnect) → driver sees it in `[driver-5]`/`[driver-13]` → done. Direct shortcuts: `[mod-4]` (user status), `[admin-15]`/`[admin-16]` (dossier actions), `[mod-5]` (trip unpublish/block/restore).

### F12 — Support ticket flow
Anyone: `[support-1]` (file, optional booking/trip link) → `[support-2]` list → `[support-3]` thread + `[chat-2]` history → reply `[support-6]` or live `[sock-3]` after `[sock-1]` join → staff: `[support-4]` triage/assign (`[sock-34]`) → `[support-5]` status → done (`[sock-35]` notifies owner on resolve; closed can't reopen).

### F13 — Notifications & settings flow
Client: connect socket → `[sock-12]` badge count → `[notif-1]` inbox → `[notif-2]` / `[notif-3]` / `[sock-9]` / `[sock-10]` mark read → `[sock-12]` refreshes. Bulk clear via `[notif-4]`. Live pushes arrive as `[sock-11]`. Preferences: `[notifset-1]` → `[notifset-2]` (drivers: `[notifset-3]` → `[notifset-4]`, master switch overwrites all). Server sends pickup/proximity/route/booking/trip events as `pickup_added|pickup_changed|pickup_cancelled|route_updated|driver_nearby|driver_arrived|pickup_missed` (toggleable) — never block mutations on delivery.

### F14 — Driver verification & admin approval flow
Driver: `[auth-13]` → `[auth-15]` (or fix via `[verif-3]`, state in `[verif-1]`/`[auth-17]`). Admin: `[aver-1]` queue → inspect docs → `[aver-2]`/`[aver-3]` identity (+`fields_to_fix`) → `[aver-4]`/`[aver-5]` vehicle → fully verified → driver can publish (F4). All decisions audited + driver notified.

### F15 — Admin daily flow
`[admin-1]` overview → `[admin-4]` approvals → `[admin-5]` complaints → `[admin-6]` drivers table → `[admin-8]`…`[admin-14]` dossier tabs → actions `[admin-15]`/`[admin-16]`/`[admin-17]`/`[admin-18]`/`[mod-2]`/`[mod-4]`/`[mod-5]`/`[mod-6]` → `[admin-19]` reservations audit → done. Live safety: `[sos-1]` + `[sock-15]` → `[sos-2]` → `[sos-3]`. Trips: `[atrip-1]` planned, `[atrip-2]` recorded (completed only) — both audited.

### F16 — Account lifecycle flow (driver)
`[driver-13]` standing → `[driver-11]`/`[driver-12]` edit data (locked fields → `403`; identity edits reset to pending → back to F14) → `[driver-14]` request deletion (confirmation=true, ~5 business days) → undo via `[driver-15]` → done. Banned/suspended: `[sock-31]` → `[sock-32]`, `can_delete` false while banned/pending.

### F17 — Passenger home & discovery flow
Launch: `[auth-7]` (who am I) → `[profile-4]` (next booking + recents) → `[sock-33]` → refetch on change. Search: `[trip-3]` (+ `[fav-4]` shortcuts, save via `[fav-5]`) → F5. Drivers: `[fav-1]` → `[fav-2]`/`[fav-3]` hearts. Profile: `[profile-1]` → `[profile-2]`; health: `[profile-3]`; account: `[driver-13]`-equivalent? No — passengers use `[profile-3]` + `[auth-8]` + logout `[auth-6]`.

### F18 — Earnings & reputation flow (driver)
`[driver-8]` stat cards + `[driver-7]` charts (period buckets) → `[driver-4]` reviews → `[driver-5]` penalties → `[driver-6]` complaints → done. Underlying: `[rate-1]` writes, nightly stats job materializes, `[admin-11]` mirrors for staff.

### F19 — Trip exception flow (no-show, expiry, delays)
Running late: `[book-8]` → counterparty notified → history `[book-9]`. Never-operated past departure: expiry job flips trip cancelled + bookings `NO_SHOW` (reads self-heal via `[book-1]` sweep). Driver marks passenger absent: `[trip-19]` `missed` (booking stays `confirmed`; driver no-show rate untouched). Passenger cancels: `[book-5]` → seats freed, route recomputed, driver notified (`pickup_cancelled`).

### F20 — Auth session flow (all apps)
`[auth-4]` login → store pair → attach `Authorization: Bearer` everywhere → on 401, `[auth-5]` rotate once → retry → else force `[auth-6]` + login screen. Password change `[auth-8]` and reset `[auth-11]` revoke all sessions. Socket Token expired → reconnect with a fresh token; `[sock-31]`/`[sock-32]` → logout, no retry.

---

## Key index

REST: `auth-1..21` (§1) · `trip-1..20`, `seat-1..2`, `maps-1..2`, `vehicle-1..2`, `verif-1..3`, `plan-1`, `dash-1` (§2) · `book-1..9`, `ride-1..7`, `offer-1..2`, `fav-1..6`, `profile-1..4`, `rate-1` (§3) · `driver-1..17`, `sub-1..3`, `pay-1..5` (§4) · `admin-1..19`, `mod-1..6`, `asub-1..11`, `aver-1..5`, `atrip-1..2`, `sos-1..3`, `support-1..6`, `complain-1` (§5) · `chat-1..2`, `notif-1..2`, `notifset-1..4` (§6).
Sockets: `sock-1..8` chat · `sock-9..12` notifications · `sock-13..17` SOS · `sock-18..27` tracking · `sock-28..36` presence/enforcement/misc (§7).
Flows F1–F20 above. Total: 167 REST + 36 socket events.
