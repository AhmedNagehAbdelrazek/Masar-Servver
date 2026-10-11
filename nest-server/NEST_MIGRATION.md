# Nest.js Migration — Status & Tracker

Parallel port of `Main Server/` (Express 5 + Sequelize 6) to Nest 12 + Prisma 7.
Express stays live on `PORT=3000`; Nest defaults to `PORT=3001`.
`audit-server/` is out of scope (consumed as-is).

## Run

```bash
cd nest-server
cp .env.example .env          # set DATABASE_URL, JWT_SECRET
pnpm install
npx prisma generate
npx prisma migrate dev --name baseline   # staging first; diff vs prod before deploy
pnpm run start:dev
```

Health: `GET /api/healthz`, `GET /api/health/realtime` (public). Swagger: `/docs`.

## Done

- [x] Wave 0: test foundation — `app_db_test` + baseline migration applied,
  `src/test/` harness (`test-app` with `ioredis-mock` override, `db.resetTestState`,
  `jwt` factory, `.env.test`), serial e2e config, locale/pagination unit specs
- [x] Wave 1: leaf modules fully ported with 1:1 tests (73 e2e + 5 unit green):
  upload (5), plans + payment-methods incl. both `/api/*` and `/api/admin/*` mounts (29),
  ratings incl. `GET /driver/ratings` (10), complaints incl. driver + admin endpoints (15),
  favorites (11), health (3)
- [x] Wave 2: identity backbone with 1:1 tests (62 e2e):
  notifications incl. settings + grouped screen (14), full auth incl. OTP/
  password flows + driver/vehicle/passenger onboarding (36), passenger profile
  incl. account summary (12; /home deferred to Wave 4 with homeService)
- [x] Shared providers: BalanceService (ledger rules, FIFO commission, trip
  blocking), OtpService, NotificationSettingsService; message catalogs copied
  verbatim + LocalizeInterceptor/HttpExceptionFilter rendering (ar/en/both),
  ApiValidationPipe 422 envelopes, phone validator + phoneCodes data
- [x] Wave 3: driver surface (207 e2e + 14 unit green): vehicles CRUD, driver
  aggregate + full profile, verification state machine + submit/resubmit +
  admin queue/approve/reject (registered early for resubmit flow; Wave 7 must
  not duplicate), personal-data with verification locks, account status,
  delete-account lifecycle, penalties list (+issue ported, no HTTP until
  Wave 7), earnings (date_trunc raw SQL), lifetime stats, cached dashboard.
  Deferred: driver bookings/offers (Wave 5 with bookingService), driver
  home/subscription (Wave 4 with homeService), driverStats recompute (Wave 7)
- [x] Wave 4: money (242 e2e + 16 unit green): subscriptions (lifecycle,
  resubmit, free one-time rule, queue ordering, renewal merge, pending queue,
  approve/reject with notify), commission service (gating math unit-tested;
  trip-gated HTTP tests land with Wave 5), driver + passenger home, driver
  subscription page, recent-search. Deferred: expiry-sweep test (Wave 7 jobs),
  subscriptionSmoke + commission HTTP tests (Wave 5 trips)
- [x] Scaffold (Nest 12, pnpm, ESM nodenext with `.js` import suffixes)
- [x] `prisma/schema.prisma` — all 34 tables ported from `Models/*.ts` + `migrations/001–032`
  (`createdat`/`updatedat` column mapping preserved, UUID PKs, native enums).
  `npx prisma validate` passes. Baseline migration **not yet applied** — see below.
- [x] Cross-cutting: `HttpExceptionFilter` (error envelope `{status,message,code,details?}`),
  `ResponseInterceptor`, `AuditInterceptor` (skips `GET`/`/health`, no-op without collector env),
  `JwtAuthGuard` (access-only + Redis blacklist) + `RolesGuard` + `@Roles()` + `@CurrentUser()`
  + `@Public()`, `WsJwtGuard` (handshake token, banned/suspended reject),
  `RedisService` (ioredis, `REDIS_PORT` default `6380` like Express), `PrismaService`
  (`@prisma/adapter-pg`, fail-soft without `DATABASE_URL`), pagination + locale utils
  (`ar` default / `en` / `both` via `?lang` or `Accept-Language`)
- [x] `main.ts` chain mirrors `app.ts`: cors → helmet → morgan → json → `/uploads` static →
  `/api` prefix → 404 JSON → filter. Global `ValidationPipe` (whitelist + transform).
- [x] All 21 modules scaffolded with Express route-prefix parity (see table).
  `tsc --noEmit` clean, `nest build` clean, boot verified (`healthz` 200, guarded routes 401/404).
- [x] `RealtimeGateway` shell (rooms `user:{id}`/`role:{role}`/`trip:{id}`, `tracking:join`);
  `JobsService` shell with all 9 cron schedules (test-env skip).

## Module parity (shell = routes TODO, logic TODO)

| Nest module | Express source | Route prefix |
|---|---|---|
| auth | Routes/authRoutes.ts, Services/authService.ts (799l) | `/api/auth` (me/logout guarded, rest public) |
| health | healthRoutes + realtimeHealthRoutes | `/api/healthz`, `/api/health/realtime` |
| trips | tripRoutes + seatLockRoutes, tripService (1778l) | `/api/trips` |
| bookings | bookingRoutes, bookingService (990l) | `/api/bookings` |
| ride-requests | rideRequestRoutes + offersRoutes | `/api/ride-requests` (+ `/api/offers` TODO) |
| maps | mapsRoutes.ts (`route-preview` + `reverse-geocode`, 30/min Redis limit) | `/api/maps` |
| chat | chatRoutes | `/api/chat` |
| sos | sosRoutes | `/api/admin/sos` (admin only) |
| notifications | notificationRoutes + notificationSettingRoutes | `/api/notifications` (+ `/api/settings/notifications` TODO) |
| ratings | ratingRoutes | `/api/ratings` |
| complaints | complaintRoutes | `/api/complaints` |
| favorites | favoriteRoutes | `/api/favorites` |
| profile | profileRoutes | `/api/profile/passenger` (passenger only) |
| vehicles | vehicleRoutes | `/api/vehicles` |
| driver | driverRoutes + driverVerificationRoutes + dashboardRoutes | `/api/driver` |
| plans | planRoutes | `/api/plans` |
| payment-methods | paymentMethodRoutes | `/api/payment-methods` |
| subscriptions | subscriptionRoutes + adminSubscriptionRoutes | `/api/subscriptions` |
| support-tickets | supportTicketRoutes | `/api/support-tickets` |
| upload | uploadRoutes (multer 10MB images → s3/cloudinary/local) | `/api/upload` |
| admin | adminDashboard + adminModeration + adminVerification + adminTrip | `/api/admin` |

## Next steps (per module)

1. DTOs ← `Main Server/utils/validators/*` (24 files) with `class-validator`.
2. Service logic ← `Main Server/Services/*`, Sequelize → Prisma
   (`findByPk→findUnique`, `include→include`, transactions → `$transaction`).
3. Split giants: `tripService` → Trips/Stops/Seats/SeatLock; `bookingService` as-is;
   `notificationService` → channels (Twilio/FCM/in-app).
4. Realtime: 7 socket handlers, `@socket.io/redis-adapter` with ioredis pub/sub.
5. Jobs: port bodies from `Main Server/jobs/*` (keep `jobs:lastrun:*` overlap-guard).
6. Tests: `@nestjs/testing` + supertest e2e mirroring `Main Server/tests/*`
   (unit/integration/contract, ≥80% gate, in-memory Redis mock pattern).
7. Cutover: baseline migration on staging copy → row-count check →
   `prisma migrate deploy` → strangler proxy Express→Nest per prefix →
   Postman collection + `docs/Maps_Tracking_Guide.md` re-point → decommission.

## Porting rules (learned)

- Nest defaults `@Post()` to **201**; Express `successResponse` defaults to **200**.
  Every ported POST needs explicit `@HttpCode(200)` unless Express used 201.
- Dynamic `import('cloudinary'/'@aws-sdk/client-s3')` breaks `tsc` (nodenext);
  use static imports — both SDKs are now regular dependencies.
- `TestingModule` comes from `@nestjs/testing`; `createNestApplication<NestExpressApplication>()`
  is required for `useStaticAssets`.
- `ioredis-mock` has no types — shimmed in `src/test/ioredis-mock.d.ts`.
- `filename` is NOT unique on `UploadedImage` — use `findFirst`, not `findUnique`.
- Tests: unit `*.spec.ts` next to source (`vitest.config.ts`); HTTP `test/*.e2e-spec.ts`
  (`vitest.config.e2e.ts`, `fileParallelism: false` — specs share one DB);
  both load `.env.test` (`app_db_test`, `APP_LOCALE=en`).
- Custom class-validator constraints MUST carry `@ValidatorConstraint()` or they
  silently never run (found via free_offer case).
- Cross-field / request-context rules (self-complaint, resolution-required,
  free-offer-required) live in services as 422 `VALIDATION_ERROR` with `details`.
- Required DTO fields get `@IsDefined()` so absent keys 422 like Express `notEmpty`.
- Prisma enum with `@map`: `e_wallet @map("e-wallet")` — convert at service boundary.
- DELETE routes whose Express chain lacks `validate` use plain-string params
  (malformed ids fall through to 404, not 422).
- Verified Express discrepancy (do not copy): `GET /api/plans` excludes free plans
  though `tests/contract/plan.contract.test.js` expects them — that test fails
  against Express itself (11/12). Port asserts actual behavior.
- Verified Express bug (do not copy): `PUT /api/notifications/:id/read` carries a
  stray settings-array validator that 422s every bodyless call — Express fails
  3/6 of its own notification tests. Port omits body validation there.
- Verified Express discrepancy: `GET /api/admin/verification/queue` has no role
  filter, so the admin row appears (Express fails 9/10 of its own test file on
  the length-1 assertion). Port asserts the driver entry explicitly.
- Verified Express contradiction (test wins): the service bans manual free-plan
  subscription, but `subscription.test.js` demands one-time free activation and
  fails 11/12 against Express. Port implements one-time-per-driver free
  activation (422 FREE_PLAN_ALREADY_USED on repeat).
- Prisma `seatNumbers` defaults to `[]` while Sequelize leaves it NULL; the
  `seatNumbersFor` port treats empty arrays as absent (falls through to
  `seatNumber), matching Express in all tested cases.
- Passenger-home `rating` renders null for falsy (0/unset) averages, mirroring
  the Express truthiness check (Prisma defaults disagree with `== null`).
- Pre-home tripExpiry sweeps are skipped (best-effort in Express too);
  tripExpiryService arrives with Wave 5.
- [x] Wave 5.1: trips core (create with balance/free/overlap gates, search with
  Jordan-day + recurrence + time-window logic, detail/options/seats/my-trips/
  attributes/passengers, legacy cancel, atomic seat locks) + contracts
- [x] Wave 5.2: trip lifecycle (start window + balance gate, complete with
  commission/bookings/debt flow, update with overlap recheck + notify,
  penalized cancel with escalation, tripExpiry sweep) + commission +
  subscription-smoke suites
- Verified Express discrepancies (do not copy): trip detail/reveal outsider
  assertions (access check is commented out; service returns 200 with data —
  both details files fail in Express); overlap guard dead with
  TRIP_DURATION_HOURS=0 (3 overlap + 1 lifecycle test fail) — port implements
  the documented 2h window (see trip.constants.ts); smoke no-auth
  payment-methods call (401 vs expected 200).
- Copied data files (`messages/app.ts`, `messages/validation.ts`, `phoneCodes.ts`)
  must have their CommonJS interop footers stripped — they throw under ESM.
- express-validator SKIPS absent fields; class-validator does NOT (absent required
  fields fail). Consequence: Express-optional fields (e.g. login `role`) need
  explicit `@IsOptional()` in DTOs.
- Services return/throw message KEYS; LocalizeInterceptor (success) and
  HttpExceptionFilter (errors, incl. details via tValidation bridge) render them.
- [x] Wave 5.3: maps stack (geo/route/pickup + mapsClient) + booking ops
  (delays, driver/passenger booking lists, reveal) — see plan 013 notes
- [x] Wave 5.4: ride-requests + offers + attach/matches
- [x] Wave 5.5: live tracking gateway (join/start/location/batch/stop,
  heartbeat, proximity once-only alerts) + handshake auth middleware
  (user/role rooms at connect; AppAuthGuard skips non-HTTP contexts)
- [x] Wave 6: comms + safety — chat (booking/support socket handlers +
  REST history, `chat:*` rate limits + typing throttle), SOS (socket trigger
  with reuse-first dedupe, `sos:ack`/`sos:resolved`, admin list/ack/resolve,
  escalation sweep ported for Wave 7 jobs), support-tickets (full CRUD +
  staff status flow + staff in-app notify). Suites: chat 9/9, support-tickets
  20/20, sos 4/4. Full gates: 32 files / 449 e2e + 16 unit green.
- Cycle gotcha: `TrackingService -/-> NotificationsService` must use
  `@Inject(forwardRef(...))` — the eager type evaluated to undefined when a
  spec imports TripsModule first (broke trip-lifecycle standalone/in-suite).
- Test-helper gotcha: compute "today" in Asia/Amman, not UTC — `toISOString()`
  is a day behind 00:00–03:00 Jordan time and makes date=today searches 422
  (fixed in trip-search `jordanDate`).
- [x] Wave 7.1: admin dashboard (`admin-dashboard` module, 19 routes under
  `/api/admin/dashboard`: summary/recent-trips/top-routes/pending-requests/
  latest-complaints, drivers directory + stats, 7 dossier reads, status/
  account/ document mutations, reservations). Suites: admin-dashboard 22/22,
  admin-drivers 25/25.
- [x] Wave 7.2: admin moderation (`admin-moderation` module: `admin/users`
  list/update, `admin/penalties` wired to `PenaltyService.issue()` incl. the
  ends_at cross-field rules, `PUT admin/trips/:id` moderate added to the
  existing controller; `admin/complaints` already covered, not duplicated).
  Suite: admin-moderation 13/13.
- [x] Wave 7.3: gap check — driverBookings, passengerBookingList and
  oneVehicleConstraint were already covered (booking-ops / verification
  specs); added trip-profit (4/4: total_profit, was_available history,
  fare recompute) + adminSubscription gaps (8 tests: masked id, balance
  credit, debt clearing, 409s, adminNotes).
- [x] Wave 7.4: all 9 job bodies ported in `JobsService` (schedules
  unchanged, `NODE_ENV=test` guard kept, `SosService.runEscalation` +
  `DriverStatsService.recomputeAllDrivers()` wired) + expiry-sweep,
  historyJobs, i18n (5/5; bare-`@IsUUID` DTO messages pass through
  untranslated — documented in spec) and full-journey (2/2) suites.
- [x] Wave 8: ratings re-run against the full stack (trips via POST
  /api/trips + seat-lock + bookings) — 10/10.
- Full gates: 39 files / 533 e2e + 34 unit green, `tsc --noEmit` clean.
- [x] Fix wave (post-migration audit): socket gaps closed
  (`notification:read/read_all` + count-on-connect, `enforcement:ack`,
  `admin:ticket_assign/resolve` with staff gate + `admin`/`supportChat`
  rate-limit keys, `force_disconnect` before disconnect, ISO `last_seen`
  everywhere, structured handshake errors incl. `TOKEN_EXPIRED`,
  `skipMiddlewares:false`, `RealtimeMetricsService` + live
  `GET /health/realtime` snapshot, clear-and-reschedule offline timer).
  Money races closed (`withSerializableRetry` serializable txns +
  conditional claims on approve/complete/cancel/booking/seats, free-plan
  history check across all statuses, atomic complete/cancel orchestration,
  notify-after-commit, booking push channels + driver vars restored,
  NULL `wasLate` counts on-time, deterministic renewal order, boolean
  `active` filter). Guards + upload now throw catalog keys (AR verified);
  9 missing catalog entries added; booking-code exhaustion is 503;
  config failures fail fast at bootstrap; dead scaffolds
  (`AppController`, `AdminModule`) removed; JSON 404 envelope;
  `/dist` untracked via `.gitignore`; `seat_numbers` `@ArrayMinSize(1)`.
- Prod-boot gotcha: ESM `design:paramtypes` evaluates eagerly — any
  constructor type inside an import cycle TDZ-crashes `node dist/main`
  (vitest masks it). Fixed with `import type` + `*Token` value aliases for
  forwardRef in the realtime SCC (gateway/tracking/chat/sos/
  notifications/presence/in-app-channel) and the trips SCC
  (trips/trip-expiry). `node dist/main` boots past DI init.
- `completeTrip` ordering: commission (with trip-blocking) runs BEFORE the
  completed-claim inside the tx, matching Express — otherwise the completed
  trip drops out of the blocking filter and `isBlockedByBalance` stays false.
- Post-fix verification follow-ups: NULL `wasLate` counts on-time in all
  three punctuality paths (driver-stats, driver-profile, ratings);
  `cancelBooking` + plain `cancelTrip` use serializable retry with
  conditional claims (`BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED` /
  `ALREADY_CANCELLED` on 0-row claim); `ResolveComplaintDto` params have
  `@IsDefined()`; `dist/` is fully untracked (index clean, ignored, rebuilt
  by `nest build`); handshake `authError` reasons stay English by design
  (wire message is the code, matching Express `socketAck.authError`).
- Full gates after fixes: 40 files / 555 e2e + 36 unit green, `tsc` clean,
  `node dist/main` boots past DI init.

## Notes / gotchas

- Prisma 7 needs a driver adapter (`@prisma/adapter-pg`); `pg` NUMERIC arrives as
  string — convert to number at serialization (Express did this via `pg` type parser).
- `RecentSearch` table is literally `recent_search` (singular) — preserved.
- `TripStop`/`TripSeat`/`TripLocation`/`Rating`/`DelayEvent`/`Message`/`SosEvent`/
  `Notification`/`Favorite*`/`VerificationStatusChange` have **no** `updatedat`
  (Sequelize `updatedAt: false`) — schema models this; do not add `@updatedAt`.
- `REDIS_PORT` default is `6380` in this codebase (not the usual 6379).
- `MAPS_MOCK=true` default — no provider calls until billing is enabled.
- Hygiene pass (guards/catalog/404/scaffolds, spec 013 follow-up):
  1. Guards throw catalog KEYS as `message` (codes unchanged): `JwtAuthGuard`
     (`AUTH_NO_TOKEN`, `AUTH_TOKEN_EXPIRED`/`AUTH_INVALID_TOKEN`,
     `AUTH_INVALID_TOKEN_TYPE`, `AUTH_TOKEN_REVOKED`), `RolesGuard`
     (`AUTH_REQUIRED`, `AUTH_INSUFFICIENT_ROLE`), `WsJwtGuard` (messages now
     `AUTH_REQUIRED`, `AUTH_TOKEN_EXPIRED`/`AUTH_INVALID_TOKEN`,
     `INVALID_TOKEN_TYPE`, `AUTH_TOKEN_REVOKED`, `USER_NOT_FOUND`,
     `ACCOUNT_HAS_BEEN_SUSPENDED`; WS `code` fields kept as-is). HTTP guard
     errors now localize via `HttpExceptionFilter` (`?lang=ar` verified).
  2. Catalog grew 9 entries (`messages/app.ts`, "Booking edits / tracking /
     upload / rate limits"): `PICKUP_POINT_NOT_ON_TRIP` (Nest addition —
     Express throws it via `ApiErrors.custom` with no catalog entry, wire
     shows the raw key; EN/AR follows the `DROP_OFF_POINT_NOT_ON_TRIP`
     pattern), `YOU_CAN_ONLY_EDIT_YOUR_OWN_BOOKINGS`,
     `BOOKING_IS_NOT_CONFIRMED`, `PICKUP_EDIT_CUTOFF_PASSED`,
     `LOCATION_POINT_TOO_OLD` (verbatim Express copies), `RATE_LIMITED`
     (mirrors `socketAck.rateLimited()` default text), `INVALID_FILE_TYPE` /
     `FILE_TOO_LARGE` (fallbacks so a bare code still localizes),
     `PICKUP_STOP_ID_MUST_BE_A_VALID_UUID` (verbatim Express
     `validation.ts`). Dead duplicates `PLATE_ALREADY_IN_USE` /
     `PLATE_NUMBER_ALREADY_IN_USE` and `FILE_TOO_LARGE_10MB` kept as-is (no
     dead-code deletion — both still referenced).
  3. Upload parity: controller/service throw `NO_FILE_UPLOADED`/`BAD_REQUEST`,
     `ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED`/`INVALID_FILE_TYPE`
     (matches `uploadMiddleware.ts` fileFilter), `FILE_TOO_LARGE_10MB`/
     `FILE_TOO_LARGE` (matches `globalErrorHandler.ts` multer branch).
  4. `uniqueBookingCode` exhaustion is now 503 `ServiceUnavailableException`
     with message+code `COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE`
     (deliberate deviation: Express `ApiErrors.serverError` → 500/
     `INTERNAL_ERROR`). Twin copies in `ride-requests.service.ts` /
     `support-tickets.service.ts` left untouched (out of scope).
  5. Config fails at startup, not per-request: `UploadService.onModuleInit`
     validates `UPLOAD_PROVIDER` (+ S3 env via `assertS3Configured`) and
     `MapsClient.onModuleInit` runs `getMapsConfig()`, both with
     `Logger.error` context before rethrowing. `S3Uploader` constructor keeps
     its check via the shared assert (per-request safety net).
  6. Deleted dead scaffolds `src/app.controller.ts` / `src/app.service.ts`
     (Hello World) and the empty `src/modules/admin/` stub
     (controller+service+module); `AppModule` no longer references
     `AppService`/`AdminModule`. Real admin surface lives in
     `admin-dashboard` / `admin-moderation` modules.
  7. Unknown routes return the Express 404 envelope (`{status:'error',
     message:'Route <METHOD> <url> not found', code:'ROUTE_NOT_FOUND'}`),
     rendered in `HttpExceptionFilter` for codeless 404s (Nest's router 404
     handler runs before any user middleware, so a post-init `app.use`
     404 can never fire — first attempt reverted). Express uses the same raw
     template (no catalog key), so no `?lang` localization here either.
  8. `/dist` added to `nest-server/.gitignore`; tracked build output
     unstaged via `git rm -r --cached dist` (709 files, worktree kept, build
     regenerates). `node dist/main` boot fails on a pre-existing ESM
     circular-import (`SosService` ↔ `RealtimeGateway`, fails identically on
     pristine HEAD); e2e boot via vitest is unaffected.
  9. `SosController.listSos` passes the real `@CurrentUser()` through to
     `listAdmin` (was a hardcoded `{id:'', role:'admin'}`).
  10. `CreateBookingDto.seat_numbers` gained `@ArrayMinSize(1)` (matches
      Express `isArray({min:1})` + `exists`); complaint DTO required fields
      (`accused_id`, `category`, `description`) gained `@IsDefined()` per
      repo convention. `POST /favorites/routes` stays 201 — verified Express
      `favoriteController.addFavoriteRoute` uses `successResponse(..., 201)`;
      `POST /favorites/drivers` stays 200 (Express default). No deviation:
      absent-field behavior already 422 on both sides (express-validator runs
      non-optional chains on `undefined`; only the message text differs —
      class-validator defaults vs catalog keys, documented in the i18n spec).
