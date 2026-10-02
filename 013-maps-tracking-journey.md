# Spec 013: Maps, Tracking & Journey

> Status: Draft for review. Business analysis + backend breakdown.
> Companion to `SINGLE_SOURCE_OF_TRUTH.md`. If this spec is approved, merge decisions into the SSOT.
> Naming follows the SSOT: `booking` (not reservation), Sequelize (not Prisma), migrations continue from `027`.

---

## 1. Purpose and scope

Give drivers, passengers and admins a map-based experience around a trip: choosing locations, seeing the route, choosing pickup points, live tracking, and reviewing past routes.

**In scope (v1)**
- Driver: pick origin/destination, preview route, add stops, see route with pickups, open in Google Maps, live trip with next pickup, review past route.
- Passenger: search trips by place, choose pickup (stop or custom point), see detour impact, live-track the active booking, proximity alerts, route history.
- Admin: read-only planned route and recorded path per trip.
- Google Maps Platform setup, key management, cost controls, privacy.

**Out of scope (v1)**
- Admin live tracking.
- In-app turn-by-turn navigation (deep-link to Google Maps instead).
- Live re-routing after the trip starts.
- Multi-pickup route optimization (waypoint reordering by Google).
- Drop-off as free-form points (drop-offs stay `TripStop`-only, SSOT decision 11).

---

## 2. Business needs

| ID | Business need | Success signal |
|---|---|---|
| BN1 | Reduce friction creating and booking trips (no typed addresses) | Trip creation time down; fewer location errors |
| BN2 | Increase booking conversion with flexible pickup | % bookings with custom pickup; booking rate vs. stop-only |
| BN3 | Reduce no-shows and missed pickups | No-show rate down; fewer "driver couldn't find me" complaints |
| BN4 | Passenger trust through live visibility | Fewer "where is the driver" support tickets |
| BN5 | Safety and dispute evidence | SOS events carry location; admin can review the path of a disputed trip |
| BN6 | Keep Google Maps cost predictable | Monthly spend within budget; cache hit rate |
| BN7 | Privacy compliance | Location visible only to participants during an active trip |

---

## 3. Actors

| Actor | Maps-related capability |
|---|---|
| Driver | Creates routes, sees pickups, shares live location, marks pickups |
| Passenger | Searches, sets pickup, tracks live, sees history |
| Admin / Support / Moderator | Read-only planned and recorded routes |
| System (jobs, sockets) | Route recompute, ETA, proximity, path compaction, retention |

---

## 4. User stories

Format: `ID: As a [role], I want [goal], so that [value].` Priority: **P0** must, **P1** should, **P2** later. Phase refers to section 11. Tasks refer to section 8.

### Epic 1: Driver, trip creation

**D1: Pick start and end on the map** (P0, Phase 1, BN1)
As a driver, I want to search or drop a pin for origin and destination, so that I don't type addresses.
- AC: Autocomplete is biased to the configured country (Jordan now, configurable).
- AC: Pin drop reverse-geocodes to city, area and lat/lng, saved in the existing `origin_*` / `destination_*` fields.
- AC: Both points are required to publish. Origin and destination cannot be identical or closer than a minimum distance.
- Tasks: INF1-INF3, INF6, API1, API2

**D2: Preview the route** (P0, Phase 1, BN1)
As a driver, I want to see the route, distance and duration before publishing, so that I can set a realistic departure, arrival and fare.
- AC: Polyline, distance and duration are shown.
- AC: Arrival time is auto-suggested from duration and editable.
- AC: If Google is unavailable, the driver can still continue (route marked pending) with a clear message.
- Tasks: SVC1, SVC2, API1, API3, DB1

**D3: Add intermediate stops on the map** (P0, Phase 1)
As a driver, I want to add ordered stops (pickup, dropoff or both), so that passengers know where I can stop.
- AC: Each stop maps to a `TripStop` (`UNIQUE(trip, order)`).
- AC: Route is recomputed when stops are added, removed or reordered.
- AC: Max stops is enforced (see section 6.5 for the Google waypoint limit).
- Tasks: SVC2, API3, API4

### Epic 2: Driver, trip details and live trip

**D4: See the full route with pickups** (P0, Phase 1, BN2)
As a driver, I want to open a trip and see the route, my stops and every booked passenger's pickup in order, so that I know my plan.
- AC: Pickups show seat count and the passenger's first name only. Phone stays masked.
- AC: Pickup order follows position along the route.
- Tasks: DB2, SVC2, API5

**D5: Navigate with Google Maps** (P0, Phase 2)
As a driver, I want to open the route in Google Maps with all waypoints, so that I get real turn-by-turn navigation.
- AC: Deep link with waypoints in route order. If waypoints exceed the URL limit, split into legs and tell the driver.
- Tasks: API5 (returns `navigation_url` and legs)

**D6: Start trip and share location** (P0, Phase 2, BN4)
As a driver, I want my location shared automatically once I start, so that passengers can track me.
- AC: Starting requests location permission, including background.
- AC: Points are sent over the tracking socket at a fixed interval, and stop on completion or cancellation.
- AC: Tracking cannot be started on a trip that is not in the tracking-eligible status (see Open Decision O6).
- Tasks: SOC1, SOC2, SVC4, DB4

**D7: Live next-pickup guidance** (P0, Phase 2, BN3)
As a driver, I want to see the next pickup, its distance and ETA, and mark it as picked up, so that I stay on plan.
- AC: After a pickup is marked, the next one becomes current. With none left, the screen shows the route to the destination.
- AC: Driver can mark a pickup `arrived`, `picked_up` or `missed`.
- Tasks: API8, SOC3, SVC4

**D8: Be told when the route changes** (P0, Phase 1, BN2)
As a driver, I want to be notified when a booking is added, changed or cancelled, so that I'm not surprised.
- AC: In-app notification plus route refresh before departure.
- AC: After departure, new bookings are blocked (O2), so only cancellations change the route. A cancelled pickup is skipped without re-routing.
- Tasks: SVC2, NTF1, SOC4

**D9: Tolerate bad connectivity** (P1, Phase 2)
As a driver, I want location points buffered offline and uploaded when I'm back online, so that the recorded route has no gaps.
- AC: Client sends batches with original timestamps. Server accepts out-of-order points inside a window and discards older points.
- Tasks: SOC2, DB4

**D10: Review a past trip's route** (P1, Phase 3)
As a driver, I want to see the planned and actual route of a completed trip, so that I can verify it.
- AC: Planned polyline always available. Actual path available after completion (see gap G3 on retention).
- Tasks: JOB2, API9, DB3

### Epic 3: Passenger, find and book

**P1: Search trips by place** (P0, Phase 1, BN1)
As a passenger, I want to search origin and destination with autocomplete or on the map, so that I find matching trips.
- AC: Searches feed `RecentSearch`. Favorite routes are suggested.
- AC: Matching uses city/area plus proximity (radius configurable), not exact string match.
- Tasks: INF3, API2, API6

**P2: See the trip route and choose my pickup** (P0, Phase 1, BN2)
As a passenger, I want to see the driver's route and set my pickup at an existing stop or at a custom point near the route, so that boarding is convenient.
- AC: Custom point must be within `PICKUP_MAX_DISTANCE_FROM_ROUTE_M` of the route. Outside it, the request is rejected with a localized message.
- AC: Pickup is required to book (default: the origin).
- Tasks: DB2, SVC3, API6, API7

**P3: See detour impact before confirming** (P0, Phase 1, BN2)
As a passenger, I want to see the extra time my pickup adds, so that I choose knowingly.
- AC: Preview returns `detour_seconds` and `accepted: true|false`. Above `DETOUR_MAX_SECONDS` the pickup is rejected.
- Tasks: SVC3, API6

**P4: Pickup updates the driver's route** (P0, Phase 1)
As a passenger, I want my pickup saved on my booking, so that the driver stops there.
- AC: Route is recomputed, `route_version` increments, driver is notified (D8).
- AC: Booking creation and route recompute are consistent: if recompute fails, booking still succeeds and route is flagged for retry (SSOT decision 7).
- Tasks: DB2, SVC2, SVC3, API7, JOB1

**P5: Change my pickup before the cutoff** (P1, Phase 3)
As a passenger, I want to edit my pickup until a cutoff, so that plans can change.
- AC: Allowed until `PICKUP_EDIT_CUTOFF_MINUTES` before departure and while trip is `published`. Same validation as P2/P3.
- Tasks: API10, SVC3

**P6: Directions to my pickup** (P1, Phase 2)
As a passenger, I want directions from my location to the pickup, so that I arrive on time.
- AC: Deep link to Google Maps in walking mode. No server call needed.
- Tasks: API5 (returns pickup coordinates), client only

### Epic 4: Passenger, ongoing and history

**P7: Live-track my booking** (P0, Phase 2, BN4)
As a passenger, I want to see the driver's live position, route and ETA to my pickup, so that I know when to be ready.
- AC: Visible only for my own active booking (`confirmed` and trip tracking-eligible). Ends at completion or cancellation.
- AC: Passenger never receives other passengers' pickup details beyond what the product allows (O7).
- Tasks: SOC1, SOC5, SVC4

**P8: Proximity alerts** (P1, Phase 3, BN3)
As a passenger, I want a notification when the driver is near or has arrived, so that I'm ready.
- AC: Thresholds configurable (default near 1 km, arrived 150 m). Each fires once per booking.
- Tasks: SVC4, NTF1

**P9: Safety on the map** (P0, Phase 2, BN5)
As a passenger, I want SOS on the tracking screen to include my location and the trip, so that help reaches me.
- AC: Reuses `SosEvent`. Includes passenger lat/lng and the driver's last known position.
- Tasks: SOC6

**P10: My past routes** (P1, Phase 3)
As a passenger, I want to see the route of completed bookings, so that I can review them.
- AC: Shows planned route and my pickup. Actual path shown when available.
- Tasks: API9

### Epic 5: Admin

**A1: View any trip's route** (P1, Phase 3)
As an admin, I want to see a trip's planned route, stops and booked pickups, so that I can support and moderate.
- AC: Full names/phones follow existing masking rules for support roles.
- Tasks: API11

**A2: View a completed trip's recorded path** (P1, Phase 3, BN5)
As an admin, I want the actual path of completed trips, so that I can investigate complaints and SOS events.
- AC: Read-only. Every view is audited. Live tracking is out of scope.
- Tasks: API11, AUD1

### Epic 6: Cross-cutting

**X1: Cost and key safety** (P0, Phase 1, BN6)
As the business, I want restricted keys, server-side route calls with caching, and autocomplete session tokens, so that cost stays controlled and keys can't be abused.
- Tasks: INF1-INF7, SVC1

**X2: Location privacy** (P0, Phase 2, BN7)
As the business, I want location visible only to participants of an active trip, so that privacy is respected.
- AC: Tracking room join is authorized server-side per booking. Raw points follow retention. Admin sees only completed trips.
- Tasks: SOC1, SEC1

**X3: Arabic/RTL map experience** (P1, Phase 1)
As a user, I want Arabic labels and RTL layout on maps, so that it matches the app.
- AC: All Google calls pass `languageCode` from the request locale (`ar` default). Reverse-geocoded city/area saved in the request locale, with a stable key for matching.
- Tasks: SVC1, INF6

---

## 5. Decisions and open questions

### 5.1 Default decisions (change before build if you disagree)

| ID | Decision | Alternative |
|---|---|---|
| O1 | Passenger custom pickup is **auto-accepted** within detour and distance limits; driver is notified | Driver approval flow (adds states and delays) |
| O2 | **No new bookings after trip starts** (`in_progress`) | Live re-routing (expensive, complex) |
| O3 | v1 navigation is a **Google Maps deep link** | In-app navigation SDK |
| O4 | Detour and distance limits are **platform defaults** in config | Per-driver setting |
| O5 | Client does autocomplete directly with a restricted key and session token; server does Routes/Geocoding validation | Proxy all calls through backend (more control, more latency and cost) |
| O6 | Tracking is eligible only in one status. **You have both `in_progress` and `ongoing` in `TRIP_STATUS`.** Pick which one means "driver has started" | n/a, must be decided |
| O7 | Passenger sees driver position, route to **own** pickup and ETA only, not other passengers' pickups | Show full route |
| O8 | Route compute failure **does not block** publish or booking; `route_status=failed` and a retry job runs | Block until route computed |
| O9 | ETA uses straight-line plus recent speed between Routes API calls; Routes API called only on pickup transitions or large deviation | Routes API on every update (costly) |

### 5.2 Gaps against the current SSOT

| ID | Gap | Resolution |
|---|---|---|
| G1 | Booking has `drop_off_point` matched to a `TripStop` but **no pickup model** | DB2: pickup fields on `Booking` |
| G2 | Trip stores origin/destination only, **no route data** | DB1: polyline, distance, duration, status, version |
| G3 | `TripLocation` retention is 30 days, but D10/P10/A2 need old routes | DB3: store simplified actual path on the trip at completion; raw points still expire |
| G4 | Pickups free-form, dropoffs stop-only | Intentional; record in SSOT |
| G5 | **Recurring trips** are one row with dynamic expansion (decision 10). Tracking points and actual path need an **occurrence date**, otherwise every occurrence overwrites the same path | DB4: `occurrence_date` on `TripLocation` and the actual-path fields; confirm how bookings reference an occurrence |
| G6 | Tracking socket rooms are `user:<id>` and `role:<role>`; a **trip room** with per-booking authorization is needed | SOC1 |
| G7 | `NOTIFICATION_TYPE` has 15 values; new types need settings defaults and ar/en templates | DB5, NTF1 |

---

## 6. Google Maps Platform requirements

### 6.1 Account setup (INF1)

- A Google Cloud project dedicated to Masar (separate projects for production and staging so keys and quotas don't mix).
- A **billing account** attached. Maps Platform will not work without billing enabled.
- **Budget and alerts** (INF7): monthly budget with alerts at 50/80/100%, plus per-API quota caps to stop runaway cost.
- Ownership by a company account, not a personal one.

### 6.2 APIs to enable (INF2)

| API | Used for | Called from |
|---|---|---|
| **Maps SDK for Android** | Map display | Flutter app |
| **Maps SDK for iOS** | Map display | Flutter app |
| **Maps JavaScript API** | Map display on Flutter web and the admin dashboard | Web clients |
| **Places API (New)** | Autocomplete (with session tokens), place details | Client (O5) |
| **Geocoding API** | Reverse geocode pins into city/area | Server (validation), client optional |
| **Routes API** (Compute Routes) | Route, distance, duration, waypoints, detour | **Server only** |
| **Maps URLs** | Deep links for navigation | No key or API enablement needed |

Notes:
- Prefer **Routes API** and **Places API (New)** over the older Directions and legacy Places APIs. Verify current status and pricing on Google's pricing page before committing, as SKUs and free tiers change.
- Not needed in v1: Roads API (snap to road), Distance Matrix, Static Maps, Street View.

### 6.3 Credentials and keys (INF3)

**Important: Google Maps Platform uses API keys, not a key/secret pair.** There is no "client secret" for these APIs. The security comes from *restrictions on each key*. The one optional exception is a **URL signing secret**, used only for signed Static Maps / Street View URLs, which this spec does not need.

Create **separate keys per platform** so one leak doesn't expose everything and usage can be tracked per client:

| Key | Env var | Restriction (application) | Restriction (API) |
|---|---|---|---|
| Server | `GOOGLE_MAPS_SERVER_API_KEY` | **IP address** of the backend egress IPs | Routes API, Geocoding API only |
| Android | `GOOGLE_MAPS_ANDROID_API_KEY` | **Android apps**: package name + SHA-1 for debug, release, **and Google Play App Signing** certificates | Maps SDK for Android, Places API (New) |
| iOS | `GOOGLE_MAPS_IOS_API_KEY` | **iOS apps**: bundle ID | Maps SDK for iOS, Places API (New) |
| Web | `GOOGLE_MAPS_WEB_API_KEY` | **HTTP referrers** (the Flutter web and admin domains) | Maps JavaScript API, Places API (New) |

Also:
- `GOOGLE_MAPS_MAP_ID` (optional): a Map ID for cloud-based map styling and advanced markers.
- `GOOGLE_MAPS_URL_SIGNING_SECRET`: **only if** you later use Static Maps. Skip for v1.
- Client keys are visible inside the app. That is expected and why restrictions are mandatory.
- The server key must **never** ship to a client or be committed to git.
- If the server runs on a host without a fixed outbound IP, IP restriction is not possible. Then use a static egress IP (NAT/elastic IP) or accept a weaker API-only restriction. Decide this early (INF3).

### 6.4 Environment variables to add (INF5, INF6)

Add to `Main Server/.env.example`, `docker-compose.yml` (`main-server` environment) and the secrets store:

```
# Google Maps
GOOGLE_MAPS_SERVER_API_KEY=
GOOGLE_MAPS_REGION_CODE=jo
GOOGLE_MAPS_COUNTRY_BIAS=jo
GOOGLE_MAPS_TIMEOUT_MS=5000
GOOGLE_MAPS_MAX_RETRIES=2

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

The values above are starting points to tune, not business rules. Client keys go in the Flutter build config (Android manifest / iOS `AppDelegate` / web index), **not** in the backend `.env`, though the backend repo can hold documentation for them.

### 6.5 Google limits to design around

- Routes API allows a limited number of intermediate waypoints per request (check current limit; 25 at time of writing). `MAX_TRIP_STOPS` plus booked pickups must stay under it, otherwise split into legs.
- Google Maps URLs deep links support a limited number of waypoints (about 9). D5 must split long routes into legs.
- Autocomplete session tokens must be reused from the first keystroke to the place selection, otherwise each keystroke is billed.
- Terms of service: Google results must be shown on a Google map (don't draw Google polylines over another provider's map), and Google content generally can't be stored long-term except place IDs and, with limits, lat/lng. **Storing the encoded route polyline is a common practice but should be checked against the current Maps Platform terms** before launch. Fallback if disallowed: store only trip stops/pickups and recompute with a cache TTL.

### 6.6 Cost controls (X1, SVC1)

1. Server-only Routes calls with a Redis cache keyed by hash of ordered waypoints (`route:{hash}`, TTL `ROUTE_CACHE_TTL_SECONDS`).
2. Field masks on every Routes request (request only polyline, distance, duration).
3. Don't call Routes for live ETA (O9).
4. Autocomplete: session tokens, minimum 3 characters, client debounce 300 ms.
5. Rate-limit route preview per user (reuse `ratelimit:*` Redis keys).
6. Daily usage counter per API, logged and alerted.
7. Budget alerts and quota caps (INF7).

---

## 7. Mobile and client requirements (for the Flutter team, tracked here for dependency)

- Android: `ACCESS_FINE_LOCATION`, foreground service for tracking, `ACCESS_BACKGROUND_LOCATION` (needs Play Store declaration and justification video), notification permission.
- iOS: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, "Location updates" background mode, `UIBackgroundModes`.
- Permission education screen in Arabic and English before the system prompt.
- Battery strategy: fixed interval, distance filter, stop on pause/complete.
- Socket client: reconnect with recovery window (existing 2-minute recovery), buffer and batch points offline (D9).
- Privacy policy and in-app consent text updated for location sharing.

---

## 8. Backend tasks

> Names of existing routes/events should be aligned with SSOT section 17 and `docs/Flutter_Socket_*`. Everything below is proposed naming.

### 8.1 Infrastructure and config

| ID | Task | Notes |
|---|---|---|
| INF1 | Create GCP projects (prod, staging), billing, ownership | Section 6.1 |
| INF2 | Enable the APIs in section 6.2 | |
| INF3 | Create and restrict the 4 keys; decide static egress IP for the server key | Section 6.3 |
| INF4 | Create Map ID (optional) | |
| INF5 | Update `.env.example`, compose files, secrets store, CI secrets | Never commit keys |
| INF6 | Add `MAPS` and `TRACKING` blocks to `config/constants.ts` and a typed config loader | Do not hardcode values elsewhere |
| INF7 | Budgets, alerts, quota caps, usage dashboard | |

### 8.2 Data model (migrations 028 onward, plus spec update and Postman update per SSOT decisions 13 and 16)

| ID | Migration | Changes |
|---|---|---|
| DB1 | `028_trip_route` | `trips`: `route_polyline TEXT`, `route_distance_m INT`, `route_duration_s INT`, `route_status` (`pending|ready|failed`), `route_computed_at`, `route_version INT DEFAULT 0` |
| DB2 | `029_booking_pickup` | `bookings`: `pickup_type` (`stop|custom`), `pickup_stop_id` FK `TripStop` nullable, `pickup_lat`, `pickup_lng`, `pickup_label`, `pickup_city`, `pickup_area`, `pickup_order INT`, `detour_seconds INT`, `pickup_status` (`pending|arrived|picked_up|missed`), `arrived_at`, `picked_up_at`. Constraint: `pickup_type=stop` requires `pickup_stop_id`; `custom` requires lat/lng |
| DB3 | `030_trip_actual_path` | `trips`: `actual_path_polyline TEXT`, `actual_distance_m INT`, `actual_duration_s INT`, `started_at`, `completed_at` (only if missing) |
| DB4 | `031_trip_location_occurrence` | `trip_locations`: `occurrence_date DATE` nullable (G5), index `(trip_id, recorded_at)`; same on actual-path fields if per-occurrence |
| DB5 | `032_notification_types` | Add notification types (NTF1) and seed default `NotificationSetting` rows for existing users |

Also add constants: `ROUTE_STATUS`, `PICKUP_TYPE`, `PICKUP_STATUS`.

### 8.3 Services

| ID | Task | Detail |
|---|---|---|
| SVC1 | `mapsClient` | Thin wrapper for Routes and Geocoding. Timeouts, retry with backoff, circuit breaker, field masks, `languageCode`/`regionCode`, usage counters, errors mapped to `ApiError` with localized messages |
| SVC2 | `routeService` | `computeTripRoute(tripId)`: build ordered waypoints (origin, ordered `TripStop`s, booked pickups sorted by projection along the base route, destination), call Routes (cached), persist DB1 fields, bump `route_version`, set `route_status`. Runs inside the booking/stop transaction boundary but Google call is **outside** the DB transaction |
| SVC3 | `pickupService` | `validatePickup(trip, point)`: point-to-polyline distance check; detour = route duration with pickup minus base duration; enforce `PICKUP_MAX_DISTANCE_FROM_ROUTE_M` and `DETOUR_MAX_SECONDS`; return `accepted`, `distance_m`, `detour_seconds`, `reason` |
| SVC4 | `trackingService` extension | Ingest points (validate trip, driver, status, point age), persist-before-broadcast (SSOT decision 8), compute next pickup, ETA (O9), proximity events (once per booking) |
| SVC5 | `actualPathService` | On completion, load `TripLocation`, drop outliers (accuracy/speed), simplify (Douglas-Peucker), encode, store DB3 |
| SVC6 | `geo` utils | Polyline encode/decode, haversine, point-to-polyline distance, projection along polyline, simplification. Prefer a small well-known library over hand-rolled code |

### 8.4 REST endpoints

All follow `protect → roleGuard → validator → validate → controller → service → auditService.track`. Lists use the existing pagination envelope.

| ID | Method and path | Role | Purpose |
|---|---|---|---|
| API1 | `POST /api/maps/route-preview` | driver | Body: origin, destination, stops. Returns polyline, distance, duration, suggested arrival. Rate-limited, cached, not persisted |
| API2 | `POST /api/maps/reverse-geocode` | driver, passenger | Lat/lng to city, area, label in request locale (optional if client does it; server validation uses it) |
| API3 | `POST /api/trips` (extend) | driver | Accept lat/lng for origin, destination, stops; compute and persist route (DB1) |
| API4 | `PATCH /api/trips/:id/stops` (extend or add) | driver | Add/remove/reorder stops, recompute route, notify booked passengers of changes if relevant |
| API5 | `GET /api/trips/:id/route` | driver (owner), admin | Polyline, stops, ordered pickups (first name + seats), `navigation_url`/legs, `route_version` |
| API6 | `POST /api/trips/:id/pickup-preview` | passenger | Body: lat/lng or stop id. Returns `accepted`, `distance_from_route_m`, `detour_seconds`, `reason` |
| API7 | `POST /api/trips/:id/bookings` (extend) | passenger | Accept pickup payload, validate with SVC3, persist DB2 fields, recompute route, notify driver |
| API8 | `PATCH /api/trips/:id/pickups/:bookingId` | driver | Set `pickup_status` (`arrived|picked_up|missed`); emits socket event; interacts with no-show logic |
| API9 | `GET /api/bookings/:id/route` and `GET /api/trips/:id/route/actual` | passenger (own), driver (own) | Planned route + my pickup; actual path after completion |
| API10 | `PATCH /api/bookings/:id/pickup` | passenger | Change pickup before cutoff; same validation; recompute and notify |
| API11 | `GET /api/admin/trips/:id/route` and `/route/actual` | admin, support, moderator | Read-only planned and recorded route. Audited |

### 8.5 Realtime (Socket.IO)

Align with the existing `sockets/tracking` module. Proposed events:

| ID | Event | Direction | Payload and rule |
|---|---|---|---|
| SOC1 | `tracking:join` | client to server | Authorize: driver of the trip, or passenger with a `confirmed` booking and trip in tracking-eligible status. Join room `trip:<id>` |
| SOC2 | `tracking:location` | driver to server | Single point or batch `{lat, lng, speed, heading, accuracy, recorded_at}`. Ack `{status:'ok'}`/`{status:'error', code, message}` |
| SOC3 | `tracking:next_pickup` | server to driver | Next pickup, distance, ETA, remaining count |
| SOC4 | `tracking:route_updated` | server to room | `route_version` changed; clients refetch API5/API9 |
| SOC5 | `tracking:update` | server to room (passenger-filtered) | Driver position, ETA to **that passenger's** pickup (O7) |
| SOC6 | `sos:create` (extend) | passenger to server | Include passenger lat/lng and last driver position |
| SOC7 | `tracking:proximity` / `tracking:pickup_status` | server to passenger | Near, arrived, picked up, missed |
| SOC8 | `tracking:ended` | server to room | Completion or cancellation; clients stop |

Rules: persist before broadcast, rate-limit inbound points per socket, drop points from non-drivers, sanitize everything.

### 8.6 Background jobs

| ID | Job | Detail |
|---|---|---|
| JOB1 | `routeRetryJob` | Retry trips with `route_status` in `pending|failed`, capped attempts, alert on repeated failure |
| JOB2 | `actualPathJob` | Compact completed trips into DB3 if not done inline; idempotent |
| JOB3 | Extend `dataRetention` | Keep raw `TripLocation` 30 days; actual path lives on the trip; confirm legal retention for SOS-linked trips (keep points for SOS trips longer) |

### 8.7 Notifications (NTF1)

New types (add to `NOTIFICATION_TYPE`, categories, ar/en templates, defaults): `pickup_added`, `pickup_changed`, `pickup_cancelled` (to driver), `route_updated`, `driver_nearby`, `driver_arrived`, `pickup_missed`, `next_pickup` (optional). Delivery is async and never blocks the mutation (SSOT decision 7). Respect per-type flags.

### 8.8 Security, privacy, audit

| ID | Task |
|---|---|
| SEC1 | Authorization tests for every route and socket join (non-participants, cancelled bookings, completed trips, suspended and banned users) |
| SEC2 | Make sure logs never contain keys or full coordinate histories |
| SEC3 | Admin access limited to completed trips for actual path; masking rules unchanged |
| AUD1 | Audit: pickup set/changed, route recompute (including failures), admin route views, tracking start/stop |

### 8.9 Testing

- Mock Google in `tests/setup` (fixtures for Routes and Geocoding responses, including failure and timeout).
- Unit: geo utils, detour and distance rules, pickup ordering, simplification.
- Integration: booking with pickup, recompute, notification, cancellation.
- Contract: every endpoint in 8.4 and every socket event in 8.5.
- Socket: unauthorized join, buffered batch, out-of-order points, proximity fires once.
- Cost tests: cache hit on identical waypoints, no Routes call during live updates.

### 8.10 Docs and Postman (part of done, SSOT decision 16)

- New `docs/maps_tracking_guide.md`, update the socket guides.
- Postman: new group "Maps & Tracking" with `{{base_url}}` and examples.
- Update SSOT: sections 6, 7, 11, 16, 17, 18 and the architectural decisions (G4, O1-O9).

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| Latency | Route preview under 2 s p95 on cache miss; pickup preview under 2 s |
| Tracking freshness | Passenger sees driver position within ~5 s |
| Availability | Core booking and trip flows work when Google is down (O8) |
| Scale | Define target concurrent active trips; tracking uses Redis adapter and a persistent container (not serverless, per SSOT) |
| Storage | Raw points ~ 12 per minute per active trip at 5 s; confirm table growth and partitioning need |
| Privacy | Location only to participants, active trips only; retention documented |
| Localization | `ar` default, `en` supported |
| Observability | Metrics: Google calls, cache hit rate, failures, route compute time, active tracked trips |

---

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Google costs from autocomplete or Routes loops | High | Section 6.6, budgets, quotas |
| Background location rejected by Play/App Store | High | Early review prep, clear justification |
| Terms of service on storing route data | Medium | Verify before launch, fallback in 6.5 |
| Battery drain complaints | Medium | Interval and distance filter tuning |
| Recurring trips overwrite tracking data | Medium | G5 / DB4 |
| Unclear trip status (`in_progress` vs `ongoing`) breaks tracking rules | Medium | Decide O6 first |
| Passenger custom pickups cause unrealistic routes | Medium | Distance and detour limits, driver visibility |

---

## 11. Phasing

| Phase | Scope | Stories |
|---|---|---|
| **1. Routes and pickups** | GCP setup, keys, route preview, trip route, stops, passenger pickup with detour, notifications to driver | D1-D4, D8, P1-P4, X1, X3 |
| **2. Live trip** | Start trip, tracking, next pickup, passenger live view, SOS with location, navigation deep link | D5-D7, D9, P6, P7, P9, X2 |
| **3. History and admin** | Actual path, past routes, proximity alerts, pickup edit, admin route views | D10, P5, P8, P10, A1, A2 |
| **4. Later** | Admin live view, in-app navigation, live re-routing, route optimization | Not in this spec |

Suggested order: decide O6 and G5 first, then INF1-INF3 and DB1/DB2 in parallel, then SVC1-SVC3, then endpoints.

---

## 12. Definition of done (per task group)

- Migration versioned, reversible, and previewed (`db:migrate:preview`).
- Validators and localized messages (ar/en).
- Authorization and audit in place.
- Unit, integration and contract tests green with Google mocked.
- Docs and Postman updated; SSOT synced.
- No keys in the repo; `.env.example` updated.
