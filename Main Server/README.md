# Masar API Server (`@workspace/api-server`)

Node.js backend for the Masar ride-sharing platform. Serves the REST API and
the realtime (Socket.IO) layer used by the mobile/web clients.

## Tech Stack

| Concern | Choice |
| --- | --- |
| Runtime / framework | Node.js (CommonJS), Express 5 |
| Database | PostgreSQL via Sequelize 6 |
| Realtime | Socket.IO 4 + `@socket.io/redis-adapter` (multi-instance scale-out) |
| Cache / presence / locks | Redis (`ioredis`) |
| Auth | JWT access tokens, bcrypt password hashing, OTP service |
| Validation | `express-validator` |
| Security | `helmet`, CORS, role guards, socket auth middleware |
| Uploads | Cloudinary / local disk / S3 (switchable via `UPLOAD_PROVIDER`) |
| Notifications | FCM server key + SMS provider (Twilio or console log) |
| Scheduled jobs | `node-cron` in a dedicated worker thread with catch-up recovery |
| Audit trail | Ships write-request audit events to the sidecar `audit-server` collector |
| Tests | Jest (+ Supertest, socket.io-client) |

## Getting Started

```bash
pnpm install                 # install dependencies

cp .env.example .env         # then fill in values (see below)

pnpm run db:init             # initialize migrations table
pnpm run db:migrate          # run migrations (creates schema)
pnpm run seed                # seed admin user (also runs automatically on boot)
pnpm run dev                 # start dev server (nodemon) on PORT (default 3000)
```

Production: `pnpm start` — boots DB init, admin seed, mock-data seed guard,
cron jobs, HTTP server and Socket.IO server on a single port.

### Docker

From the repository root:

```bash
docker compose up --build
```

Brings up Postgres (`db`), Redis, the audit collector (`audit-collector`, port
4000 internal) and this API (`main-server`, port 8000, healthcheck at
`/api/healthz`). Uploads persist in the `main_uploads` volume.

## Environment Variables

See `.env.example` for the full annotated list. Key groups:

- **Server** – `PORT`, `NODE_ENV`
- **Localization** – `APP_LOCALE` (`ar` | `en` | `both`), per-request override
  via `?lang=` or `Accept-Language`; message catalogs in `config/messages/`
- **Database** – `DATABASE_URL` or discrete `DB_USERNAME` / `DB_PASSWORD` /
  `DB_NAME` / `DB_HOST` / `DB_PORT`
- **JWT** – `JWT_SECRET`, `JWT_EXPIRY`, `SALT_ROUNDS`
- **Redis** – `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Uploads** – `UPLOAD_PROVIDER` (`cloudinary` | `local` | `s3`) plus the
  matching provider block; local files are served from `/uploads`
- **Notifications** – `SMS_PROVIDER` (`twilio` | `log`), Twilio creds,
  `FCM_SERVER_KEY`
- **Jobs** – cron expressions per job (`JOB_EXPIRY_SWEEP_CRON`,
  `JOB_REMINDER_CRON`, `JOB_LOW_BALANCE_WARNING_CRON`), optional
  `JOB_TIMEZONE`, catch-up tuning, `JOBS_INLINE=1` to disable the worker thread
- **Audit** – `AUDIT_COLLECTOR_URL` (sidecar audit collector base URL)
- **Tracking** – `SOCKET_TRACKING_BASE_URL`

## Project Structure

```
app.js               Express app factory (middleware chain, route mounting)
server.js            Boot sequence: DB init → seeds → jobs → http+socket listen
socketServer.js      Socket.IO setup: JWT handshake auth, Redis adapter, rooms
config/              database, redis, cloudinary, audit client, constants, i18n messages
Routes/              Express routers mounted under /api (see index.js)
Controllers/         Request/response handlers
Services/            Business logic (trips, bookings, subscriptions, SOS, …)
Models/              Sequelize models (User, Trip, RideRequest, Booking, …)
middlewares/         protect (JWT), roleGuard, validators, uploads, socketAuth, error handler
sockets/             Per-feature socket modules (chat, tracking, sos, …)
jobs/                Cron jobs + worker-thread scheduler with missed-run catch-up
migrations/          Sequelize migrations + generator scripts
utils/, scripts/, seed.js, seed-mock.js
tests/               Jest unit / integration / contract suites
docs/                Feature specs and API guides (auth, driver flows, realtime, …)
postman/             Postman collections
uploads/             Local upload storage (served statically at /uploads)
```

## API Surface

All routes are mounted under `/api` by `Routes/index.js`:

| Mount | Router | Area |
| --- | --- | --- |
| `/api/healthz`, `/api/health` | health / realtimeHealth | Liveness & realtime metrics |
| `/api/auth` | authRoutes | Register, login, OTP, tokens |
| `/api/trips` | tripRoutes, seatLockRoutes | Trips, stops, seat locking |
| `/api/driver`, `/api/driver/dashboard` | driverRoutes, dashboardRoutes, driverVerificationRoutes | Driver profile, earnings, verification |
| `/api/bookings`, `/api/ride-requests`, `/api/offers` | booking / rideRequest / offers routes | Passenger ride flow |
| `/api/plans`, `/api/subscriptions`, `/api/payment-methods` | plan / subscription / paymentMethod routes | Driver subscription plans |
| `/api/admin`, `/api/admin/verification` | adminSubscription / adminModeration / adminVerification / sos routes | Admin moderation & approvals |
| `/api/vehicles` | vehicleRoutes | Driver vehicles |
| `/api/chat` | chatRoutes | Trip chat |
| `/api/notifications`, `/api/settings/notifications` | notification / notificationSetting routes | Push notifications & preferences |
| `/api/profile/passenger` | profileRoutes | Passenger profile & personal data |
| `/api/ratings`, `/api/complaints`, `/api/support-tickets`, `/api/favorites` | respective routers | Feedback & support |
| `/api/upload` | uploadRoutes | Image upload (provider abstraction) |

Detailed per-feature docs live in [`docs/`](./docs) (e.g.
`API_AUTH_GUIDE.md`, `Driver_Home_Screen_API.md`, `subscriptions_api.md`,
`Realtime_Events.md`).

## Realtime (Socket.IO)

- Handshake requires an `access` JWT: `socket.handshake.auth.token`;
  unauthenticated sockets are rejected before handlers register
  (`middlewares/socketAuth.js`).
- On connect each socket joins `user:<id>` and `role:<role>` rooms; connection
  state recovery is enabled for reconnects within 2 minutes.
- Redis pub/sub adapter fans events out across multiple instances.
- Feature modules registered per connection: `chatSocket`,
  `notificationSocket`, `sosSocket`, `trackingSocket`, `presenceSocket`,
  `enforcementSocket`, `adminSocket`.
- Server can force-disconnect all of a user's sockets (logout / ban) via
  `disconnectUserSockets()` emitting `force_disconnect`.
- Client integration guides: `docs/Flutter_Socket_IO_Integration_Guide.md`,
  `docs/Flutter_Socket_Simple_Guide.md`.

## Background Jobs

Started by `startJobs()` after boot (`jobs/index.js`). Jobs execute in a
worker thread (`worker.js`); missed runs while the process was down are caught
up on startup (bounded by `JOB_MAX_CATCH_UP`). Set `JOBS_INLINE=1` to run them
in-process instead.

- `expirySweepJob` – expire stale trips/subscriptions (`JOB_EXPIRY_SWEEP_CRON`)
- `expiryReminderJob` – upcoming-expiry reminders (`JOB_REMINDER_CRON`)
- `lowBalanceWarningJob` – driver balance warnings (`JOB_LOW_BALANCE_WARNING_CRON`)
- `sosEscalationJob` – escalate unanswered SOS events
- `dataRetentionJob` – purge data past retention window

## Testing

```bash
pnpm test              # full Jest suite
pnpm run test:unit     # unit tests only
pnpm run test:integration
pnpm run test:contract
pnpm run test:coverage
```
