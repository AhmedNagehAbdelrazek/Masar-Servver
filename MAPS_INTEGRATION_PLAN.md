# Maps, Tracking & Journey — Backend Integration Plan

> Source: `013-maps-tracking-journey.md` (Spec 013, v1 business + backend breakdown).
> Companion to `SINGLE_SOURCE_OF_TRUTH.md`. When approved, merge decisions into SSOT.
> Scope: `Main Server/` only (Express 5 + Sequelize 6 + Socket.IO 4). Flutter client work is tracked as dependency only.
> Status: Draft for build. Billing is **not** enabled yet, so Phase 0 runs in `MAPS_MOCK=true` mode.
> Decided: tracking-eligible status = `in_progress` (O6 resolved as `in_progress`, see §1).

---

## 1. Locked decisions for this build

| ID | Decision (from Spec 013 §5.1, locked for build) |
|---|---|
| O1 | Passenger custom pickup is **auto-accepted** within limits; driver is notified. No driver-approval flow. |
| O2 | **No new bookings after trip starts** (`in_progress`). Only cancellations change route after departure; cancelled pickup is skipped without re-routing. |
| O3 | v1 navigation = **Google Maps deep link** (`Maps URLs`). No in-app navigation SDK. |
| O4 | Detour/distance limits are **platform defaults** from env config, not per-driver settings. |
| O5 | Autocomplete is **client-direct** with restricted key + session token. Server does Routes/Geocoding validation only. No full proxy. |
| O6 | **Tracking-eligible = `in_progress` only.** Codebase today has both `in_progress` and `ongoing` in `TRIP_STATUS` (`config/constants.ts:33`) and `Services/trackingService.ts:8` accepts both. This plan narrows tracking joins + location ingest to `in_progress`. `ongoing` remains a valid status but does not open tracking rooms. Revisit only via SSOT change. |
| O7 | Passenger sees driver position + route to **own pickup + ETA only**, not other passengers' pickups. |
| O8 | Route compute failure **does not block** publish or booking. Sets `route_status=failed/pending`, retry job handles it. |
| O9 | Live ETA = straight-line + recent speed between Routes calls. Routes API is called only on pickup transitions / large deviation, never per location update. |
| G4 | Drop-offs stay `TripStop`-only. Pickups may be `stop\|custom`. Intentional. |
| G5 | Recurring trips are one row + dynamic expansion. To avoid overwriting paths, `TripLocation.occurrence_date` + per-occurrence actual-path handling is added (DB4 below). |

Out of scope v1 (Spec 013): admin live tracking, in-app turn-by-turn, live re-routing after start, waypoint reordering optimization, free-form drop-offs.

---

## 2. Credentials needed

Google Maps Platform uses **API keys only** — there is no key/secret pair. Security comes from per-key restrictions. `URL signing secret` is only for Static Maps / Street View and is **not needed** for v1.

### 2.1 The 4 keys

| Key | Env / where it lives | Application restriction | API restriction |
|---|---|---|---|
| Server (backend only) | `GOOGLE_MAPS_SERVER_API_KEY` in `Main Server/.env` + secrets store / CI secrets. **Never commit, never ship to client.** | IP address of backend egress IPs | Routes API, Geocoding API only |
| Android | Flutter `AndroidManifest` / build config. **Not** in backend `.env`. | Android apps: package name + SHA-1 for debug, release, **and Play App Signing** | Maps SDK for Android, Places API (New) |
| iOS | Flutter iOS config. **Not** in backend `.env`. | iOS apps: bundle ID | Maps SDK for iOS, Places API (New) |
| Web | Flutter web + admin dashboard config. **Not** in backend `.env`. | HTTP referrers (Flutter web + admin domains) | Maps JavaScript API, Places API (New) |
| Optional | `GOOGLE_MAPS_MAP_ID` | none | Cloud-based styling / advanced markers |

Current state: `Main Server/.env.example` has no Maps vars and `config/constants.ts` has no `MAPS`/`TRACKING` block. That is added in §4.

### 2.2 GCP setup (INF1-INF4)

1. Create 2 Google Cloud projects: `masar-prod`, `masar-staging` (separate quotas/keys). Owner = company account, not personal.
2. Attach a **billing account**. Maps Platform returns `REQUEST_DENIED` without billing. Until billing is on, keep `MAPS_MOCK=true` (§3.3).
3. `APIs & Services > Library`, enable per project:
   - Maps SDK for Android, Maps SDK for iOS, Maps JavaScript API
   - Places API (New) — prefer New over legacy
   - Geocoding API
   - Routes API (Compute Routes) — prefer over legacy Directions API
   - Not needed v1: Roads, Distance Matrix, Static Maps, Street View.
4. `APIs & Services > Credentials > Create Credentials > API key` × 4, apply the restrictions in §2.1.
5. Optional: `Maps Management > Create Map ID` for `GOOGLE_MAPS_MAP_ID`.
6. `Billing > Budgets`: monthly budget + alerts at 50/80/100% + per-API quota caps (INF7).

Early decision: if the host has no fixed outbound IP (local dev, Railway/Render), IP restriction cannot be enforced. Use a static egress IP (NAT/elastic IP) before prod, or accept weaker API-only restriction in dev.

### 2.3 Verify the server key (no code needed)

```powershell
$key="YOUR_GOOGLE_MAPS_SERVER_API_KEY"
# Geocoding — expect Amman
Invoke-RestMethod "https://maps.googleapis.com/maps/api/geocode/json?latlng=31.9539,35.9106&languageCode=ar&regionCode=jo&key=$key" | ConvertTo-Json -Depth 5

# Routes — Amman -> Irbid
$body = @{
  origin = @{ location = @{ latLng = @{ latitude=31.9539; longitude=35.9106 } } }
  destination = @{ location = @{ latLng = @{ latitude=32.5568; longitude=35.8469 } } }
  travelMode = "DRIVE"
  languageCode = "ar"
  regionCode = "jo"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri "https://routes.googleapis.com/directions/v2:computeRoutes" `
  -Headers @{ "X-Goog-Api-Key"=$key; "X-Goog-FieldMask"="routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline" } `
  -ContentType "application/json" -Body $body
```

`API_KEY_INVALID` / `REQUEST_DENIED` = API not enabled, billing off, or restriction mismatch — fix in console, not code.

---

## 3. Backend env + config

### 3.1 Env vars to add (INF5)

Add to `Main Server/.env.example`, `docker-compose.yml` (`main-server` environment docs), and secrets store:

```env
# Google Maps
GOOGLE_MAPS_SERVER_API_KEY=
GOOGLE_MAPS_REGION_CODE=jo
GOOGLE_MAPS_COUNTRY_BIAS=jo
GOOGLE_MAPS_TIMEOUT_MS=5000
GOOGLE_MAPS_MAX_RETRIES=2
MAPS_MOCK=true

# Route and pickup rules
ROUTE_CACHE_TTL_SECONDS=86400
PICKUP_MAX_DISTANCE_FROM_ROUTE_M=1500
DETOUR_MAX_SECONDS=600
PICKUP_EDIT_CUTOFF_MINUTES=60
MAX_TRIP_STOPS=8

# Tracking
TRACKING_INTERVAL_SECONDS=5
TRACKING_BATCH_MAX_POINTS=60
TRACKING_MAX_POINT_AGE_SECONDS=300
PROXIMITY_NEAR_METERS=1000
PROXIMITY_ARRIVED_METERS=150
ACTUAL_PATH_SIMPLIFY_TOLERANCE_M=10

# Jobs
JOB_ROUTE_RETRY_CRON=*/2 * * * *
JOB_PATH_COMPACT_CRON=*/10 * * * *
```

Values are starting points to tune, not business rules. Client keys stay in Flutter build config, never in backend `.env`. Real server key goes only in `Main Server/.env` locally + secret manager + CI secrets.

### 3.2 Config files (INF6)

- `config/constants.ts`: add `MAPS` and `TRACKING` blocks + `ROUTE_STATUS pending|ready|failed`, `PICKUP_TYPE stop|custom`, `PICKUP_STATUS pending|arrived|picked_up|missed`. Do not hardcode these strings elsewhere (SSOT options registry rule).
- New `config/maps.ts`: typed loader reading §3.1 with defaults, same pattern as `config/cloudinary.ts` / `config/redis.ts`. Fail-soft when key is missing and `MAPS_MOCK=true`; throw startup error only when `MAPS_MOCK=false` and key is missing.
- `utils/redisKeys.ts`: add `route:{hash}`, `ratelimit:maps:*`, `proximity:{booking}:near|arrived`, `jobs:lastrun:route_retry`, `jobs:lastrun:path_compact` following existing `seat_lock:{trip}:{seat}`, `driver_home:{id}` patterns.

### 3.3 Mock mode (billing off)

`MAPS_MOCK=true` (default until billing is attached):

- `mapsClient` returns deterministic fixtures (e.g. Amman→Irbid polyline, distance/duration) and logs `maps.mock=true`.
- No outbound Google calls, no cost, all route/pickup flows testable end-to-end.
- Flip to `false` only after §2.3 passes with billing on.

---

## 4. Data model — migrations 028 onward

Conventions: Sequelize 6, `underscored:true`, UUID PKs, literal `createdat/updatedat`, versioned files in `migrations/versions/NNN-slug.js`, preview with `db:migrate:preview`, reversible. Highest today is `027-trip-profit-seat-history.js`.

Existing fields discovered (reconcile, do not duplicate):

- `Models/Trip.ts`: `originCity/Area/Address/Lat/Lng`, `destination*`, `departureTime/arrivalTime`, `status`. No route columns yet.
- `Models/TripStop.ts`: `tripId, stopOrder UNIQUE(trip,order), stopName, city, address, lat/lng + stopLat/stopLng dual aliases, stopType pickup|dropoff|both, estimatedArrival`.
- `Models/TripLocation.ts`: `tripId, driverId, lat, lng, speed, heading`, index `(trip_id,createdat)`. No `occurrence_date`.
- `Models/Booking.ts`: already has `pickupPlace/Lat/Lng/Order, dropoffPlace/Lat/Lng/Order/Deadline`. Missing pickup type/FK/detour/status timestamps.

| ID | Migration | Changes |
|---|---|---|
| DB1 | `028_trip_route` | `trips`: `route_polyline TEXT`, `route_distance_m INT`, `route_duration_s INT`, `route_status ENUM pending\|ready\|failed`, `route_computed_at TIMESTAMPTZ`, `route_version INT DEFAULT 0` |
| DB2 | `029_booking_pickup` | `bookings`: `pickup_type ENUM stop\|custom`, `pickup_stop_id UUID FK trip_stops nullable`, `pickup_label TEXT`, `pickup_city`, `pickup_area`, `detour_seconds INT`, `pickup_status ENUM pending\|arrived\|picked_up\|missed DEFAULT pending`, `arrived_at`, `picked_up_at`. Keep existing `pickupLat/Lng/Place/Order`. Check: `stop` requires `pickup_stop_id`; `custom` requires lat/lng. |
| DB3 | `030_trip_actual_path` | `trips`: `actual_path_polyline TEXT`, `actual_distance_m INT`, `actual_duration_s INT`, `started_at`, `completed_at` (only if missing) |
| DB4 | `031_trip_location_occurrence` | `trip_locations`: `occurrence_date DATE nullable` + index `(trip_id, recorded_at)`; same occurrence handling for actual-path fields if per-occurrence. Needed because recurrence is one row + dynamic expansion. |
| DB5 | `032_notification_types` | Seed new types from §8 + backfill default `NotificationSetting` rows (all-on) for existing users. |

Also update `Models/*.ts`, `SINGLE_SOURCE_OF_TRUTH.md §6/§7/§18`, and Postman (SSOT decisions 13 + 16: no new tables without migration + spec + Postman).

---

## 5. Services

### SVC1 `mapsClient` (new `Services/mapsClient.ts`)

Thin wrapper for Routes `computeRoutes` + Geocoding `geocode/reverseGeocode`. Native `fetch`, no new dep except optional `polyline` lib in SVC6.

- Timeout `GOOGLE_MAPS_TIMEOUT_MS`, `GOOGLE_MAPS_MAX_RETRIES` with backoff, simple circuit breaker.
- Every Routes request sets `X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline`, `languageCode` from request locale (`ar` default), `regionCode=jo`.
- Redis usage counters per API (`maps:usage:{api}:{yyyy-mm-dd}`), logged for INF7 dashboard.
- Errors mapped to `ApiError` with localized `config/messages/app.ts` keys (e.g. `MAPS_UNAVAILABLE`, `MAPS_TIMEOUT`, `MAPS_QUOTA_EXCEEDED`).
- `MAPS_MOCK=true` returns fixtures; `false` requires key.
- Google call is always **outside** DB transactions (see SVC2).

### SVC6 `geo` utils (new `Services/geo.ts`)

- Reuse `haversineKm` from `Services/trackingService.ts` (move or import, do not duplicate).
- Add: polyline encode/decode, point-to-polyline distance, projection along polyline (for pickup ordering), Douglas-Peucker simplify with `ACTUAL_PATH_SIMPLIFY_TOLERANCE_M`.
- Prefer the well-known `polyline` npm package over hand-rolled codec.

### SVC2 `routeService` (new `Services/routeService.ts`)

`computeTripRoute(tripId)`:

1. Load trip + ordered `TripStop` (`UNIQUE(trip,order)`, handle `lat/stopLat` dual aliases via existing `serializeRoutePoints/getMeetingPoint` helpers in `bookingService.ts`) + confirmed bookings' pickups sorted by projection along base route.
2. Enforce `MAX_TRIP_STOPS` + Routes waypoint limit (25 at time of writing — verify). If over, split into legs.
3. Cache: Redis `route:{hash(ordered waypoints)}` TTL `ROUTE_CACHE_TTL_SECONDS`. Identical waypoints = cache hit, zero Google calls.
4. Call `mapsClient.computeRoutes` outside any DB transaction, persist `route_polyline/distance/duration/status=ready/computed_at`, bump `route_version`.
5. On failure: set `route_status=failed`, keep booking/publish succeeding (O8), enqueue `routeRetryJob`. Booking creation and recompute are consistent via this flag + retry, per SSOT decision 7 pattern.

Runs inside booking/stop mutation boundary logically, but the HTTP call itself is outside the Sequelize transaction.

### SVC3 `pickupService` (new `Services/pickupService.ts`)

`validatePickup(trip, point)`:

- Point-to-polyline distance <= `PICKUP_MAX_DISTANCE_FROM_ROUTE_M`, else reject with localized message.
- Detour = route duration with pickup minus base duration <= `DETOUR_MAX_SECONDS`, return `{accepted, distance_m, detour_seconds, reason}`.
- Used by pickup-preview, booking create, and pickup edit. Same validation everywhere.

### SVC4 `trackingService` extension (existing `Services/trackingService.ts`)

- Narrow `ACTIVE_TRIP_STATUSES` to `[in_progress]` for join + ingest (O6). `ongoing` no longer opens `trip:<id>` rooms.
- Ingest: validate trip, driver ownership (`assertDriverOfActiveTrip`), point age within `TRACKING_MAX_POINT_AGE_SECONDS`, batch cap `TRACKING_BATCH_MAX_POINTS`, accept out-of-order inside window, discard older, drop non-drivers. Persist-before-broadcast (SSOT 8).
- Compute next pickup, ETA via straight-line + recent speed (O9, no Routes per update), fire proximity events once per booking via Redis flags (`PROXIMITY_NEAR_METERS` default 1000, `PROXIMITY_ARRIVED_METERS` default 150).
- Sanitize all inbound points, per-socket rate limit retained.

### SVC5 `actualPathService` (new or inside `routeService.ts`)

On trip completion: load `TripLocation` (+ `occurrence_date`), drop outliers by accuracy/speed, simplify, encode, store DB3 fields. Idempotent so `actualPathJob` can retry.

---

## 6. REST endpoints

Chain for all: `protect → roleGuard → validator → validate → controller (catchAsync thin) → service → auditService.track`. Lists use `{data, pagination}` envelope. Validators in `utils/validators/mapsValidator.ts` + `tripValidator.ts` / `bookingValidator.ts` extensions, messages ar/en.

New router `Routes/mapsRoutes.ts`, mount in `Routes/index.ts`:

```ts
import mapsRoutes from './mapsRoutes';
router.use('/maps', mapsRoutes);
```

| ID | Method + path | Role | Purpose |
|---|---|---|---|
| API1 | `POST /api/maps/route-preview` | driver | Body origin/destination/stops. Returns polyline, distance, duration, suggested arrival. Rate-limited (reuse `ratelimit:*`), cached, not persisted. |
| API2 | `POST /api/maps/reverse-geocode` | driver, passenger | lat/lng → city/area/label in request locale. Server validation path; client may also do it. |
| API3 | `POST /api/trips` (extend `Routes/tripRoutes.ts`) | driver | Accept lat/lng for origin/destination/stops; compute + persist route (DB1). Failure still publishes with `route_status=failed`. |
| API4 | `PATCH /api/trips/:id/stops` (extend or add) | driver | Add/remove/reorder stops, recompute, notify booked passengers if relevant. |
| API5 | `GET /api/trips/:id/route` | driver (owner), admin | Polyline, stops, ordered pickups (first name + seats only, phone masked via `utils/masking.ts`), `navigation_url`/legs (Maps URLs deep link, split >~9 waypoints), `route_version`. |
| API6 | `POST /api/trips/:id/pickup-preview` | passenger | Body lat/lng or stop id. Returns `accepted, distance_from_route_m, detour_seconds, reason`. |
| API7 | `POST /api/bookings` (extend `Routes/bookingRoutes.ts`) — note: actual path is `/api/bookings`, not `/api/trips/:id/bookings` | passenger | Accept pickup payload (`pickup_type/stop_id/lat/lng`), validate SVC3, persist DB2, recompute route, notify driver. Follows `bookingService.ts` transactional pattern (`Trip FOR UPDATE`, decrement `availableSeats`, `MSR-` ref, post-commit `Promise.allSettled` notify + `auditService.track`). |
| API8 | `PATCH /api/trips/:id/pickups/:bookingId` | driver | Set `pickup_status arrived\|picked_up\|missed`; emits socket event; interacts with no-show logic. |
| API9 | `GET /api/bookings/:id/route` + `GET /api/trips/:id/route/actual` | passenger (own), driver (own) | Planned route + own pickup; actual path after completion (DB3). |
| API10 | `PATCH /api/bookings/:id/pickup` | passenger | Change pickup before `PICKUP_EDIT_CUTOFF_MINUTES` and while `published`. Same SVC3 validation; recompute + notify. |
| API11 | `GET /api/admin/trips/:id/route` + `/route/actual` | admin, support, moderator | Read-only planned + recorded route. Every view audited. |

---

## 7. Realtime (Socket.IO)

Extend `sockets/trackingSocket.ts`. Rooms stay `trip:<id>` (existing `user:<id>` + `role:<role>` rooms retained). Handshake via `middlewares/socketAuth.ts` (JWT + status gate; banned/suspended rejected).

| ID | Event | Direction | Rule |
|---|---|---|---|
| SOC1 | `tracking:join {trip_id}` | client → server | Authorize: driver of trip in `in_progress`, or passenger with `confirmed` booking on `in_progress` trip. Join `trip:<id>`. Uses `realtimeService.isTripMember`. |
| SOC2 | `tracking:location {lat,lng,speed,heading,accuracy,recorded_at}` or batch | driver → server | Ack `{status:'ok'}` / `{status:'error', code, message}` via `ok()/errorFromApiError()`. Existing `1 loc/2s` rate limit + `realtimeMetrics` retained. |
| SOC3 | `tracking:next_pickup` | server → driver | Next pickup + distance + ETA + remaining count. |
| SOC4 | `tracking:route_updated {route_version}` | server → room | Clients refetch API5/API9. |
| SOC5 | `tracking:update` | server → room (passenger-filtered) | Driver position + ETA to **that passenger's** pickup only (O7). |
| SOC6 | `sos:create` (extend `sockets/sosSocket.ts`) | passenger → server | Include passenger lat/lng + last driver position. Reuses `SosEvent`. |
| SOC7 | `tracking:proximity` / `tracking:pickup_status` | server → passenger | `near / arrived / picked_up / missed`, each once per booking. |
| SOC8 | `tracking:ended` | server → room | Completion or cancellation; clients stop sending. |

Rules: persist-before-broadcast, rate-limit inbound, sanitize everything, never expose other passengers' pickups.

---

## 8. Background jobs

Register in `jobs/index.ts` registry (`{schedule: process.env.X || default, task}` → `node-cron`, `JOB_TIMEZONE`, no-overlap, missed-run catch-up via Redis `jobs:lastrun:*`). Skipped when `NODE_ENV=test`; `JOBS_INLINE=1` runs in-process. Existing crons: `JOB_EXPIRY_SWEEP_CRON`, `JOB_REMINDER_CRON`, `JOB_LOW_BALANCE_WARNING_CRON`, `JOB_SOS_ESCALATION_CRON`, `JOB_DATA_RETENTION_CRON`, `JOB_DRIVER_STATS_CRON`, `JOB_TRIP_LIFECYCLE_CRON`.

| Job | Detail |
|---|---|
| JOB1 `routeRetryJob` (`JOB_ROUTE_RETRY_CRON=*/2 * * * *`) | Retry `trips WHERE route_status IN (pending,failed)`, capped attempts, alert on repeated failure. |
| JOB2 `actualPathJob` (`JOB_PATH_COMPACT_CRON=*/10 * * * *`) | Compact completed `in_progress`→`completed` trips into DB3 if not done inline. Idempotent. |
| JOB3 extend `dataRetentionJob` (`JOB_DATA_RETENTION_CRON=0 3 * * *`) | Keep raw `TripLocation` 30d (`createdat < now-30d`), actual path lives on trip permanently, confirm legal retention for SOS-linked trips (keep longer). Existing: chat 1yr. |

---

## 9. Notifications (NTF1)

`Services/notificationService/` pattern: `TEMPLATES` dict (`TYPE -> {ar:{title,body}, en:{title,body}}` with `{var}` interpolation) + `sendToUser / notifyBookedPassengers / notifyConfirmedPassengers (CONFIRMED-only)`. Delivery is async and never blocks mutation: `Promise.allSettled([...])`, `.catch(warn)`, or `setImmediate` (see `bookingService.ts:504`, `tripService.ts:1118`).

New types (add to `NOTIFICATION_TYPE` in `config/constants.ts` + `TEMPLATES` in `notificationService/index.ts` + ar/en templates + `NOTIFICATION_CATEGORIES`/`GROUP_LABELS`/`TYPE_LABELS` if user-toggleable + DB5 backfill):

`pickup_added, pickup_changed, pickup_cancelled` (to driver), `route_updated`, `driver_nearby, driver_arrived, pickup_missed`, `next_pickup` (optional).

Note existing mismatch: `TEMPLATES` keys (`TRIP_STARTED`, `BOOKING_CONFIRMED_DRIVER`) differ from settings taxonomy (`booking_confirmed`, …). Add operational types in `TEMPLATES`; add settings-toggleable types in `constants.ts` + labels.

---

## 10. Security, privacy, audit

| ID | Task |
|---|---|
| SEC1 | Auth tests for every §6 route + SOC1 join: non-participants, cancelled bookings, completed trips, suspended (read-only) / banned (blocked) users. |
| SEC2 | Logs never contain keys or full coordinate histories. Redact `GOOGLE_MAPS_SERVER_API_KEY`, lat/lng arrays. |
| SEC3 | Admin actual-path access limited to completed trips; existing PII masking (`utils/masking.ts`: `+962 79 *** 0000`) unchanged; full names/phones follow support-role reveal rules. |
| AUD1 | `auditService.track` + `createAuditMiddleware`: pickup set/changed, route recompute incl. failures, admin route views, tracking start/stop. |
| X2 privacy | Location visible only to participants of an `in_progress` trip. Raw points expire per §8; actual path on trip. Admin sees completed only (no live). |

---

## 11. Testing

- `tests/setup/setup.js`: mock Google fixtures (Routes + Geocoding success / failure / timeout). Respect existing `jest.mock('../../config/redis')` in-memory Map + `sequelize.sync({force:true})` + fixed UUIDs.
- Unit (`tests/unit`): geo utils, detour/distance rules, pickup ordering by projection, Douglas-Peucker simplify.
- Integration (`tests/integration`): booking with pickup + recompute + notify + cancellation; stop add/remove/reorder; pickup-status transitions; retry job.
- Contract (`tests/contract/*.contract.test.js`): envelope `{status,message,code}` + pagination shape for every §6 endpoint; socket ack shape.
- Socket: unauthorized join rejected, buffered batch accepted, out-of-order inside window accepted / older discarded, proximity fires once, no Routes call during live updates (assert via mock call count).
- Cost tests: cache hit on identical waypoints (second `route-preview` = zero Google calls).

Commands: `pnpm test`, `test:unit`, `test:integration`, `test:contract`, `typecheck`, `lint`, `db:migrate:preview`.

---

## 12. Docs + Postman (part of done)

- New `Main Server/docs/Maps_Tracking_Guide.md` (Overview → auth → JSON request/response examples, same style as `Trip_Details_Cancellation_Flow_Notification_Settings.md`, `Passenger_Flow.md`).
- Update `docs/Flutter_Socket_IO_Integration_Guide.md` + `Flutter_Socket_Simple_Guide.md` with §7 events.
- Postman `postman/masar_api_collection.json` (`{{base_url}}` = `/api`): new `Maps & Tracking` folder under Driver/Passenger with success + error examples. `PROPOSED` in description = unimplemented (existing convention).
- Sync `SINGLE_SOURCE_OF_TRUTH.md §6/7/11/12/14/17/18/20` in the same PR (SSOT rule).

---

## 13. Google limits to design around

- Routes API intermediate waypoint cap (~25, verify current). `MAX_TRIP_STOPS (8)` + booked pickups must stay under it, else split into legs.
- Maps URLs deep links support ~9 waypoints. D5 navigation must split long routes into legs and tell the driver.
- Autocomplete session tokens must be reused from first keystroke to place selection, else each keystroke is billed. Client: min 3 chars, 300ms debounce (Flutter side).
- ToS: Google results must be shown on a Google map (do not draw Google polylines over another provider). Do not store Google content long-term except place IDs and, with limits, lat/lng. **Storing the encoded route polyline is common but must be re-checked against current Maps Platform terms before launch.** Fallback if disallowed: store only stops/pickups and recompute with cache TTL.

---

## 14. Cost controls (X1)

1. Server-only Routes calls + Redis cache `route:{hash}` TTL `ROUTE_CACHE_TTL_SECONDS`.
2. Field masks on every Routes request.
3. No Routes calls for live ETA (O9).
4. Autocomplete discipline on client (session tokens, min chars, debounce).
5. Rate-limit `route-preview` per user (reuse `ratelimit:*`).
6. Daily usage counters per API, logged + alerted.
7. Budget alerts + quota caps (INF7).

---

## 15. Phasing + build order

| Phase | Scope (Spec 013 §11) | Includes |
|---|---|---|
| **1. Routes and pickups** | GCP setup, keys, preview, trip route, stops, passenger pickup + detour, driver notifications | INF, DB1/DB2, SVC1-3+SVC6, API1-4+6-7, NTF driver, X1/X3 |
| **2. Live trip** | Start, tracking, next pickup, passenger live view, SOS with location, nav deep link | DB4, SVC4, SOC1-8, API5+8, X2 |
| **3. History and admin** | Actual path, past routes, proximity alerts, pickup edit, admin views | DB3/DB5, SVC5, API9-11, JOB1-3, NTF proximity |
| 4. Later (out of spec) | Admin live view, in-app nav, live re-routing, optimization | Not built |

Suggested PR slices: (1) config + `mapsClient` + geo + API1/API2 mocked; (2) DB1/DB2 + `routeService`/`pickupService` + API3/4/6/7; (3) sockets + SVC4 + API5/8 + DB4; (4) DB3/DB5 + jobs + API9-11 + notifications + docs/Postman/SSOT.

X3 i18n: all Google calls pass `languageCode` from request locale (`ar` default, `en` supported). Reverse-geocoded city/area saved in request locale with stable key for matching.

---

## 16. Definition of done (per slice)

- Migration versioned, reversible, previewed (`db:migrate:preview`).
- Validators + localized messages (ar/en) in `config/messages/`.
- `protect → roleGuard` + ownership checks + audit in place.
- Unit + integration + contract tests green with Google mocked; `MAPS_MOCK=true` and `false` (key present) both boot.
- Docs + Postman updated; SSOT synced.
- No keys in repo; `.env.example` updated; `MAPS_MOCK` documented.

---

## 17. Risks

| Risk | Mitigation |
|---|---|
| Billing still off → real Routes untested | `MAPS_MOCK` fixtures + contract tests; §2.3 manual check is the go-live gate. |
| Autocomplete/Routes cost loops | §14 + budgets/quotas before prod. |
| Background location rejected by Play/App Store | Early review prep + justification video (Flutter side). |
| ToS on storing polylines | Verify before launch; fallback in §13. |
| Battery drain | Interval + distance-filter tuning (`TRACKING_INTERVAL_SECONDS`, client filter). |
| Recurring trips overwrite paths | DB4 `occurrence_date`. |
| `in_progress` vs `ongoing` confusion | Locked to `in_progress` in §1; grep `ACTIVE_TRIP_STATUSES` usages when implementing. |
| Custom pickups cause unrealistic routes | Distance + detour caps + driver visibility (O1/O4). |
