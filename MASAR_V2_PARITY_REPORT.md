# Masar API Parity Report — Express V1 vs NestJS V2

**Date:** 2026-10-27/28 · **Method:** full differential replay of the Postman collection *"Masar API"*
(206 unique requests) against both live deployments, per-role tokens, normalized body/id
substitution, then status-code + envelope (`code`) + body-shape comparison.

| Target | Base URL |
| --- | --- |
| V1 (Express, reference) | `https://masarcar.tech/api/v1` |
| V2 (NestJS, candidate) | `https://v2.masarcar.tech/api/v2` |

**Raw evidence:** `Temp\opencode\masar-diff\results3.json` (final pass), `results.json`/`results2.json`
(earlier passes), `progress*.jsonl`, runner scripts `run.mjs`/`run2.mjs`/`run3.mjs`.

> **Update 2026-10-28 — fixes applied.** The V2 500s, the V1 500s, the systemic error-code
> drift, the validation-envelope/ordering diffs, the `auth/me` casting drift and the V1
> malformed-JSON message have been fixed. A local differential re-run of the same 206
> requests (both servers rebuilt from this repo, same DB) now yields **167 MATCH**, with
> every remaining difference accounted for by (a) the 31 V2-only endpoints in §4, (b)
> intentional additive fields asserted by V2's own tests, or (c) shared-DB ordering
> artifacts. See **§10 Fix log** for per-item detail.

**Overall (run 3):**

| Verdict | Count | Meaning |
| --- | --- | --- |
| MATCH | 88 | identical status + code + shape |
| CODE_MISMATCH | 82 | same HTTP status, different `code` field (mostly systemic error-code drift) |
| SHAPE_MISMATCH | 7 | same 200/422, different payload shape |
| STATUS_MISMATCH | 26 | different HTTP status (!) |
| MESSAGE_MISMATCH | 2 | same code, different human message |
| TOP_KEYS_MISMATCH | 1 | 422 with different top-level keys |

Most CODE_MISMATCHes are **one systemic contract difference** (see §1), not 82 individual bugs.

Auth itself is compatible: login/refresh/me/logout all work identically with the same seeded
accounts (`admin +962700000099`, driver/passenger `Test@1234`), and the JWT format
(`{id, role, type:'access'}`, shared secret) is verified equivalent.

---

## 1. Systemic error-code drift (V2 vs V1) — highest impact, ~80 endpoints

Same HTTP status, but V2 returns **different `code` values** than V1. Any client that branches on
`code` breaks when pointed at V2.

| Scenario | V1 (Express) | V2 (Nest) |
| --- | --- | --- |
| Role denial (403) | `FORBIDDEN` | `AUTH_INSUFFICIENT_ROLE` (11 endpoints) |
| Generic 404 | `NOT_FOUND` | `*_NOT_FOUND` verbatim (`TRIP_NOT_FOUND`, `DRIVER_NOT_FOUND`, `BOOKING_NOT_FOUND`, `RIDE_REQUEST_NOT_FOUND`, `VEHICLE_NOT_FOUND`, `SOS_EVENT_NOT_FOUND`, ...) (~60 endpoints) |
| Missing route (404) | `ROUTE_NOT_FOUND` | resource-specific `*_NOT_FOUND` (audit: V1 says route missing while V2 answers "entity not found") |
| Bad token (401) | `UNAUTHORIZED` | `AUTH_INVALID_TOKEN` |
| Token revoked (401) | `UNAUTHORIZED` | `AUTH_TOKEN_REVOKED` |
| Malformed JSON (400) | `BAD_REQUEST` + Arabic internal-error text `خطأ داخلي في الخادم` | `BAD_REQUEST` + English parser internals (`Unexpected number in JSON at position 123`) |
| Validation (422) | `VALIDATION_ERROR` (Arabic detail messages) | `VALIDATION_ERROR` (mixed Arabic/English detail messages) |

Example (same request, real trip id):

```
PUT /trips/<id>/seats/lock/2  (no lock)
V1 → 404 {"code":"NOT_FOUND","message":"انتهت صلاحية الحجز المؤقت للمقعد أو أنه غير موجود"}
V2 → 404 {"code":"SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST","message":"انتهت صلاحية الحجز المؤقت للمقعد أو أنه غير موجود"}
```

**Fix direction (V2):** map Nest exceptions back to the V1 ApiError codes (`NOT_FOUND`,
`FORBIDDEN`, `UNAUTHORIZED`, `ROUTE_NOT_FOUND`) or freeze the newer V2 codes and republish them as
the contract — either way, both servers must emit identical `code` per scenario.

**Message language (systemic):** V1 emits Arabic everywhere; V2 is inconsistent — some messages
Arabic (login 403, seat lock), some English (validation details, `SURVEILANCE`-style parse errors,
`IsInEnum` DTO messages). Pick one locale strategy (start: frontends parse `code`, keep Arabic).

---

## 2. V2 (Nest) returns 500 where V1 succeeds — V2 bugs to fix first

1. **`GET /trips/driver/my-trips` & `GET /trips/driver/my-trips?status=published`** → `500 INTERNAL_ERROR` (V1: 200 with `{"trips":[...]}`).
   Repro:
   ```
   curl https://v2.masarcar.tech/api/v2/trips/driver/my-trips -H "Authorization: Bearer <driver token>"
   ```
   Service code `nest-server/src/modules/trips/trips.service.ts getDriverTrips()` looks safe — crash
   is in the data/serialization layer (e.g. Prisma row/relational include of `seats`/`stops`, or a
   null in a column Prisma declares non-nullable). V1 (same DB, same rows) serializes fine.
2. **`POST /trips/:trip_id/seats/lock`** → `500 INTERNAL_ERROR` on a **valid published trip** (V1: `200
   {"lock_id":"...:2","seat_number":2,"expires_in":300,...}`). Confirmed twice:
   with `52a63d2d-2c71-4b55-9e01-f59b79c8bdb6` (published trip owned by d1) + body `{"seat_number":2}`
   as passenger. Repro:
   ```
   curl -X POST https://v2.masarcar.tech/api/v2/trips/52a63d2d-.../seats/lock \
        -H "Authorization: Bearer <passenger token>" -H "Content-Type: application/json" \
        -d '{"seat_number":2}'
   ```
3. *(run-1 evidence, same inputs)* earlier pass confirmed the same two crashes with another real
   published trip `b64596cf-...`.

## 3. V1 (Express) returns 500 where V2 succeeds — V1 bugs to fix

1. **`GET /driver/stats`** → `500 INTERNAL_ERROR` (V2: 200 with `{"stats":{...}}`).
   Repro: `curl https://masarcar.tech/api/v1/driver/stats -H "Authorization: Bearer <driver token>"`.
   Route exists in the repo (`Routes/driverRoutes.ts:34`) → handler/DB issue in deployment, probably
   schema drift or bad JOIN (server prints one Arabic internal-error message).
2. **`GET /driver/profile/full`** → `500 INTERNAL_ERROR` (V2: 200 full profile incl. vehicle).
   Route exists (`driverRoutes.ts:40`).
3. **`PUT /driver/verification`** → `500 INTERNAL_ERROR` when submitted document ids don't exist
   (V2 correctly returns `422 VALIDATION_ERROR ... uploaded_documents ids do not exist`).
   Any future submit that hits this branch 500s on V1.
4. **`PUT /ride-requests/:id` with malformed JSON** → V1 answers `400 {code:"BAD_REQUEST",
   message:"خطأ داخلي في الخادم"}`; V2 answers a clean JSON-parse error. V1 masks a client 400 as an
   "internal error". (Also: the collection example for this request is itself missing a comma.)
5. **`POST /auth/register/phone` with an already-registered phone** → V1 returns
   `422 VALIDATION_ERROR details:[{message:"Cannot read properties of undefined (reading 'find')"}]`
   — an **exception leaked through the validator**; V2 correctly answers `409 CONFLICT
   {"code":"CONFLICT","message":"رقم الهاتف مسجل بالفعل"}`.

---

## 4. Endpoints that exist only on V2 — 31 requests across 8 admin modules

**Decision (2026-10-28): accepted as V2-only.** V2 is a superset; the Express server will not
gain these routes. They remain the only expected 404-on-V1 differences in the differential run.

V1 answers **`404 ROUTE_NOT_FOUND`** (route absent from Express — confirmed against the repo:
only `adminTripRoutes`/`adminDashboardRoutes` are mounted for those URL families). V2 serves them.
Decide: port to V1 (Feature 011/013 parity) or officially mark V2-only.

| Module | URLs | V2 |
| --- | --- | --- |
| Passenger management | `GET /admin/passengers` · `GET/…/:id` · `/:id/bookings` `/:id/trip-requests` `/:id/complaints?direction` `/:id/account-log` `/:id/ratings?direction` · `POST …/warnings` `…/suspensions/temporary|permanent` `…/notifications` · `GET /admin/passengers/stats` `…/export` | works (422/404 on synthetic IDs = route exists) |
| Booking management | `GET /admin/bookings` (`?search&status&from&to&page&limit`) · `GET /admin/bookings/:id` · `POST …/cancel` · `GET /admin/bookings/stats` | works |
| Ride requests | `GET /admin/ride-requests` · `GET …/:id` · `GET …/stats` | works |
| Conversations | `GET /admin/conversations?type=trip` · `GET …/trip/:id` · `GET …/stats` · `POST …/trip/:id/penalties` | works |
| Arbitration extra | `GET /admin/complaints/:id` partially missing — **`GET /admin/complaints/:id` route missing on V1** and `POST /admin/complaints/:id/penalties` | works |
| Subscription mgmt extras | `GET /admin/subscriptions/:id` · `GET /admin/subscriptions/stats` · `GET/PUT /admin/plans/free` (PUT matches, see §5) | works |
| Driver actions extra | `POST /admin/dashboard/drivers/:driver_id/notifications` | works (422 on synthetic id) |
| Passengers export | `GET /admin/passengers/export` | works |

Everything else admin-side (verification queue approve/reject, dashboard drivers dossier,
reservations, SOS, top-routes, moderation PUTs, penalties POST `/admin/penalties`) matches.

## 5. Behavior / validation divergences on shared endpoints

| Endpoint | V1 | V2 | Issue |
| --- | --- | --- | --- |
| `POST /trips` (create) | 422 `departure_time must be in the future` | 422 same (after fix) | **Fixed** — V2 now validates departure in the DTO before business rules, like V1's express-validator. |
| `POST /subscriptions` (driver) | 422 `screenshot_id` required + must be a valid uploaded image id | 422 `screenshot_id` required-style errors | **Not a real gap:** V2 does check `uploadedImage` existence in the service. The observed diff came from the runner substituting an empty placeholder (`""` → V2 `0`), so V1 emitted two messages and V2 one. |
| `PUT /admin/plans/free` | 422 because V1 routes it to `PUT /admin/plans/:plan_id` (`plan_id="free"`) | 422 `free_offer` rule | **V1 has no `/admin/plans/free` route** — belongs with §4. |
| `POST /admin/dashboard/drivers/:id/status` / `…/account-status` | 409 `DRIVER_ALREADY_IN_STATE` on repeat | 409 same | **Identical.** The run-3 200/409 pair is a shared-DB ordering artifact (V1 mutates first, V2 sees the new state). |
| `PUT /trips/:trip_id` (edit) | 422 (validates body first) | 422 same (after fix) | **Fixed** by the DTO future-departure validator. |
| `DELETE /favorites/drivers/:driver_id` | 404 when not favorited | 404 when not favorited | **Identical.** The run-3 200/404 pair is the shared-DB ordering artifact (V1 deleted the row first). |
| `GET /trips/:id/seats/lock…` release | `code`: `NOT_FOUND` | `NOT_FOUND` (after fix) | Fixed by the error-code mapping. |

## 6. 200/422 payload-shape drift on shared endpoints (V2 adds/changes fields)

| Endpoint | Difference |
| --- | --- |
| `GET /auth/me` | V1 returns `age:"28"` (string) and `avgRating:"5.0"` (string); V2 returns numbers `28` and `5`. Clients doing `Number(x)` are fine; clients doing `x.toFixed(1)` break. |
| `POST /ride-requests` | V1: `passenger_name:null`, `passenger_phone_masked:null`; V2: `"Ahmad Masar"`, `"+96278***0001"` in the create response |
| `GET /admin/complaints` | V2 adds `reporter_role`, `accused_role`, `trip_id` per row |
| `GET /admin/plans` | V2 adds `active_subscribers` per plan |
| `GET /admin/dashboard/summary` | V2 `kpis` adds `bookings_today`, `trips_today`, `total_passengers`, `pending_payments`, `new_ride_requests` |
| `POST /complaints` | same body → V1 `already_filed:false` vs V2 `already_filed:true` after the first insert on shared DB (re-run effect; *likely* fine, but verify the duplicate-detection semantics per server) |

## 7. Endpoints that agreed (quick reference)

`/auth/*` login–refresh–me–logout–change-password–forgot flows, registration token flows (excluding
SMS-only paths), `/upload`, `/admin/verification/*` queue+approve+reject, all Admin Dashboard drivers
dossier + stats/summary/top-routes/pending-requests/latest-complaints/reservations/recent-trips, SOS
list, `PUT /admin/complaints/:id`, `POST /admin/penalties`, `PUT /admin/users/:id`, `GET /admin/users`,
`/driver/home`, `/driver/bookings`, `/driver/ratings`, `/driver/penalties`, `/driver/complaints`,
`/driver/offers`, `/driver/subscription`, `/driver/dashboard`, `/vehicles`, `/ratings`,
`/favorites/routes`, `/settings/notifications`, notification list/read/unread, support tickets
approximate equality, `/maps/route-preview`, `/maps/reverse-geocode`, trip discovery search/details
options/attributes/empty-seats/seats, `/chat/*`, `/healthz`, `/health/realtime`.

(Exact per-endpoint evidence: `results3.json`.)

---

## 8. Fidelity caveats of this test run

- SMS-gated flows (`register → verify-otp → password`, `forgot-password` full chain, resend-otp) were
  **not** executed end-to-end (only validation/duplicate-phone/invalid-token branches) to avoid
  sending real SMS. Register-OTP: token flows return identical envelopes.
- Destructive endpoints (trips cancel/start/complete/delete, admin approve/reject, seat-manager ops,
  user status changes, plan/payment-method create/delete) were mostly run against **synthetic UUIDs**
  to protect data; both servers exercised their same validation/not-found paths.
  `POST /admin/dashboard/drivers/:id/status|account-status` and `PUT /admin/users/:id` were therefore
  exercised only on an already-suspended mock driver/user (`b40ad240`, `e1e2a889`).
- Findings in §2-§3 used **real seeded state** (d1 driver + his published trip) and were verified
  manually afterwards; the seat lock was released (`200 … تم تحرير الحجز المؤقت للمقعد`).
  Driver/passenger statuses were restored to `active`/pre-run states.
- The shape-compare treats arrays as first-element shapes; count/count fields of lists weren’t
  compared (data changes between calls are expected on a live server).

## 9. Suggested fix order

1. **V2 emergency:** 500 on `my-trips`; 500 on seat-lock. (§2)
2. **V1 emergency:** 500s on `/driver/stats`, `/driver/profile/full`, `/driver/verification`; register/phone validator crash. (§3)
3. V2 error-code mapping to V1 codes (§1) — single middleware change, kills ~80 reported mismatches.
4. Decide + implement/announce the V2-only admin modules on V1 (§4) — that’s a feature-parity decision, not a bug.
5. Align validation policies (§5) and 200-shape casting (§6).

---

## 10. Fix log (2026-10-28)

### 10.1 V2 (NestJS) � fixed

| # | Problem | Fix |
| --- | --- | --- |
| 1 | `trip_seats.createdat` column mapping did not exist in the Sequelize-owned DB ? **every** endpoint reading `tripSeat` 500'd (`GET /trips/driver/my-trips`, `POST /trips/:id/seats/lock`, `GET /trips/:id/seats`, `GET /trips/:id/empty-seats`, `GET /trips/:id`, options). Confirmed stack trace: `PrismaClientKnownRequestError: The column trip_seats.createdat does not exist`. | `nest-server/prisma/schema.prisma` � `TripSeat.createdAt` maps to `created_at` (the only table using snake_case; verified all 34 models against `information_schema`, zero remaining mismatches). |
| 2 | 82 endpoints returned a different `code` for the same HTTP status. | `common/filters/http-exception.filter.ts` � normalize to the Express contract: all 401 ? `UNAUTHORIZED`; 403 `AUTH_*` ? `FORBIDDEN`; 404 `*_NOT_FOUND` (and the seat-lock release code) ? `NOT_FOUND`. V1's explicit codes (`FIELD_LOCKED`, `SEAT_LOCK_EXPIRED`, `NO_PENDING_DELETION_REQUEST`, �) are preserved. |
| 3 | `POST /trips` returned the specific rule key as `code` (e.g. `SEAT_COUNT_DOES_NOT_MATCH_VEHICLE_TOTAL_SEATS`) and checked seats before departure, while V1 returns `VALIDATION_ERROR` and rejects a past `departure_time` first. | `trips.service.ts` � service-level validation always emits `code: VALIDATION_ERROR`; departure check moved ahead of seat rules. `create-trip.dto.ts` � added `@IsFutureDateTime()` on create/update `departure_time`, so `PUT /trips/:id` also returns 422 before the 404 lookup. |
| 4 | Not-found messages were English literals in several modules (`Booking not found`, `Plan not found`, `Payment method not found`, `Complaint not found`, `Favorite driver/route not found`, `Driver not found`). | Replaced with the existing i18n catalog keys, so the wire message matches V1 (Arabic by default). |
| 5 | `PUT /driver/verification` returned 422 with a `details` array; V1 returns a plain message. | `driver-verification.service.ts` � throw `VALIDATION_ERROR` with the catalog key, no details. |
| 6 | Malformed JSON returned the raw parser message (`Unexpected number in JSON at position 123`). | `INVALID_JSON_BODY` catalog key in both servers; both now return `400 {code:'BAD_REQUEST', message:'???? ????? ??? ?????'}`. |

### 10.2 V1 (Express) � fixed

| # | Problem | Fix |
| --- | --- | --- |
| 1 | `GET /driver/stats` and `GET /driver/profile/full` 500'd: `ReferenceError: fn is not defined` at `Services/statsService.ts:38`. | Import `fn, col` from `sequelize`. Both endpoints now return 200 (profile/full reuses `lifetime()`). |
| 2 | `PUT /driver/verification` 500'd on non-existent uploaded-image ids: `SequelizeForeignKeyConstraintError` (23503). | `driverVerificationService.ts` � `DRIVER_DOC_FIELDS`/`VEHICLE_DOC_FIELDS` were camelCase but the request body is snake_case, so the document-id existence check never ran; corrected the lists and added a 23503 ? 422 `ONE_OR_MORE_UPLOADED_DOCUMENT_IDS_DO_NOT_EXIST` safety net. |
| 3 | `POST /auth/register/phone` with an existing phone returned 422 `Cannot read properties of undefined (reading 'find')`. | `config/phoneCodes.ts` � the CommonJS interop block reassigned `module.exports` to the array, so `import { codes }` was `undefined`; removed the block. Now returns `409 CONFLICT` like V2. |
| 4 | `GET /auth/me` leaked Sequelize DECIMAL strings (`age:"28"`, `avgRating:"5.0"`) while declaring numbers and while V2 returned numbers. | Cast `age`/`avgRating` to numbers at the response boundary. |
| 5 | Malformed JSON was masked as `??? ????? ?? ??????` (internal error) with 400. | Detect body-parser `SyntaxError` and return the shared `INVALID_JSON_BODY` message. |

### 10.3 Remaining (not code defects)

- **31 endpoints exist only on V2** (�4). Requires a product decision: port them to Express (feature work) or declare them V2-only. Until then the differential run necessarily reports them as 404-on-V1.
- **Additive response fields** kept on V2 because V2's own e2e tests/spec assert them and they are backward-compatible for clients: `active_subscribers` (`GET /admin/plans`), five extra `kpis` (`GET /admin/dashboard/summary`), `reporter_role`/`accused_role`/`trip_id` (`GET /admin/complaints`), populated `passenger_name`/`passenger_phone_masked` (`POST /ride-requests`).
- **Harness artifacts** (not reproducible in isolation): the runner calls V1 then V2 against the same DB, so a mutating call (favorites delete, driver status, passenger onboarding) can succeed on V1 and then 404/409 on V2; `POST /auth/logout` can produce identical same-second JWTs, and V1 revoking the token in shared Redis makes V2 answer 401.
- The route-not-found message includes the actual base path (`/api/v1/...` vs `/api/v2/...`) by design.
