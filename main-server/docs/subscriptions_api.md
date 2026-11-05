# Masar Driver Subscription Plans — API Reference

Base path: `/api` (all endpoints below are prefixed with `/api`).

Auth: `Authorization: Bearer <accessToken>`. Roles: `driver` (driver endpoints), `admin` (admin endpoints). `GET /payment-methods` is public.

Error shape (422 validation / business errors):

```json
{
  "status": "error",
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient balance to publish trip. You need at least 1.50 to cover commission for one seat. Current balance: 0.50."
}
```

Common business error codes:

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 422 | Input failed express-validator rules |
| `PLAN_INACTIVE` | 422 | Selected plan is no longer active |
| `NO_ACTIVE_PLAN` | 422 | Driver has no active (non-expired) plan to gate against |
| `INSUFFICIENT_BALANCE` | 422 | Balance cannot cover one-seat commission at publish/start |
| `FREE_PLAN_EXISTS` | 409 | Another free plan is already active |
| `FREE_PLAN_ALREADY_USED` | 422 | National ID already used the free plan |
| `DUPLICATE_SUBSCRIPTION_REQUEST` | 409 | Duplicate pending request for the same plan |
| `REQUEST_ALREADY_PROCESSED` | 409 | Approve/reject raced; first action wins |
| `APPROVAL_BLOCKED` | 409 | Plan was deactivated before approval |

---

## 1. Driver catalog

### `GET /api/plans` — driver only

Active plan catalog (Redis-cached, `plans:active`, 60s TTL). Includes the free plan with its `free_offer`.

```json
{
  "plans": [
    {
      "id": "…",
      "name": "Basic",
      "period_days": 30,
      "percentage_cut": 8,
      "cost": 15,
      "status": "popular",
      "features": ["no booking fees"],
      "is_free": false,
      "free_offer": null
    },
    {
      "id": "…",
      "name": "Free Trial",
      "period_days": 30,
      "percentage_cut": 0,
      "cost": 0,
      "status": null,
      "features": [],
      "is_free": true,
      "free_offer": { "type": "trips", "value": 5 }
    }
  ]
}
```

### `GET /api/payment-methods` — public

```json
{
  "methods": [
    {
      "id": "…",
      "name": "Bank of Jordan",
      "account_number": "JO94BOJX0000000000",
      "type": "bank_account",
      "email": "payments@boj.com"
    }
  ]
}
```

---

## 2. Driver subscription lifecycle

### `POST /api/subscriptions` — driver only

Creates a pending request. Re-submitting for the same plan returns `409 DUPLICATE_SUBSCRIPTION_REQUEST` unless `resubmit: true` is passed (which cancels older pending requests for that plan and creates a new one).

Body:

```json
{
  "plan_id": "…",
  "payment_method_id": "…",
  "screenshot_id": 123,
  "resubmit": false
}
```

`plan_id`/`payment_method_id` must be valid UUIDs; `screenshot_id` must be the integer image ID returned by `POST /api/upload` (the payment screenshot is uploaded through the server's image service and validated in the service layer).

Response `201`:

```json
{
  "subscription_id": "…",
  "status": "pending_approval",
  "message": "Subscription request submitted. Awaiting admin approval."
}
```

### `GET /api/subscriptions` — driver only

All of the driver's subscriptions, newest first.

```json
{
  "subscriptions": [
    {
      "id": "…",
      "plan": { "name": "Basic", "period_days": 30 },
      "balance": 0,
      "status": "pending_approval",
      "rejection_reason": null,
      "created_at": "2026-08-01T10:00:00.000Z",
      "approved_at": null,
      "expires_at": null
    }
  ]
}
```

### `GET /api/subscriptions/current` — driver only

Current active plan (queue order: free plan first, then shortest period, then submission FIFO) with the driver's cached total balance.

```json
{
  "subscription": {
    "id": "…",
    "plan": { "name": "Basic", "percentage_cut": 8 },
    "balance": 15,
    "expires_at": "2026-09-01T10:00:00.000Z"
  },
  "total_balance": 15,
  "is_in_debt": false
}
```

`subscription` is `null` when no active plan exists.

---

## 3. Trip gating & commission (US3)

### `POST /api/trips` — driver only (modified)

Rejects with `422 NO_ACTIVE_PLAN` (no active plan) or `422 INSUFFICIENT_BALANCE` (total balance < `fare_per_seat × percentage_cut/100`).

### `POST /api/trips/:trip_id/start` — driver only

Re-checks the minimum balance; on failure returns `422 INSUFFICIENT_BALANCE` and sends an SMS + in-app + push `INSUFFICIENT_BALANCE_START` notification. On success marks the trip `in_progress`:

```json
{
  "trip_id": "…",
  "status": "in_progress",
  "message": "Trip started successfully!"
}
```

### `POST /api/trips/:trip_id/complete` — driver only

Computes commission = total paid fare (confirmed/completed bookings) × current active plan rate, deducts FIFO across active plans (shortfall → debt, trips blocked). On debt, sends in-app + push `DEBT` notification.

```json
{
  "trip_id": "…",
  "commission": 2,
  "plan_name": "Basic",
  "balance_after": 80,
  "is_in_debt": false
}
```

---

## 4. Admin endpoints — admin only

### Plans

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/admin/plans` | — | `{ "plans": [...] }` (includes inactive, has `is_active`) |
| POST | `/api/admin/plans` | plan fields | `201 { "plan": { … } }` |
| PUT | `/api/admin/plans/:plan_id` | partial fields | `{ "plan": { … } }` |
| DELETE | `/api/admin/plans/:plan_id` | — | `{ "message": "Plan deactivated." }` (soft delete) |

Plan body: `{ name, period_days, percentage_cut, cost, status?, features[], is_free, free_offer? }`. `free_offer` is required and must be `{ "type": "trips"|"credit", "value": number }` when `is_free` is true. Only one free plan may be active.

### Payment methods

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/admin/payment-methods` | — | `{ "methods": [...] }` |
| POST | `/api/admin/payment-methods` | `{ name, account_number, type, email? }` | `201 { "method": { … } }` |
| PUT | `/api/admin/payment-methods/:method_id` | partial fields | `{ "method": { … } }` |
| DELETE | `/api/admin/payment-methods/:method_id` | — | `{ "message": "Payment method deactivated." }` |

`type` ∈ `bank_account | e-wallet | mobile_money`.

### Subscription approval workflow

### `GET /api/admin/subscriptions/pending`

Optional query params: `status` (default `pending_approval`), `sort` (`newest` | `oldest`). The National ID is **masked** server-side (`****1234`) and never returned raw.

```json
{
  "pending": [
    {
      "subscription_id": "…",
      "driver": {
        "id": "…",
        "full_name": "Khaled",
        "phone": "+962…",
        "national_id_masked": "****1234"
      },
      "plan": { "name": "Basic", "cost": 15, "is_active": true },
      "payment_method": { "name": "Bank of Jordan" },
      "screenshot_id": 123,
      "screenshot_url": "https://…",
      "submitted_at": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/admin/subscriptions/:subscription_id/approve`

First-action-wins (atomic conditional update). Credits the driver's balance (clears debt first), activates the plan (`activated_at = now()`, `expires_at = now() + period_days`), merges an existing same-plan active subscription's remaining balance (renewal) and expires the old row. Sends SMS + in-app `SUBSCRIPTION_APPROVED`.

```json
{
  "message": "Subscription approved. Plan activated.",
  "subscription_id": "…",
  "balance_added": 15
}
```

### `POST /api/admin/subscriptions/:subscription_id/reject`

Body: `{ "reason": "…" }` (required, ≤500 chars). Sends SMS + in-app `SUBSCRIPTION_REJECTED` with the reason.

```json
{
  "message": "Subscription rejected.",
  "subscription_id": "…"
}
```

---

## 5. Scheduled jobs

Registered at server bootstrap in `jobs/index.js` (node-cron; skipped in tests). Schedules come from env:

| Job | Env var | Default | Behavior |
|-----|---------|---------|----------|
| `expirySweep` | `JOB_EXPIRY_SWEEP_CRON` | `0 0 * * *` | Flips `active → expired`, removes remaining balance from ledger (debt preserved), recomputes `users.total_balance`/`is_in_debt`, unpublishes trips when zero/no plan, sends `PLAN_EXPIRED` (+`DEBT`) notifications |
| `expiryReminder` | `JOB_REMINDER_CRON` | `0 9 * * *` | In-app + push `PLAN_EXPIRING_SOON` 24h before expiry |
| `lowBalanceWarning` | `JOB_LOW_BALANCE_WARNING_CRON` | `0 12 * * *` | In-app + push `LOW_BALANCE_WARNING` when an upcoming trip's balance can't cover one-seat commission |
