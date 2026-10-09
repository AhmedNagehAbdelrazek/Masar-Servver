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

## Notes / gotchas

- Prisma 7 needs a driver adapter (`@prisma/adapter-pg`); `pg` NUMERIC arrives as
  string — convert to number at serialization (Express did this via `pg` type parser).
- `RecentSearch` table is literally `recent_search` (singular) — preserved.
- `TripStop`/`TripSeat`/`TripLocation`/`Rating`/`DelayEvent`/`Message`/`SosEvent`/
  `Notification`/`Favorite*`/`VerificationStatusChange` have **no** `updatedat`
  (Sequelize `updatedAt: false`) — schema models this; do not add `@updatedAt`.
- `REDIS_PORT` default is `6380` in this codebase (not the usual 6379).
- `MAPS_MOCK=true` default — no provider calls until billing is enabled.
