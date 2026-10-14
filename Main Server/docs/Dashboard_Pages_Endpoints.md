# Dashboard — Pages to Endpoints (Frontend Implementation Guide)

Covers every admin-dashboard page reviewed from Figma, each with its design
link and the exact backend endpoints to call. All paths below are implemented
in `nest-server` (verify against `*_spec.ts` suites before wiring).

## Global conventions

| Item | Value |
|---|---|
| Base URL | `/api` (e.g. `GET /api/admin/dashboard/summary`) |
| Auth | `Authorization: Bearer <admin JWT>` — every route below requires `admin` role (403 otherwise) |
| Locale | `Accept-Language: ar` (default) or `en`; messages are localized server-side |
| Pagination | `?page=&limit=` (defaults 1/20, max 100) → `{ data, pagination: { page, limit, total, total_pages } }` |
| Errors | `{ status: "error", message, code, details? }` (e.g. `USER_NOT_FOUND`, `VALIDATION_ERROR`, `BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED`) |
| Privacy | Phones are masked server-side (`079*******4567`); never unmask client-side |
| Display numbers | `TR-`/`BK-`/`RQ-`/`CMP-`/`PAY-` codes in Figma have no backing columns — API returns raw UUIDs (reference-code migration is a follow-up) |
| Audit | All admin reads/writes are audit-logged server-side; no client work needed |
| Live chat | Sockets, no new work: `chat:join/leave/send/typing/read` on `booking:{id}` (driver/passenger only) and `support:{id}` (staff included). Admin is **read-only** in trip rooms |

---

## 1. Home — الرئيسية

- Design: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=9524-10053&t=ZET6iEIpKjTo9vnq-4 (canvas: `...?node-id=9524-10052&t=ZET6iEIpKjTo9vnq-0`)

| UI block | Endpoint |
|---|---|
| KPI cards (drivers, trips, vehicles, pending docs, **bookings today, trips today, total passengers, pending payments, new ride requests**) | `GET /api/admin/dashboard/summary` → `kpis` |
| Alerts row | same → `alerts` (`pending_verification_documents`, `pending_review_drivers`, `unresolved_complaints`) |
| Top routes widget | same → `top_routes`, or `GET /api/admin/dashboard/top-routes` |
| Recent/active trips table | same → `recent_trips`, or `GET /api/admin/dashboard/recent-trips?status=&page=&limit=` |
| Pending verification list | same → `pending_requests`, or `GET /api/admin/dashboard/pending-requests` |
| Latest complaints widget | same → `latest_complaints`, or `GET /api/admin/dashboard/latest-complaints` |

---

## 2. Drivers — السائقون (list)

- Design: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=9695-33146&t=ZET6iEIpKjTo9vnq-4

| UI block | Endpoint |
|---|---|
| Stat cards (total / active / suspended / pending) | `GET /api/admin/dashboard/drivers/stats/summary` |
| Table + search + `حالة الحساب` + registration date + sorting | `GET /api/admin/dashboard/drivers?search=&status=active\|suspended\|pending\|blocked&registration_from=&registration_to=&sort_by=created_at\|full_name\|avg_rating&sort_order=` |
| تحميل التقرير (CSV download) | `GET /api/admin/dashboard/drivers/export` (same filters, `Content-Type: text/csv`) |

## 3. Driver dossier — تفاصيل السائق (tabs share one header)

- Overview: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=9750-35948&t=ZET6iEIpKjTo9vnq-4
- Verification: `...?node-id=9819-21225&t=ZET6iEIpKjTo9vnq-4`, `...?node-id=9828-22487&t=ZET6iEIpKjTo9vnq-4`
- Reject-document modal: `...?node-id=9840-18282&t=ZET6iEIpKjTo9vnq-4`
- Verified state: `...?node-id=9860-21379&t=ZET6iEIpKjTo9vnq-4`
- Vehicle: `...?node-id=9853-18380&t=ZET6iEIpKjTo9vnq-4`
- Account log: `...?node-id=9860-20387&t=ZET6iEIpKjTo9vnq-4`
- Trips: `...?node-id=9881-10822&t=ZET6iEIpKjTo9vnq-4`
- Ratings: `...?node-id=9919-3153&t=ZET6iEIpKjTo9vnq-4`
- Warned state: `...?node-id=9991-20342&t=ZET6iEIpKjTo9vnq-4`
- Temp-suspended state: `...?node-id=10000-22119&t=ZET6iEIpKjTo9vnq-4`
- After lift: `...?node-id=10004-22773&t=ZET6iEIpKjTo9vnq-4`
- Banned state: `...?node-id=10012-23988&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Header (all tabs) | `GET /api/admin/dashboard/drivers/:driver_id` |
| نظرة عامة | `GET /api/admin/dashboard/drivers/:driver_id/overview` |
| التوثيق (doc states + `عرض المستند` URLs) | `GET /api/admin/dashboard/drivers/:driver_id/documents` |
| Approve / Reject document (reject needs reason) | `POST .../documents/:document_key/approve` / `POST .../documents/:document_key/reject { reason }` |
| المركبة | `GET /api/admin/dashboard/drivers/:driver_id/car` |
| حالة الحساب (counts + log) | `GET /api/admin/dashboard/drivers/:driver_id/account-log` |
| الرحلات (+ status/month filters) | `GET .../trips?status=all\|pending\|active\|completed\|canceled&month=YYYY-MM` |
| التقييمات | `GET .../evaluations?page=&limit=` |
| إيقاف نهائي / إيقاف مؤقت buttons, رفع إيقاف | `POST .../account-status { action: suspend\|reactivate\|unblock, reason? }` (lift closes open suspensions **and** bans) |
| Set raw status | `POST .../status { status: active\|suspended\|pending\|blocked }` |
| إرسال إشعار modal — design: `...?node-id=9928-23297&t=ZET6iEIpKjTo9vnq-4` | `POST .../notifications { title, body, type: trip\|general\|account\|verification\|package }` |
| إرسال إنذار modal — design: `...?node-id=9991-20231&t=ZET6iEIpKjTo9vnq-4` | `POST /api/admin/penalties { user_id, type: "warning", reason, details? }` |
| Temp-suspend modal — design: `...?node-id=9995-20963&t=ZET6iEIpKjTo9vnq-4` | `POST /api/admin/penalties { user_id, type: "suspension", reason, ends_at (ISO, required), details? }` |
| Ban modal (checkbox mandatory) — design: `...?node-id=10012-23728&t=ZET6iEIpKjTo9vnq-4` | `POST /api/admin/penalties { user_id, type: "ban", reason, details?, confirm_reviewed_log: true }` (422 without the flag; `ends_at` forbidden for bans) |

---

## 4. Passengers — الركاب

- List: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=10062-4551&t=ZET6iEIpKjTo9vnq-4
- Overview: `...?node-id=10063-18152&t=ZET6iEIpKjTo9vnq-4`
- Account status: `...?node-id=10064-20466&t=ZET6iEIpKjTo9vnq-4`
- Bookings: `...?node-id=10064-22193&t=ZET6iEIpKjTo9vnq-4`
- Trip requests: `...?node-id=10064-23604&t=ZET6iEIpKjTo9vnq-4`
- Complaints filed: `...?node-id=10069-27574&t=ZET6iEIpKjTo9vnq-4`
- Complaints against: `...?node-id=10069-28429&t=ZET6iEIpKjTo9vnq-4`
- Ratings: `...?node-id=10069-30620&t=ZET6iEIpKjTo9vnq-4`
- Notify modal: `...?node-id=10063-18885&t=ZET6iEIpKjTo9vnq-4`
- Warn modal: `...?node-id=10063-19165&t=ZET6iEIpKjTo9vnq-4`
- Ban modal: `...?node-id=10063-19348&t=ZET6iEIpKjTo9vnq-4`
- Temp-suspend modal: `...?node-id=10063-18592&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Stat cards (total / active / temp-suspended / banned / with violations) | `GET /api/admin/passengers/stats` |
| Table + search + status/registration filters | `GET /api/admin/passengers?search=&accountStatus=active\|suspended_temporary\|suspended_permanent\|with_violations&registeredAt=today\|week\|month\|year\|any` |
| تحميل التقرير | `GET /api/admin/passengers/export` (CSV) |
| نظرة عامة | `GET /api/admin/passengers/:id` |
| حالة الحساب (counts + admin log) | `GET /api/admin/passengers/:id/account-log` |
| الحجوزات tab | `GET .../bookings?status=all\|pending\|confirmed\|completed\|cancelled\|no_show&date=` |
| طلبات الرحلات tab | `GET .../trip-requests?status=&date=` |
| الشكاوى tabs | `GET .../complaints?direction=filed\|against` |
| التقييمات | `GET .../ratings?direction=given\|received` |
| إرسال إشعار | `POST .../notifications { title, body, type: trip\|general\|account\|verification\|package }` |
| إرسال إنذار | `POST .../warnings { reason, notes? }` |
| إيقاف مؤقت | `POST .../suspensions/temporary { reason, duration: 1d\|3d\|7d\|custom, durationDays?, notes? }` |
| إيقاف نهائي (checkbox mandatory) | `POST .../suspensions/permanent { reason, notes?, confirmReviewedLog: true }` |

---

## 5. Bookings — الحجوزات

- List: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=10558-38631&t=ZET6iEIpKjTo9vnq-4
- Detail (confirmed): `...?node-id=10563-40148&t=ZET6iEIpKjTo9vnq-4`
- Detail (cancelled): `...?node-id=10571-42365&t=ZET6iEIpKjTo9vnq-4`
- Cancelled, driver cancelled trip: `...?node-id=10613-8891&t=ZET6iEIpKjTo9vnq-4`
- Cancelled, passenger "other" reason: `...?node-id=10613-9448&t=ZET6iEIpKjTo9vnq-4`
- Cancelled, passenger preset reason: `...?node-id=10613-17653&t=ZET6iEIpKjTo9vnq-4`
- Cancel modal: `...?node-id=10571-41682&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Stat cards (total / upcoming / in_progress / completed / cancelled) | `GET /api/admin/bookings/stats` |
| Table + search (booking no. / passenger) + status + from/to | `GET /api/admin/bookings?search=&status=all\|upcoming\|in_progress\|completed\|cancelled&from=YYYY-MM-DD&to=` |
| Detail (header, timeline, linked trip, driver, passenger + activity, cancellation block) | `GET /api/admin/bookings/:id` |
| إلغاء الحجز modal | `POST /api/admin/bookings/:id/cancel { reason: passenger_request\|booking_data_issue\|policy_violation\|unfulfillable\|other, notes? }` — pending/confirmed only (409 otherwise); frees seats; sends passenger notice. No refund leg (cash) |

---

## 6. Ride requests — طلبات الرحلات

- List: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=10631-10466&t=ZET6iEIpKjTo9vnq-4
- Request-data block: `...?node-id=10632-19244&t=ZET6iEIpKjTo9vnq-4`
- Detail (searching): `...?node-id=10632-11486&t=ZET6iEIpKjTo9vnq-4`
- Detail (matched): `...?node-id=10643-10725&t=ZET6iEIpKjTo9vnq-4`
- Detail (completed): `...?node-id=10654-10335&t=ZET6iEIpKjTo9vnq-4`
- Detail (expired): `...?node-id=10654-11518&t=ZET6iEIpKjTo9vnq-4`
- Detail (cancelled): `...?node-id=10673-11331&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Stat cards | `GET /api/admin/ride-requests/stats` → `{ total_requests, searching, matched, completed, cancelled, expired }` |
| Table + search + status + from/to | `GET /api/admin/ride-requests?search=&status=all\|open\|offered\|accepted\|expired\|cancelled&from=&to=` (status: قيد البحث=open, مطابقة=offered, مكتملة=accepted, ملغي=cancelled, منتهي=expired) |
| Detail (chips, request data, slots, passenger + activity, match card, cancellation/expiry, log) | `GET /api/admin/ride-requests/:id` |
| Read-only — no action endpoints for this screen | — |

---

## 7. Complaints — الشكاوى

- List: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=10678-13079&t=ZET6iEIpKjTo9vnq-4
- Detail (reviewing): `...?node-id=10681-11590&t=ZET6iEIpKjTo9vnq-4`
- Penalty actions: `...?node-id=10681-19490&t=ZET6iEIpKjTo9vnq-4`
- Ban modal: `...?node-id=10683-11753&t=ZET6iEIpKjTo9vnq-4`
- Warn modal: `...?node-id=10683-11689&t=ZET6iEIpKjTo9vnq-4`
- Temp-suspend modal: `...?node-id=10683-11615&t=ZET6iEIpKjTo9vnq-4`
- Resolved (warning): `...?node-id=10698-23006&t=ZET6iEIpKjTo9vnq-4`
- Resolved (temp): `...?node-id=10699-24545&t=ZET6iEIpKjTo9vnq-4`
- Resolved (ban): `...?node-id=10699-25044&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Stat cards | `GET /api/admin/complaints/stats` → `{ total_complaints, open, reviewing, resolved, dismissed }` (مفتوحة=open, قيد المراجعة=reviewing, تم حلها=resolved, مغلقة=dismissed) |
| Table + status/category + search (id or party name) | `GET /api/admin/complaints?status=&category=&search=` |
| Dossier (chips, trip card via booking, complaint + evidence, reporter/accused cards, penalty availability, log + review result) | `GET /api/admin/complaints/:id` |
| إجراءات العقوبة | `POST /api/admin/complaints/:id/penalties { kind: warning\|temporary\|permanent, reason, duration/durationDays?, notes?, confirmReviewedLog? }` (penalty links the complaint) |
| Resolve / dismiss (second step after optional penalty) | `PUT /api/admin/complaints/:id { status: reviewing\|resolved\|dismissed, resolution? }` (resolution required when resolving) |

---

## 8. Conversations — المحادثات

- List: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=10757-13462&t=ZET6iEIpKjTo9vnq-4
- Trip-chat detail: `...?node-id=10781-13068&t=ZET6iEIpKjTo9vnq-4`
- Penalty actions: `...?node-id=10785-17149&t=ZET6iEIpKjTo9vnq-4`
- Ban modal: `...?node-id=10791-31478&t=ZET6iEIpKjTo9vnq-4`
- Warn modal: `...?node-id=10791-31414&t=ZET6iEIpKjTo9vnq-4`
- Temp-suspend modal: `...?node-id=10791-31340&t=ZET6iEIpKjTo9vnq-4`
- After action: `...?node-id=10791-30877&t=ZET6iEIpKjTo9vnq-4`
- Direct chat: `...?node-id=10791-32955&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Stat cards | `GET /api/admin/conversations/stats` → `{ total_conversations, trip_conversations, admin_conversations, active }` (active = message within 7 days) |
| Trip-chat table + search + date | `GET /api/admin/conversations?type=trip&search=&date=today\|week\|month\|year\|any` (grouped by booking) |
| Admin-chat table | `GET /api/admin/conversations?type=admin&search=&date=` (support tickets) |
| Trip thread (read-only; admin never sends here) | `GET /api/admin/conversations/trip/:bookingId?page=&limit=&before_id=` + trip/party cards + related penalties |
| Penalty against a party | `POST .../trip/:bookingId/penalties { target_user_id, kind, reason, duration/durationDays?, notes?, confirmReviewedLog? }` |
| فتح محادثة (direct admin↔user chat) | No new endpoints: socket `chat:join` + `chat:send` on room `support:{ticketId}`; history `GET /api/chat/tickets/:ticketId/messages`; reply `POST /api/support-tickets/:ticketId/messages { message }` |

---

## 9. Subscriptions — الاشتراكات / الباقات والمدفوعات

- Plans: https://www.figma.com/design/U5mRGvHLv0joYOpI4IEQSp/Massar-App?node-id=10831-13497&t=ZET6iEIpKjTo9vnq-4
- Free-plan modal: `...?node-id=10840-36658&t=ZET6iEIpKjTo9vnq-4`
- Create plan: `...?node-id=10835-32759&t=ZET6iEIpKjTo9vnq-4`
- Edit plan: `...?node-id=10835-33623&t=ZET6iEIpKjTo9vnq-4`
- Payment queue: `...?node-id=10840-37484&t=ZET6iEIpKjTo9vnq-4`
- Review: `...?node-id=10846-39083&t=ZET6iEIpKjTo9vnq-4`
- Approved state: `...?node-id=10846-42189&t=ZET6iEIpKjTo9vnq-4`
- Reject modal: `...?node-id=10846-42450&t=ZET6iEIpKjTo9vnq-4`
- Methods tab: `...?node-id=10851-15865&t=ZET6iEIpKjTo9vnq-4`
- Add method: `...?node-id=10851-17559&t=ZET6iEIpKjTo9vnq-4`
- Edit method: `...?node-id=10851-18027&t=ZET6iEIpKjTo9vnq-4`

| UI block | Endpoint |
|---|---|
| Stat cards | `GET /api/admin/subscriptions/stats` → `{ total_subscribers, active_subscriptions, pending_review, rejected }` |
| Payment queue + search/plan/date filters | `GET /api/admin/subscriptions/pending?search=&status=&plan_id=&from=&to=&sort=newest\|oldest` |
| Review dossier (driver, plan, transfer data, receipt, history) | `GET /api/admin/subscriptions/:id` |
| اعتماد (approves + adds balance; 409 if already processed) | `POST /api/admin/subscriptions/:id/approve` |
| رفض (reason required) | `POST /api/admin/subscriptions/:id/reject { reason }` |
| Plan cards (+ `active_subscribers` each) | `GET /api/admin/plans` |
| إنشاء باقة (`name, period_days, percentage_cut, cost, status` badge, `features[]`, `is_free` + `free_offer`) | `POST /api/admin/plans` (201) |
| تعديل (`is_active` toggle included) | `PUT /api/admin/plans/:id` |
| Deactivate | `DELETE /api/admin/plans/:id` |
| Free-plan config | `GET /api/admin/plans/free`, `PUT /api/admin/plans/free` (404 if none — create via `POST /admin/plans`) |
| Methods list / add / edit / deactivate | `GET/POST /api/admin/payment-methods`, `PUT/DELETE /api/admin/payment-methods/:id` |
| تعليمات الدفع | Frontend-static (no backend storage) |

---

## 10. Shared admin utilities (sidebar-independent)

| Use | Endpoint |
|---|---|
| Generic user lookup / status change | `GET /api/admin/users?role=&status=` · `PUT /api/admin/users/:user_id { status, reason? }` |
| Generic penalty (any user, optional complaint link) | `POST /api/admin/penalties` (ban needs `confirm_reviewed_log: true`) |
| Driver reservations table | `GET /api/admin/dashboard/reservations?status=` |
