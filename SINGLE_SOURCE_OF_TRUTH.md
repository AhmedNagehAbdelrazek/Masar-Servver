# Masar Server — Single Source of Truth

> This file is the canonical reference for the Masar ride-sharing backend.
> If anything conflicts with `specs/*`, `Main Server/docs/*`, or code comments, **this file wins** until it is updated. Keep it in sync when you change behavior.
>
> Last consolidated: 2026-10-02 — covers specs 001–012, `Main Server/` (TypeScript/Express), `audit-server/`, docker compose, and all cross-cutting decisions.

---

## Table of Contents

1. [What Masar Is](#1-what-masar-is)
2. [Repository Map](#2-repository-map)
3. [Tech Stack & Services](#3-tech-stack--services)
4. [Global Architectural Decisions](#4-global-architectural-decisions)
5. [Environments, Config & Docker](#5-environments-config--docker)
6. [Domain Model (Sequelize)](#6-domain-model-sequelize)
7. [Constants / Options / Enumerations](#7-constants--options--enumerations)
8. [Factories & Seeders (no factory library)](#8-factories--seeders-no-factory-library)
9. [API Conventions](#9-api-conventions)
10. [Auth, Roles & Access Control](#10-auth-roles--access-control)
11. [Realtime (Socket.IO)](#11-realtime-socketio)
12. [Background Jobs](#12-background-jobs)
13. [Audit Trail](#13-audit-trail)
14. [Notifications](#14-notifications)
15. [Uploads](#15-uploads)
16. [Features by Spec (001–012)](#16-features-by-spec-001012)
17. [Route Mount Table](#17-route-mount-table)
18. [Migrations History](#18-migrations-history)
19. [Testing Strategy](#19-testing-strategy)
20. [Current Plan & Roadmap](#20-current-plan--roadmap)
21. [Glossary](#21-glossary)

---

## 1. What Masar Is

Masar is a ride-sharing platform (Jordan-first: JOD currency, `+962` phone masking, Arabic-first messages, Fri/Sat weekend logic).

Two deployables:

| Service | Folder | Port | Responsibility |
|---|---|---|---|
| `main-server` | `Main Server/` | 8000 | All business logic: auth, trips, bookings, ride-requests/offers, subscriptions, driver/passenger flows, admin, chat/SOS/tracking REST + Socket.IO |
| `audit-collector` | `audit-server/` | 4000 | Isolated audit ingest/query sidecar. Buffered batch inserts into separate `audit` DB |
| `db` | postgres:16 | 5432 (5433 on host via override) | Hosts **both** `app_db` and `audit` databases |
| `redis` | redis:7 | 6379 | Seat locks, presence, rate limits, pub/sub for sockets, home caches |

Clients: Flutter mobile + web. Postman collection at `Main Server/postman/masar_api_collection.json`. Socket guides in `Main Server/docs/Flutter_Socket_*`.

---

## 2. Repository Map

```
Masar Servver/
  AGENTS.md                          -> pointer to specs/012-passenger-flow-completion/plan.md
  SINGLE_SOURCE_OF_TRUTH.md          -> THIS FILE (canonical)
  docker-compose.yml                 -> prod-like stack (name: masar)
  docker-compose.override.yml        -> local dev ports (name: masar-local)
  package.json / pnpm-workspace.yaml -> root test tooling only
  specs/001..012/                    -> speckit: spec.md, plan.md, data-model.md, tasks.md, contracts/
  Main Server/                       -> primary API + Socket.IO (@workspace/api-server)
    app.ts / server.ts / socketServer.ts
    config/      database, redis, cloudinary, audit, constants, phoneCodes, messages/ar|en
    Controllers/ ~28  adminDashboard, adminModeration, adminPlan, adminVerification,
                      auth, booking, complaint, dashboard, driver, driverVerification,
                      favorite, health, message, notification, notificationSetting,
                      passengerProfile, paymentMethod, plan, rating, realtimeHealth,
                      rideRequest, seatLock, sos, subscription, supportTicket, trip, upload, vehicle
    Routes/ ~30 + index.ts (all mounted under /api — see §17)
    Services/ ~44  business logic (trip, booking, subscription, home, tracking, sos, ...)
    Models/ 35 Sequelize models (see §6)
    middlewares/ protect, roleGuard, socketAuth, uploadMiddleware, validatorMiddleware, globalErrorHandler
    sockets/ chat, notification, sos, tracking, presence, enforcement, admin
    jobs/    scheduler, worker, expirySweep, expiryReminder, lowBalanceWarning,
             sosEscalation, dataRetention, tripLifecycle, driverStats
    migrations/ versions 001..027 + generator
    utils/   ApiError, catchAsync, httpResponse, pagination, masking, sanitize,
             redisKeys, seatLock, socketAck, time, userAccess, freeTrips, validators/~20
    tests/   setup + unit|integration|contract
    docs/    19 feature guides (auth, driver flows, realtime, passenger flow, ...)
    postman/ collection + snapshots
    seed.ts / seed-mock.ts
    uploads/ local provider storage served at /uploads
  audit-server/
    src/server.ts, config.ts, db.ts (pg Pool), initDb.ts, migrate.ts,
        queue.ts (InMemoryAuditQueue), worker.ts, auth.ts,
        routes/ingestion.ts (POST /ingest), query.ts (GET /query), admin.ts, health.ts
```

**Key fact: No Prisma. ORM is Sequelize 6. No factory library (no faker/factory-girl) — seeding is hand-written in `seed.ts` + `seed-mock.ts` (see §8).**

---

## 3. Tech Stack & Services

| Concern | Decision | Notes |
|---|---|---|
| Runtime | Node 20+, TypeScript, CommonJS (`"type":"commonjs"`), `tsc` + `tsx watch` | `Main Server/app.ts` is Express factory, `server.ts` is boot |
| API | Express 5, routers under `/api` via `Routes/index.ts` | Thin controllers (`catchAsync`) → Services (transactions) → Sequelize |
| DB | PostgreSQL 16, Sequelize 6, `underscored:true`, literal `createdat/updatedat`, UUID PKs, `sync({force:false})` + versioned migrations | Both `app_db` + `audit` on same PG host, different DB names |
| Realtime | Socket.IO 4, JWT handshake (`middlewares/socketAuth.ts`), rooms `user:<id>` + `role:<role>`, Redis adapter, 2-min recovery | 7 socket modules; realtime tier must be persistent container, never Vercel serverless |
| Cache/locks | ioredis: `seat_lock:{trip}:{seat} NX EX 300`, `presence:{user}`, `ratelimit:*`, `driver_home:{id}` / `PASSENGER_HOME` TTL 30s | Seat lock = Redis only (no DB table) |
| Auth | JWT access (24h) + refresh, bcrypt (`SALT_ROUNDS=12`), OTP service | `protect` + `roleGuard([...])` chain |
| Validation | express-validator chains in `utils/validators/`; Zod only inside audit-server | Validation keys localized in `config/messages/` |
| Uploads | multer + abstraction `UPLOAD_PROVIDER=cloudinary\|local\|s3` | Local served at `/uploads`, volume `main_uploads` |
| Notify | `Services/notificationService/` (sms/push/inApp), FCM + Twilio/log, `ar` default templates | Delivery respects per-type flags; best-effort async (never blocks mutation) |
| Jobs | node-cron + `jobs/worker.ts` thread, `JOB_*_CRON`, `JOB_MAX_CATCH_UP`, `JOB_TIMEZONE`; `JOBS_INLINE=1` runs in-process | 7 jobs (see §12) |
| Audit | `createAuditMiddleware` (skips GET/health) → `AUDIT_COLLECTOR_URL`; `auditService.track` + `markResource`; local `AuditLog` + remote collector | Buffered batch inserts |
| Tests | Jest 30, Supertest, socket.io-client | `tests/setup/setup.js` mocks Redis, force-syncs DB, fixed UUIDs |

---

## 4. Global Architectural Decisions

These apply to **all** features unless a spec explicitly overrides:

1. **Sequelize, not Prisma.** `underscored:true` in DB, camelCase in code. Timestamps are literal `createdat/updatedat`. UUID PKs everywhere.
2. **Terminology: `booking`, not `reservation`.** Old typo `reservatoin` was removed. `ADMIN_RESOURCES=["trip","reservation"]` is legacy string only.
3. **Error envelope is `{status:'error', message, code}`** via `ApiError`. Early spec 001 proposed `{error:{code,message}}` — rejected; code is source of truth.
4. **Success envelope:** raw object via `successResponse`; lists are `{data, pagination:{page,limit,total,total_pages}}` via `parsePagination/buildPagination`.
5. **i18n Arabic-first.** `APP_LOCALE=ar|en|both`, per-request `?lang=` / `Accept-Language` / `X-Locale`. `ar` default. Catalogs in `config/messages/`.
6. **Privacy by default.** Phone `+962 79 *** 0000`, National ID masked. PII only to trip participants or via explicit reveal endpoints. Suspended = read-only, banned = fully blocked (except account-status reads).
7. **Notifications never block mutations.** Trip/booking writes always win; notify async with retry + audit.
8. **Persist-before-broadcast** for all realtime events. XSS sanitize all chat. Socket acks are `{status:'ok'} | {status:'error', code, message}`.
9. **Balance-gated publishing.** Driver can publish/start only if `total_balance >= fare*commission_rate`. Debt auto-unpublishes (`is_blocked_by_balance`).
10. **Recurrence is one row + `recurrence_days SMALLINT[]` (GIN) + dynamic expansion at query time.** No per-occurrence rows.
11. **Drop-offs = `TripStop`.** `drop_off_point` on booking must match an ordered `TripStop`; no free-text dropoffs.
12. **Stats are materialized by `driverStatsJob` (nightly), not computed per-request.** Fields: `totalTrips, responseRate, punctualityRate, professionalDriver`.
13. **No new tables without migration + spec update + Postman update.** Migrations are versioned `001..027` via `db:migrate:generate/preview`.
14. **Ownership checks on every mutating route.** `protect → roleGuard → validator → validate → controller → service (FOR UPDATE where money/seats) → auditService.track`.
15. **Constitution II exception (002):** virtual ledger + off-platform pay + screenshot approval is allowed (no payment gateway). Documented justification in spec 002.
16. **Docs + Postman are part of done.** Every spec updates `docs/*.md` and `postman/masar_api_collection.json` (Auth/Driver/Admin/Passenger groups, `{{base_url}}`, examples).

---

## 5. Environments, Config & Docker

### docker-compose.yml (`name: masar`)

- `db: postgres:16`, volume `audit_pgdata`, `pg_isready` healthcheck.
- `redis: redis:7`, volume `redis_data`.
- `audit-collector`: build `./audit-server`, `PORT 4000`, `DATABASE_URL=postgresql://postgres:postgres@db:5432/audit`, `REDIS_URL=redis://6379`, health `/health`.
- `main-server`: build `./Main Server`, `env_file: ./Main Server/.env` + overrides `PORT 8000, DB_*=postgres/postgres/app_db/db/5432, REDIS_HOST redis, JWT_EXPIRY 24h, SALT_ROUNDS 12, UPLOAD_PROVIDER local, AUDIT_COLLECTOR_URL=http://audit-collector:4000`, volume `main_uploads:/app/uploads`, health `/api/healthz`.

### docker-compose.override.yml (`name: masar-local`)

Local dev ports: `4000:4000, 8000:8000, 5433:5432, 6379:6379`. Pins `masar-audit-server:local`, `masar-main-server:local`.

### Env groups (see `Main Server/.env.example`)

Server (`PORT,NODE_ENV`), Locale (`APP_LOCALE`), DB (`DATABASE_URL` or `DB_*`), JWT (`JWT_SECRET,JWT_EXPIRY,SALT_ROUNDS`), Redis (`REDIS_HOST,PORT,PASSWORD`), Uploads (`UPLOAD_PROVIDER` + provider block), Notifications (`SMS_PROVIDER twilio|log`, Twilio creds, `FCM_SERVER_KEY`), Jobs (`JOB_*_CRON`, `JOB_TIMEZONE`, `JOBS_INLINE`), Audit (`AUDIT_COLLECTOR_URL`), Tracking (`SOCKET_TRACKING_BASE_URL`).

### Boot sequence (`server.ts`)

`db:init → db:migrate → seed (admin) → mock-seed guard → jobs → http+socket single port`.

---

## 6. Domain Model (Sequelize)

All in `Main Server/Models/`. Conventions: `underscored:true`, UUID PK, `createdat/updatedat`.

### Identity & profiles

- **User** — roles `passenger|driver|admin|support|moderator`; status `active|warned|suspended|banned`; `verification_status unverified|pending|rejected|approved`; `submitted_at|rejected_at|rejection_reason|rejection_fields JSONB`; `total_balance|is_in_debt|avgRating|strikes|locale|fcmToken|displayName`.
- **DriverProfile** — docs FKs→`UploadedImage`, `nationalID` (unique per person, stays here — never duplicated to `users`), license, `totalTrips|totalEarnings|responseRate|punctualityRate|professionalDriver|subscriptionTier`.
- **Vehicle** — `UNIQUE(driverId)` (one-vehicle rule), `manufacturer|model|vehicleType sedan|suv|van|bus|hatchback|modelYear|plateNumber UNIQUE|codeNumber|color|seats`, doc+photo FKs, `isVerified`, `rejection_reason|rejected_at`.
- **PassengerProfile** — auto-created at register; `preferredGender|smoking|savedRoutes|emergencyContacts` (+ `nationalID` via 022, `home_address` via 023).
- **VerificationStatusChange** (006) — `driver,from,to,reason,markedFields,changedBy` audit of state machine.
- **DocumentReview** (011) — `driverId,documentKey[id_front|id_back|face_photo|license_front|license_back|registration_front|registration_back|insurance],decision,reason,decidedBy,decidedAt`, `UNIQUE(driver, key)`, last-wins upsert. Docs are columns, not rows.
- **DeletionRequest** (010) — `user,reason,status pending|approved|rejected|cancelled,estimatedCompletion=+5bd skip Fri/Sat,reviewNotes,reviewedBy`.

### Trips & seats

- **Trip** — `origin_*|destination_* (city+area+lat/lng), departure|arrival, fare|currency JOD|total|available, is_recurring|recurrence_days SMALLINT[]|recurrence_end, gender_preference all|women_only|men_only, instructions[], status published|full|in_progress|ongoing|completed|cancelled, is_blocked|is_featured`.
- **TripSeat** — `UNIQUE(trip,number)`; types `driver|available|unavailable`; invariant: exactly 1 driver seat, ≥1 available.
- **TripStop** — `UNIQUE(trip,order)`; `city|address|lat|lng|stop_type pickup|dropoff|both`; ordered; doubles as dropoff options.
- **TripAttribute** — `UNIQUE(trip,key)`; flexible extras (was orphaned before 004, now CRUD).
- **TripLocation** (005) — `trip+driver+lat/lng+speed/heading`; retention 30d.
- Seat locks are **Redis only** (`seat_lock:{trip}:{seat} NX EX 300`, 5-min TTL). No `SeatLock` table.

### Bookings & marketplace

- **Booking** — `seatNumber|seatsBooked (multi-seat 012)|agreedFare|status pending|confirmed|cancelled|completed|no_show|referenceCode MSR-|payment pending|paid_cash|paid_other|disputed|dropoff*|completedAt|cancel*`. Term is `booking`.
- **RideRequest** — `open|offered|accepted|expired|cancelled`; board for passenger demand.
- **RequestOffer** — `sent|accepted|declined|expired + agreed_fare|booking_id|tripId nullable`; 1 offer/driver/request; TTL 24h (`REQUEST_OFFER_TTL_HOURS`); accept closes request → negotiate → `attach` to trip creates booking.
- **Rating** — `booking|rater|ratee|stars1-5|wasLate|lateMinutes|review|tags|isVisible`, `UNIQUE(booking+rater)`, immutable, bidirectional.
- **Complaint** — `reporter|accused|booking?|category|evidence|status open|reviewing|resolved|dismissed`.
- **Penalty** — `user|complaint?|type warning|suspension|ban|penaltyType general|trip_cancellation|no_show|misconduct|fraud|severity minor|moderate|major|reason|details|trip?|starts|ends|issuedBy|appeal*`. Cancellation escalation: 3–4 warn, 5–6 7d susp, 7+ 30d susp, never auto-ban.
- **DelayEvent** — `booking|party driver|passenger|minutes|reason|reportedBy`; surfaces in ratings.
- **FavoriteDriver | FavoriteRoute** — idempotent `findOrCreate`; route-match notifies driver.
- **RecentSearch** (012) — `passenger,origin_city,destination_city,searched_on` + dedup indexes.

### Subscriptions & money (virtual ledger)

- **SubscriptionPlan** — `≤1 is_free`, `free_offer JSONB {type trips|credit, max}`.
- **DriverSubscription** — snapshots `plan_*`, `balance>=0`, partial `UNIQUE(driver+plan WHERE pending)`, statuses `pending_approval|active|rejected|cancelled|expired`.
- **SubscriptionTransaction** — ledger entries.
- **PaymentMethod** — `bank_account|e-wallet|mobile_money`; CRUD locked to admin after 009.
- `users.total_balance|is_in_debt`, `trips.is_blocked_by_balance`. FIFO commission `fare*rate` from earliest-active plan at trip completion.

### Comms, safety, support

- **Notification** — `user|type (15 values)|title|body|data|isRead|sentVia`.
- **NotificationSetting** — `UNIQUE(user+type)`; `enabledInApp|enabledPush`; defaults all-on; auto-init for new users.
- **Message** — `sender|receiver?|trip?|ticket?|booking?|message|messageType text|image|system|isRead|readAt`; invariant `tripId XOR supportTicketId`; retention 1yr.
- **SosEvent** — `user|trip!|booking?|lat|lng|urgency|status pending|ack|resolved|cancelled|escalation|lastAlert|ackBy|resolvedBy`; trip-only; 60s re-alert; escalate L1 after 5min; long-term retention.
- **SupportTicket** — `user|category|subject|desc|priority low|med|high|urgent|status open|in_progress|resolved|closed|assigned|reference TKT-|booking|trip`.
- **SupportTicketMessage** — thread under ticket.
- **UploadedImage** — `hash|url|provider`.
- **AuditLog** — local copy; remote truth in `audit` DB.

### Relationships (simplified)

`User 1-1 DriverProfile|Vehicle|PassengerProfile; User 1-n Trip|Booking(passenger)|Rating|Penalty|Notification|DeletionRequest|SosEvent; Trip 1-n Seat|Stop|Attr|Location|Booking|SosEvent; Booking 1-n Rating|Complaint|Delay|SosEvent; RideRequest 1-n Offer; Ticket 1-n Message.`

---

## 7. Constants / Options / Enumerations

Source: `Main Server/config/constants.ts` (368 lines). This is the **options registry** — do not hardcode these strings elsewhere.

| Group | Options |
|---|---|
| `ROLES` | `passenger, driver, admin, support, moderator` |
| `USER_STATUS` | `active, warned, suspended, banned` |
| `GENDER` | `male, female` |
| `VEHICLE_TYPES` | `sedan, suv, van, bus, hatchback` |
| `TRIP_STATUS` | `published, full, in_progress, ongoing, completed, cancelled` (+ `draft` in early specs, removed) |
| `SEAT_TYPE` | `driver, unavailable, available` |
| `GENDER_PREFERENCE` | `all, women_only, men_only` |
| `BOOKING_STATUS` | `pending, confirmed, cancelled, completed, no_show` |
| `PAYMENT_STATUS` | `pending, paid_cash, paid_other, disputed` |
| `RIDE_REQUEST_STATUS` | `open, offered, accepted, expired, cancelled` |
| `REQUEST_OFFER_STATUS` | `sent, accepted, declined, expired` |
| `COMPLAINT_STATUS` | `open, reviewing, resolved, dismissed` |
| `PENALTY_TYPES` | `warning, suspension, ban` + `PENALTY_SEVERITY minor|moderate|major`, `PENALTY_CATEGORY general|trip_cancellation|no_show|misconduct|fraud` |
| `CANCELLATION_ESCALATION` | 3–4 warn, 5–6 7-day susp, 7+ 30-day susp, never auto-ban |
| `TICKET_STATUS/PRIORITY` | `open|in_progress|resolved|closed`, `low|medium|high|urgent` |
| `SUBSCRIPTION_TIER/STATUS` | `free|pro_monthly|pro_annual`, `pending_approval|active|rejected|cancelled|expired` |
| `PAYMENT_METHOD_TYPE` | `bank_account, e-wallet, mobile_money` |
| `VERIFICATION_STATUS/FIELD_KEYS` | `unverified|pending|rejected|approved` + field keys for `fields_to_fix` |
| `FREE_OFFER_TYPE` | `trips, credit` |
| `SOS_STATUS/URGENCY` | `pending|acknowledged|resolved|cancelled` |
| `MESSAGE_TYPE` | `text, image, system` |
| `NOTIFICATION_TYPE (15)` | includes `subscription_payment, payment_confirmed, TRIP_STARTED, sos_alert (admin-only)`, + `NOTIFICATION_CATEGORIES bookings|trips|subscriptions`, group + type labels ar/en |
| `STOP_TYPE` | `pickup, dropoff, both` |
| `REQUEST_OFFER_TTL_HOURS` | `24` |
| `ADMIN_RESOURCES` | `["trip","reservation"]` (legacy string) |
| `PAGINATION` | default `page 1, limit 20, max 100` |
| `TRIP_DURATION_HOURS` | `0` (overlap detection window; assumed duration) |
| `TEST_PHONES/OTP` | fixed test accounts + OTP bypass |

Reference codes: Booking `MSR-XXXXXX`, Ticket `TKT-XXXXXX` (via `utils/referenceCode.ts`).

---

## 8. Factories & Seeders (no factory library)

**Decision: no factory library** (no faker, no factory-girl, no Prisma seed). All test/demo data is hand-written seeders. If you need "factories", write them as seeder helpers — do not introduce a new dependency without updating this file.

### `seed.ts` — `seedAdmin()`

- Uses `SEED_ADMIN_PHONE/USERNAME/PASSWORD`, bcrypt `SALT_ROUNDS`, `findOrCreate` by phone.
- Plus 2 deterministic test accounts: `+962700000000` driver / `+962711111111` passenger / `Test@1234`.
- Run: `pnpm seed`. Also auto-runs on boot.

### `seed-mock.ts` — marketplace fixture

- Gated by `SEED_MOCK_ON_BOOT=true` + marker phone `+962790000001`, else skip.
- `TRUNCATE ... CASCADE` 22 tables, then inserts: admin+moderator, 5 drivers (approved/pending/suspended/debt/female), 5 passengers, 14 `UploadedImage`, profiles, 5 vehicles, status changes, 5 plans (Free Tier trips:5, Pro Weekly/Monthly/Annual + inactive Legacy), 5 payment methods (CliQ/Zain/Orange/Arab Bank + inactive PayPal), subscriptions (active/expired/pending/rejected w/ snapshots), transactions.
- Trip/booking/rating/complaint/penalty/ticket/message/notification/favorite/ride-request sections currently **commented out** (intentional — re-enable per spec 009 follow-up).
- Run: `pnpm seed:mock`.

### Migration generator

`migrations/scripts/generate.ts` + `scripts/patch-auto-migrations.ts`, commands `db:migrate:generate/preview`, `postinstall patch-auto-migrations`.

---

## 9. API Conventions

- **Base:** all under `/api` (`Routes/index.ts`).
- **Chain:** `protect (JWT) → roleGuard → validator chain → validate → controller (catchAsync thin) → service (transactions, FOR UPDATE for FIFO/balance) → Sequelize → auditService.track`.
- **Success:** raw object via `successResponse`; lists `{data, pagination}` with `parsePagination/buildPagination`.
- **Errors:** `ApiErrors.*` → `{status:'error', message, code}` with 400/401/403/404/409/422. Codes are stable (e.g. `REQUEST_ALREADY_PROCESSED`, `TRIP_STARTED` is event not error).
- **i18n:** `successResponse` localizes via `?lang=/Accept-Language/X-Locale`, `ar` default; validation keys in `config/messages/`.
- **Pagination:** `?page=&limit=` (1/20/100 defaults/max). Partial admin endpoints each paginated.
- **Idempotency:** ratings once per `rater+booking` (immutable); favorites `findOrCreate`; complaints resolve idempotent; verification latest-wins; subscription approve first-wins.
- **Privacy:** masking (`utils/masking.ts`), PII gated to participants, suspended read-only / banned blocked.
- **Performance SLOs:** spec targets p95 <300ms (mutations), dashboard/home <500ms, cached home ~108ms; admin summary ≤2s with ≤8 COUNTs.

---

## 10. Auth, Roles & Access Control

- JWT access (24h) + refresh; bcrypt; OTP service (`Services/otp.ts`).
- `middlewares/protect.ts` (JWT verify + status gate) → `roleGuard(['driver'|'admin'|...])`.
- Phone immutable (OTP-bound). Email locks at verification approval. `displayName/avatar` always editable.
- Trip details: driver (owner) | confirmed passenger | admin only. Driver-profile reveal: confirmed booking parties + admin only. Delay report: booking parties only.
- `/payment-methods` locked to admin (since 009). SOS admin ack/resolve admin-only. `sos_alert` notification type admin-only.
- Socket handshake requires `access` JWT in `socket.handshake.auth.token`; banned/suspended rejected before handlers register.

---

## 11. Realtime (Socket.IO)

- Setup: `socketServer.ts` + `middlewares/socketAuth.ts` (hardened in 005 — was trusting client `userId`).
- Rooms: `user:<id>` + `role:<role>`; Redis adapter; 2-min recovery; 10k conn target.
- Modules per connection: `chatSocket, notificationSocket, sosSocket, trackingSocket, presenceSocket, enforcementSocket, adminSocket`.
- **Chat:** trip P2P only `confirmed→completed`, plus support-ticket chat; typing 4s idle; read receipts; 10 msgs/10s rate limit; history via REST.
- **Tracking:** live 3–5s + ETA; 1 loc/2s rate limit; persist-before-broadcast.
- **SOS:** trip-only; ack/resolve; 60s re-alert; escalate L1 after 5min (`sosEscalationJob`).
- **Presence:** 60s grace; `presence:{user}` in Redis.
- **Enforcement:** revoke on suspend/ban; `disconnectUserSockets()` emits `force_disconnect`.
- **Admin live dashboard** + metrics/alerts (>5% >1s latency or >5% conn fail /1min).
- **Retention:** chat 1yr, location 30d, SOS long-term (`dataRetentionJob`).
- REST complements: chat history, `/admin/sos` list/ack/resolve, `/health/realtime` metrics.
- Client guides: `docs/Flutter_Socket_IO_Integration_Guide.md`, `docs/Flutter_Socket_Simple_Guide.md`.

---

## 12. Background Jobs

Started by `startJobs()` after boot (`jobs/index.js`). Worker thread (`worker.js`) with missed-run catch-up bounded by `JOB_MAX_CATCH_UP`. `JOBS_INLINE=1` runs in-process.

| Job | What it does | Cron env |
|---|---|---|
| `expirySweepJob` | Expire stale trips/subscriptions; close expired offers | `JOB_EXPIRY_SWEEP_CRON` |
| `expiryReminderJob` | Upcoming-expiry reminders | `JOB_REMINDER_CRON` |
| `lowBalanceWarningJob` | Driver low-balance warnings | `JOB_LOW_BALANCE_WARNING_CRON` |
| `sosEscalationJob` | Escalate unanswered SOS (L1 after 5min, 60s re-alert) | `JOB_SOS_*` |
| `dataRetentionJob` | Purge chat>1yr, location>30d | `JOB_RETENTION_*` |
| `tripLifecycleJob` | Trip state transitions, no-show handling | `JOB_TRIP_*` |
| `driverStatsJob` | Nightly materialization of `totalTrips|responseRate|punctualityRate|professionalDriver` | `JOB_DRIVER_STATS_CRON` |

---

## 13. Audit Trail

- `createAuditMiddleware` ships write-request events to `AUDIT_COLLECTOR_URL` (skips GET/health).
- `auditService.track` + `markResource` in services (e.g. verification changes, subscription approvals, penalties).
- Local `AuditLog` model + remote `audit` DB via `audit-server` buffered `InMemoryAuditQueue → insertAuditBatch`.
- `audit-server` routes: `POST /ingest`, `GET /query`, admin, `/health`. Auth via shared secret (`auth.ts`). Migrations in `audit-server/migrations/`.

---

## 14. Notifications

- `Services/notificationService/` with `sms/push/inApp` channels; FCM + Twilio/log SMS; locale templates `ar` default.
- 15 `NOTIFICATION_TYPE`s grouped `bookings|trips|subscriptions` with ar/en labels (`GROUP_LABELS`, `TYPE_LABELS`).
- `NotificationSetting` per user+type (`enabledInApp|enabledPush`), defaults all-on, auto-init for new users, partial update, master switch hard-overwrite (010).
- Delivery respects flags; `sos_alert` admin-only. Best-effort async with retry+audit — mutation always wins.

---

## 15. Uploads

- multer + `uploadMiddleware` + abstraction `uploaders/` (`UPLOAD_PROVIDER=cloudinary|local|s3`).
- Local files served from `/uploads` (volume `main_uploads`).
- Docs retained while account active, driver+admin only, purged on account close. Verification docs: `id_front|id_back|face_photo|license_front|license_back|registration_front|registration_back|insurance`.

---

## 16. Features by Spec (001–012)

### 001 — Driver Trip Creation & Dashboard

**What it does:** Verified-driver trip publishing + unified driver dashboard.
- Create trip: origin/dest (city+area+lat/lng), ordered waypoints, per-seat `available|unavailable|driver`, `once|repeated` recurrence, gender filter `all|women_only|men_only`, instructions arrays.
- 5-min Redis seat lock (`seat_lock:{trip}:{seat}`).
- Dashboard: account, today/upcoming trips, metrics (today count, completed total, monthly earnings, avg rating, reservation history paginated).
**Decisions:** recurrence = single row + `recurrence_days SMALLINT[]` GIN + dynamic expansion; lifecycle `published→in_progress→completed (+cancelled)`; p95 <300ms, dashboard <500ms.
**Models:** `Trip, TripSeat (UNIQUE trip,seat; 1 driver seat, ≥1 available), TripStop (UNIQUE trip,order)`.

### 002 — Driver Subscription Plans

**What it does:** Plan catalog, free trial, off-platform pay, virtual balance, commission.
- One-time free trial per National ID (`trips` quota or `credit`).
- Off-platform pay + screenshot upload → `pending_approval`; admin approve/reject (first-wins `REQUEST_ALREADY_PROCESSED`).
- Virtual balance ledger; FIFO commission `fare*rate` from earliest-active plan at trip completion.
- Publish/start gate `total_balance >= fare*rate`; debt → unpublish (`is_blocked_by_balance`); queue/renewal (balance merge + period reset); expiry sweep; payment-method CRUD.
**Decisions:** Constitution II violation justified (no gateway, virtual ledger); National ID stays on `DriverProfile.nationalID` (no duplication); masked display; notifications `ar/en`; new `jobs/` + `notificationService/channels/`.
**Models:** `SubscriptionPlan (≤1 is_free, free_offer JSONB), DriverSubscription (snapshots, balance>=0, partial UNIQUE driver+plan WHERE pending), PaymentMethod, users.+total_balance/is_in_debt, trips.+is_blocked_by_balance`.

### 003 — Driver Flow Audit (docs-only, no runtime code)

**What it does:** 8 journeys mapped (onboarding, trip mgmt, dashboard, reservations, in-trip, after-trip, reputation/penalties, monetization); 42 endpoints inventoried; DB field verification; gap list; Postman reorg to `Auth/Driver/Admin/Passenger`.
**Critical gaps found (fixed in 004/009):** no ratings endpoint, no earnings aggregation, no chat/call/notifications, orphaned `RideRequest/RequestOffer` board, orphaned `trip_attributes`.
**Decisions:** samples use real envelope `{status,message,code}`; masked PII; shared endpoints cross-referenced. Report: `docs/driver_flow_audit_results.md`.

### 004 — Driver Flow Completion & Hardening (28 endpoints)

**What it does:** Closes 003 gaps.
- `PUT/DELETE /trips/:id` (+ attributes); driver bookings list/detail (status/date filters, masked phone); idempotent ratings (`POST /ratings` once per rater+booking, immutable); penalties list (active+expired); admin verification queue approve/reject (resubmittable); complaints file/list/resolve (idempotent); earnings daily/weekly/monthly post-commission + lifetime stats; notifications list/mark-read; driver profile + vehicle list/update; admin users/trips moderation + penalty issue; Postman 103→131 requests.
**Decisions:** no new tables; bidirectional ratings; pagination `{data,pagination}`; ownership checks; phone mask.

### 005 — Realtime Live Events

**What it does:** Trip P2P + ticket chat (confirmed→completed), typing (4s) + read receipts, live tracking 3–5s + ETA, instant notifications + unread + offline retrieve in `createdat` order, trip-only SOS (ack/resolve, 60s re-alert, L1 after 5min), presence (60s grace), enforcement revoke, admin live dashboard, metrics/alerts, retention (chat 1yr / location 30d / SOS long-term).
**Decisions:** harden `socketServer` with JWT+status gate; Redis adapter for 10k; persist-before-broadcast; XSS sanitize; chat 10/10s, location 1/2s; socket acks; realtime tier = persistent container.
**Models (NEW):** `Message (tripId XOR ticketId), SosEvent (tripId NOT NULL, pending→ack→resolved|cancelled), TripLocation`; migration `008`; jobs `sosEscalationJob, dataRetentionJob`; REST chat history, `/admin/sos`, `/health/realtime`.

### 006 — Verification Resubmission & One-Vehicle

**What it does:** Driver `GET status, GET submission, POST submit/resubmit`; state `unverified→pending→rejected→approved (terminal, locked)`; prefilled rejected form + `fields_to_fix` highlighted; under-review read-only (409); approved 403; one-vehicle upsert + DB UNIQUE; admin reject requires `reason+fields_to_fix`; latest-wins; realtime decision notify; audit `verification_status_changes`.
**Decisions:** phone immutable; email locks at approval; docs retained while active, purged on close; duplicate vehicles detached (`driver_id=NULL`, abort if active trip refs) before UNIQUE.
**Models:** `users.+verification_status|submitted_at|rejected_at|rejection_reason|rejection_fields, vehicles.+rejection_reason|rejected_at + UNIQUE(driver_id), VerificationStatusChange NEW`; migration `013`.

### 007 — Driver Home API

**What it does:** `GET /api/driver/home` single payload (profile, subscription tier/price/currency/expiry/days_remaining + `free_trips{max,used,remaining}`, next trip earliest `published|full` incl. overdue + passengers + `can_start`, summary `completed_today|reserved_next|trips_today`, recent 5 bookings); `POST /trips/:id/start` (±1h incl. overdue, `published/full→in_progress`, balance gate, `TRIP_STARTED` notify + `tracking_link`); `GET /trips/:id` + passengers/seat_numbers (PII gated); `GET /driver/subscription` (current+history).
**Decisions:** new `homeService` (not `dashboardService` reuse); `seat_numbers=[seatNumber]` derived; `next_trip ORDER departure ASC LIMIT 1`; `can_start = status∈{published,full} AND departure-now<=1h`; Redis `driver_home:{id}` 30s, invalidate on start; verified + `status∈{active,warned}` else 403; 290ms uncached / 108ms cached.

### 008 — Trip Details / Cancel / Notification Settings

**What it does:** `GET trip details` (metadata+vehicle+confirmed passengers w/ profile/seats/fare/dropoff, driver|confirmed passenger|admin only); `POST trip cancel` (owner only, `published|full` only, 0 confirmed bookings else 409, `reason≤100 + note≤500` required, →`cancelled`, auto `Penalty trip_cancellation minor` + escalation 3-4 warn / 5-6 7d / 7+ 30d, never auto-ban, notify pending passengers); `GET|PUT /settings/notifications` (per-type `enabled_in_app|enabled_push`, partial update, defaults all-on, auto-init, `sos_alert` admin-only).
**Note:** `plan.md` is template stub — `spec.md` is authority.
**Models:** `penalties.+penalty_type|severity|trip_id`, `notification_settings` NEW; p95 500ms.

### 009 — Fix Seeder Gaps (marketplace loop repair, 35 endpoints / 8 groups)

**What it does:** Passenger booking create from Redis lock (atomic `MSR-XXXXXX`, decrement `availableSeats`, seats→`unavailable`, release lock; fare must match; only `published|full`; >1h cancel window restores seats); ride-request board (`open→offered→accepted + expired/cancelled`, 1 offer/driver/request, verified+active driver only, accept closes request → negotiate → `attach` creates booking, TTL 24h); `completeTrip` finalizes `confirmed→completed + paid_cash + completedAt` + stats + rating prompts; `/payment-methods` admin-locked; support tickets (`TKT-XXXXXX` + booking/trip links + messages + admin notify); delay report (parties only, realtime notify, surfaces in ratings); favorites (idempotent `findOrCreate`, route-match notifies); `PassengerProfile` auto-create + get/update; hygiene (`RIDER` removal, `reservatoin` typo); tracking docs.
**Models:** `bookings.+completedAt, request_offers.+agreed_fare|booking_id, support_tickets.+reference_code|booking_id|trip_id, SupportTicketMessage NEW, penalties.+details`; migration `016`.

### 010 — Driver Profile & Settings (5 screens)

**What it does:** `GET /driver/profile/full` (identity+vehicle+subscription+stats+badges+menu); `GET|PUT /driver/personal-data` (unverified/rejected all fields; approved locks `fullName|nationalID|email|vehicle identity`, per-field reject, phone/age/displayName/avatar always editable, identity edit → `pending`); `GET /driver/ratings` (+distribution % 5→1, badges, punctuality, paginated reviews w/ passenger+trip); `GET|PUT /driver/notification-settings` (grouped `bookings|trips|subscriptions`, dual-channel, master switch hard-overwrite); `POST /auth/change-password` (verify current, ≥8, revoke all `refresh:{id}:*` + blacklist current); `GET /driver/account-status` (verification/susp/ban/penalties/deletion flags); `POST /driver/delete-account` (confirm+reason, `pending`, 5-business-day estimate skip Fri/Sat, admin notify, 409 duplicate) + `POST .../cancel`.
**Decisions:** approved terminal no re-verify; suspended read-only / banned blocked; deterministic badges; Arabic-first.
**Models:** `DeletionRequest NEW, users.+displayName`; migration `018`; +`NOTIFICATION_TYPE.subscription_payment|payment_confirmed`, `NOTIFICATION_CATEGORIES`, group labels.

### 011 — Admin Dashboard Part 1 (19 endpoints)

**What it does:** `GET /admin/dashboard/*` (`protect+roleGuard admin`): summary KPIs (drivers active/total, trips active/total, vehicles total, pending docs) + alerts (pending docs + drivers + unresolved complaints) + top routes + recent trips + pending requests + latest complaints; partials each paginated; drivers directory (search name/phone, filter `active|suspended|pending` + reg date, sort, AND semantics) + unfiltered stat cards; dossier tabs header/overview/trips(status+month)/evaluations(5→1 dist+tags)/account log(penalties+complaints merge)/car/documents(grouped personal|vehicle, `pending|approved|rejected|missing`); actions doc approve/reject, `POST drivers/:id/status {active|suspended|blocked|pending}` + `POST .../account-status {suspend|reactivate|unblock}` aliases on single `users.status`, complaint resolve reused.
**Decisions:** docs are columns → `document_reviews` upsert (UNIQUE driver+key, last-wins); status derived `banned→blocked, suspended→suspended, active/warned+unverified|pending|rejected→pending, +approved→active`; suspend inserts penalty, unblock closes open suspension; ≤2s reads, ≤8 COUNTs summary.
**Models:** `DocumentReview NEW`; migration `020`.

### 012 — Passenger Flow Completion (current — AGENTS.md pointer)

**What it does:** Extend `GET /trips/search/available` (`time_from|time_to, vehicle_type, seats>=, gender`; AND; empty→`[]`; records `RecentSearch`); `GET /trips/:id/options` (ordered `TripStop` dropoffs + open count, `published|full` only); `POST /bookings` multi-seat + `drop_off_point` must be trip stop + atomic lock/decrement (backward-compat single `seat_number`); `GET /bookings[?status]` enriched (status as-stored, trip time/route, driver+vehicle summaries, fare, own rating) + detail; `GET /bookings/:id/driver-profile` (confirmed only, passenger|driver|admin, `User` + `DriverProfile nationalID|totalTrips|responseRate|punctualityRate|professionalDriver` + `Vehicle`); `GET /ride-requests/:id/matches` (owner-only, rank route→time→seats→gender, advisory never auto-books); `GET /profile/passenger/home` (next_booking nearest pending/confirmed, last_searched distinct 5 routes, last ended trips, 30s cache).
**Decisions:** term `booking`; drop-offs = `TripStop`; stats materialized by `driverStatsJob` nightly, not per-request; PII only via reveal.
**Models:** `driver_profiles.+punctualityRate|professionalDriver, RecentSearch NEW`; migrations `021` (+`022 national-id, 023 home-address, 024 recent-search-updatedat fix, 026 seat-numbers, 027 profit/seat-history`).

---

## 17. Route Mount Table

All under `/api` (`Main Server/Routes/index.ts`):

| Mount | Router | Area |
|---|---|---|
| `/api/healthz`, `/api/health` | health / realtimeHealth | Liveness & realtime metrics |
| `/api/auth` | authRoutes | Register, login, OTP, tokens, change-password |
| `/api/upload` | uploadRoutes | Image upload (provider abstraction) |
| `/api/trips` | tripRoutes + seatLockRoutes | Trips, stops, attributes, seat locking, search/options/start/cancel |
| `/api/driver/dashboard` | dashboardRoutes | Legacy dashboard (metrics, today/upcoming) |
| `/api/driver` | driverRoutes + driverVerificationRoutes | Driver profile/full, personal-data, ratings, notification-settings, account-status, delete-account, verification submit |
| `/api/plans` | planRoutes | Plan catalog |
| `/api/payment-methods` | paymentMethodRoutes | Admin-guarded payment methods |
| `/api/subscriptions` | subscriptionRoutes | Driver subscriptions (trial, pay, queue, history) |
| `/api/admin` | adminSubscriptionRoutes + adminModerationRoutes + sosRoutes | Subscription approvals, users/trips moderation, penalties, SOS |
| `/api/admin/verification` | adminVerificationRoutes | Verification queue approve/reject |
| `/api/admin/dashboard` | adminDashboardRoutes | 19 dashboard endpoints |
| `/api/bookings` | bookingRoutes | Passenger bookings (multi-seat, cancel, driver-profile reveal) |
| `/api/ride-requests` | rideRequestRoutes | Ride-request board + matches |
| `/api/offers` | offersRoutes | Request offers + attach |
| `/api/support-tickets` | supportTicketRoutes | Tickets + messages |
| `/api/favorites` | favoriteRoutes | Favorite drivers/routes |
| `/api/profile/passenger` | profileRoutes | Passenger profile + home |
| `/api/ratings` | ratingRoutes | Bidirectional idempotent ratings |
| `/api/complaints` | complaintRoutes | Complaints file/list/resolve |
| `/api/notifications` | notificationRoutes | List / mark-read |
| `/api/settings/notifications` | notificationSettingRoutes | Per-type preferences |
| `/api/vehicles` | vehicleRoutes | One-vehicle upsert |
| `/api/chat` | chatRoutes | Trip/ticket chat history |

---

## 18. Migrations History

`Main Server/migrations/versions/` — run via `db:migrate`, preview via `db:migrate:preview`, generate via `db:migrate:generate`:

| Version | Content |
|---|---|
| 001-init | Baseline schema |
| 005-subscription-plans | Plans, subscriptions, transactions, payment methods, balance fields |
| 006-free-trips | Free-trial quota |
| 007-free-offer-snapshot | Free-offer snapshots |
| 008-code-number + 008-realtime | Vehicle code number; Message/SosEvent/TripLocation + realtime indexes |
| 011-plate-restore | Plate number restore |
| 012-code-not-unique | Code number uniqueness relax |
| 013-verification (+driver-id) | Verification columns + driver FK |
| 014-verification-cols | Verification follow-ups |
| 015-trip-cancel-notify | Cancel + penalty columns |
| 016-seeder-gaps | `completedAt`, `agreed_fare|booking_id`, ticket refs, `SupportTicketMessage`, `penalties.details` |
| 017-request-origin-optional | Ride-request origin relax |
| 018-profile-settings | `DeletionRequest`, `displayName`, notification types |
| 019-booking-chat | Booking-linked chat |
| 020-admin-dashboard | `DocumentReview` |
| 021-passenger-flow | `RecentSearch`, `punctualityRate|professionalDriver` |
| 022-national-id | Passenger national ID |
| 023-home-address | Home address |
| 024-recent-search-fix | Recent-search `updatedat` fix |
| 025-noname | Misc (see file) |
| 026-seat-numbers | Multi-seat `seat_numbers` |
| 027-profit-history | Profit / seat-history |

---

## 19. Testing Strategy

- `pnpm test` (full Jest), `test:unit`, `test:integration`, `test:contract`, `test:coverage`.
- Setup (`tests/setup/setup.js`): mock Redis, force-sync DB, fixed UUIDs, `generateAccessToken` helper.
- Targets: 80% coverage (001), p95 SLOs above, Postman status tests per endpoint.
- Contract tests guard envelope `{status,message,code}` + pagination shape.

---

## 20. Current Plan & Roadmap

- **Active:** `specs/012-passenger-flow-completion` (see `plan.md` — AGENTS.md pointer). Implements search filters, trip options, multi-seat bookings, enriched booking lists, driver-profile reveal, request matches, passenger home + `RecentSearch` + stats materialization.
- **Done:** 001 (trips/dashboard), 002 (subscriptions), 003 (audit docs), 004 (driver hardening), 005 (realtime), 006 (verification), 007 (driver home), 008 (trip cancel/notify-settings), 009 (seeder gaps), 010 (profile/settings), 011 (admin dashboard P1).
- **Known follow-ups:** re-enable commented trip/booking/rating sections in `seed-mock.ts`; `025-noname` cleanup; serverless-incompatible realtime (keep persistent); payment gateway evaluation (currently out of scope — virtual ledger stands); admin dashboard P2 (beyond 011).

---

## 21. Glossary

- **Booking** = passenger seat reservation (never "reservation"). **Offer** = driver bid on a ride-request. **Attach** = converting accepted offer into booking on a trip. **Free trial** = one-time per National ID (`trips` count or `credit`). **FIFO commission** = deduct `fare*rate` from earliest-active plan. **Debt** = `total_balance < fare*rate` → `is_blocked_by_balance`. **Fields-to-fix** = admin-marked verification fields requiring resubmission. **DocumentReview** = per-document approve/reject row. **RecentSearch** = deduped passenger search history. **MSR-** = booking ref, **TKT-** = ticket ref.

---

*Maintain this file: when you add a feature, change an option, add a migration, or make a decision, update the relevant section above in the same PR.*
