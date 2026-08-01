# Masar Driver Subscription Plans Specification

## 1. Overview

This document defines the driver subscription and commission management system for the Masar intercity mobility platform. The system enables drivers to subscribe to paid plans that provide a balance from which commissions are deducted for each completed trip. The platform does **not** process actual payments; all accounting is internal, and fares are still settled directly between passengers and drivers (cash on board). Commissions are calculated as a percentage of the trip fare and deducted from the driver’s subscription balance.

Key goals:
- Provide a sustainable monetization model without intercepting passenger payments.
- Offer flexibility through configurable plans (admin-managed).
- Ensure drivers always have sufficient balance to cover commissions before starting trips.
- Handle debt scenarios transparently.
- Provide clear notifications and warnings.

---

## 2. Plan Structure

- Each plan has the following attributes:
  - `name` (e.g., “Basic”, “Pro”, “Premium”)
  - `period` (duration in days)
  - `percentage_cut_of_the_trip` (commission rate as a percentage)
  - `cost` (price the driver pays to subscribe)
  - `status` (marketing labels: “most_requested”, “frequent”, “popular”, etc.)
  - `plan_features` (list of feature strings, e.g., “Priority placement”, “Analytics”)
  - `is_free` (boolean; true for the free plan)
  - `free_offer` (JSON: for free plan, defines `type: 'trips'` or `'credit'` and `value`)

- **Free Plan**
  - One-time activation per **National ID**.
  - 30‑day trial duration (configurable by admin).
  - Provides either:
    - A set number of **free trips** (0% commission), OR
    - An **account credit** (e.g., $50) from which commissions are deducted at the plan’s percentage (which for free plan is usually 0% if it’s “free trips”, but admin can set a rate for credit-based free plans).
  - Admin can enable/disable and modify the free plan; changes apply to new registrations only.

- **Admin controls**
  - Add/remove plans at any time.
  - Change plan prices, percentage cuts, and features.
  - Changes affect **new subscriptions only** (existing subscribers retain their original terms).
  - Deactivate plans (they become unavailable for new subscriptions).

---

## 3. Subscription Workflow (Simplified)

1. **Driver selects a plan** from the list (including the free plan if available).
2. **Driver views payment options** (admin‑configured bank accounts, e‑wallets, etc.).
3. **Driver makes payment** off‑platform (to the provided account).
4. **Driver takes a screenshot** of the payment confirmation and uploads it via the app.
5. **Admin reviews** the screenshot and driver profile in the admin dashboard.
6. **Admin approves** or **rejects** the request:
   - **Approved**: System immediately activates the plan, adds the balance to the driver’s account, and sends an **SMS + in‑app notification** confirming activation.
   - **Rejected**: Admin must provide a reason; driver receives an **SMS + in‑app notification** with the rejection reason.
7. **Plan is active** – the driver can now publish trips and earn, with commissions deducted from the balance.

*No activation code is required; approval directly activates the plan.*

---

## 4. Data Model

### 4.1 New Tables

**`subscription_plans`**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Primary key |
| name | VARCHAR(100) | Plan name |
| period_days | INT | Duration in days |
| percentage_cut | DECIMAL(5,2) | Commission rate (e.g., 8.00 for 8%) |
| cost | DECIMAL(10,2) | Subscription price |
| status | VARCHAR(30) | Marketing label (optional) |
| features | JSONB | Array of feature strings |
| is_free | BOOLEAN | True for free plan |
| free_offer | JSONB | For free plan: `{"type":"trips","value":5}` or `{"type":"credit","value":50.00}` |
| is_active | BOOLEAN | Admin‑controlled visibility |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update |

**`driver_subscriptions`**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Primary key |
| driver_id | UUID FK→users(id) | Driver reference |
| plan_id | UUID FK→subscription_plans(id) | Subscribed plan |
| balance | DECIMAL(10,2) | Remaining credit balance |
| screenshot_url | TEXT | URL to uploaded payment screenshot |
| payment_method | JSONB | Snapshot of chosen payment option at time of subscription |
| admin_notes | TEXT | Reason for rejection (if any) |
| status | VARCHAR(20) | `pending_approval`, `approved`, `active`, `expired` |
| approved_at | TIMESTAMPTZ | When admin approved |
| activated_at | TIMESTAMPTZ | When plan became active (same as approved_at if no code) |
| expires_at | TIMESTAMPTZ | Calculated as activated_at + period_days |
| created_at | TIMESTAMPTZ | Submission timestamp |
| updated_at | TIMESTAMPTZ | Last update |

*Note: If a driver has multiple active plans, each has its own row. The current active plan is the one with the earliest `activated_at` that is not expired.*

**`payment_methods`** (admin configuration)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Primary key |
| name | VARCHAR(100) | e.g., “Bank of Jordan” |
| account_number | VARCHAR(50) | Account number |
| type | VARCHAR(30) | `bank_account`, `e-wallet`, `mobile_money` |
| email | VARCHAR(100) | Optional contact email |
| is_active | BOOLEAN | Admin‑controlled visibility |
| created_at | TIMESTAMPTZ | Creation |
| updated_at | TIMESTAMPTZ | Last update |

### 4.2 Modifications to Existing Tables

**`users`** (add columns)

| Column | Type | Description |
|--------|------|-------------|
| national_id | VARCHAR(20) | For free plan eligibility |
| total_balance | DECIMAL(10,2) | Sum of balances from all active subscriptions (cached for performance) |
| is_in_debt | BOOLEAN | True if total_balance < 0 |

**`trips`** (add column)

| Column | Type | Description |
|--------|------|-------------|
| is_blocked_by_balance | BOOLEAN | True if driver has negative balance, causing trip to be hidden/unpublished |

---

## 5. API Endpoints

All endpoints require driver authentication (JWT) unless noted.

### 5.1 `GET /plans`

Retrieve all active plans (including the free plan, if active).

**Response** (200 OK):

```json
{
  "plans": [
    {
      "id": "p1",
      "name": "Basic",
      "period_days": 14,
      "percentage_cut": 8.0,
      "cost": 20.00,
      "status": "most_requested",
      "features": ["Basic visibility", "5 trips per week"],
      "is_free": false
    },
    {
      "id": "p_free",
      "name": "Free Trial",
      "period_days": 30,
      "percentage_cut": 0.0,
      "cost": 0.00,
      "status": null,
      "features": ["5 free trips"],
      "is_free": true,
      "free_offer": {"type": "trips", "value": 5}
    }
  ]
}
```

### 5.2 `GET /payment-methods`

Retrieve active payment methods (public).

**Response** (200 OK):

```json
{
  "methods": [
    {
      "id": "pm1",
      "name": "Bank of Jordan",
      "account_number": "123456789",
      "type": "bank_account",
      "email": "finance@masar.com"
    }
  ]
}
```

### 5.3 `POST /subscriptions`

Driver submits a subscription request.

**Request Body**:

```json
{
  "plan_id": "p1",
  "payment_method_id": "pm1",
  "screenshot": "data:image/png;base64,..." // or a URL from file upload
}
```

**Response** (201 Created):

```json
{
  "subscription_id": "sub_123",
  "status": "pending_approval",
  "message": "Your subscription is pending admin approval."
}
```

### 5.4 `GET /subscriptions`

Retrieve all subscriptions for the authenticated driver.

**Response** (200 OK):

```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "plan": {"name": "Basic", "period_days": 14},
      "balance": 0.00,
      "status": "pending_approval",
      "created_at": "2026-08-01T10:00:00Z"
    },
    {
      "id": "sub_456",
      "plan": {"name": "Pro", "period_days": 30},
      "balance": 45.00,
      "status": "active",
      "expires_at": "2026-09-01T10:00:00Z"
    }
  ]
}
```

### 5.5 `GET /subscriptions/current`

Get the currently active plan (the one being used for commission deductions). Returns null if none.

**Response** (200 OK):

```json
{
  "subscription": {
    "id": "sub_456",
    "plan": {"name": "Pro", "percentage_cut": 6.0},
    "balance": 45.00,
    "expires_at": "2026-09-01T10:00:00Z"
  },
  "total_balance": 45.00,
  "is_in_debt": false
}
```

### 5.6 `POST /trips` (modified behavior)

When a driver publishes a trip, the system must check if the driver has sufficient balance to cover the estimated commission for at least 1 seat. The minimum required is `fare_per_seat * (percentage_cut/100)`. If not, the trip is rejected with an appropriate error.

**Additional validation** (return 422 if insufficient):

```json
{
  "error": "Insufficient balance to publish trip. You need at least X.XX to cover commission for one seat. Current balance: Y.YY."
}
```

### 5.7 `POST /trips/{trip_id}/start` (or internal status change)

When a driver starts a trip (marks as “ongoing”), the system must verify that the balance is still sufficient for at least 1 seat at that moment. If not, the driver cannot start the trip and receives a warning.

### 5.8 `POST /trips/{trip_id}/complete` (internal)

Upon trip completion, the system calculates the total fare (based on actual passengers) and deducts the commission from the **current active plan** (the one that was active at the time of trip completion). If the balance is insufficient, the driver goes into debt (negative balance). The deduction logic:

1. Determine the commission: `commission = total_paid_fare * (plan.percentage_cut / 100)`
2. If `current_plan.balance >= commission` → deduct normally.
3. Else → deduct whatever remains, set balance to 0, and create debt: `total_balance = total_balance - commission` (i.e., negative). Mark `is_in_debt = true`.

---

## 6. Admin Dashboard Endpoints

### 6.1 `GET /admin/pending-subscriptions`

List all subscription requests pending approval.

**Response** (200 OK):

```json
{
  "pending": [
    {
      "subscription_id": "sub_123",
      "driver": {"id": "d1", "full_name": "Khaled", "phone": "+962..."},
      "plan": {"name": "Basic", "cost": 20.00},
      "payment_method": {"name": "Bank of Jordan"},
      "screenshot_url": "https://...",
      "submitted_at": "2026-08-01T10:00:00Z"
    }
  ]
}
```

### 6.2 `POST /admin/subscriptions/{id}/approve`

Approve a subscription.

**Response** (200 OK):

```json
{
  "message": "Subscription approved. Plan activated.",
  "subscription_id": "sub_123",
  "balance_added": 20.00
}
```
- System immediately activates the plan:
  - Sets `status = 'active'`, `activated_at = now()`, `expires_at = now() + period_days`.
  - Adds `cost` to the driver's balance.
  - Sends SMS + in‑app notification: “Your [Plan Name] subscription is now active! You have $X.XX balance.”
- If the driver had negative balance, the new balance clears it first (debt deduction).

### 6.3 `POST /admin/subscriptions/{id}/reject`

Reject a subscription with a reason.

**Request Body**:

```json
{
  "reason": "The screenshot is unclear. Please resubmit with a clearer image."
}
```

**Response** (200 OK):

```json
{
  "message": "Subscription rejected.",
  "subscription_id": "sub_123"
}
```
- System updates status to `rejected`.
- Sends SMS + in‑app notification with the rejection reason.

### 6.4 `GET /admin/plans` & `POST /admin/plans`, `PUT /admin/plans/{id}`, `DELETE /admin/plans/{id}`

CRUD for plans (including free plan). Changes affect new subscriptions only.

### 6.5 `GET /admin/payment-methods` & `POST /admin/payment-methods`, etc.

CRUD for payment options.

---

## 7. Business Logic Rules

### 7.1 Balance and Debt

- **Balance** is the sum of all active (not expired) subscription balances. Each subscription has its own remaining balance.
- **Total balance** is the sum of all active subscription balances. If negative, the driver is in debt.
- **Commission deduction**: Always taken from the **current active plan** (the plan with the earliest activation date that hasn’t expired). If that plan’s balance is insufficient, the system uses the remaining balance, sets that plan’s balance to 0, and then continues deducting from the next active plan in order (FIFO). If all active plans are exhausted, the total balance becomes negative (debt).
- **Debt handling**:
  - If total balance < 0, all trips are automatically unpublished (`is_blocked_by_balance = true`).
  - Driver cannot publish new trips.
  - The debt is cleared when a new subscription is approved: the new subscription's balance is added to the total, and if still negative, the driver remains in debt until total >= 0.
  - No separate top‑ups; only new subscriptions increase balance.

### 7.2 Plan Priority and Activation Order

- **Free plan** always activates first (if the driver hasn't used it before).
- **Paid plans** activate in order of **shortest period first**, then by subscription date (FIFO) for ties.
- When a plan expires, the next plan in the queue becomes active.
- If a driver subscribes to the same plan again while it’s still active or in queue:
  - The existing plan’s remaining balance is **added** to the new subscription’s balance.
  - The new period (duration) resets to the full period from the date of the new activation.
  - This effectively extends the plan.

### 7.3 Minimum Balance to Start a Trip

- Before publishing or starting a trip, the driver must have a total balance ≥ `fare_per_seat * (current_plan.percentage_cut / 100)` (i.e., enough to cover commission for **one seat**). This prevents starting trips that will immediately cause debt.
- The system checks this at trip publication time and again when the driver marks the trip as “in progress” (to handle balance changes between publication and trip start).

### 7.4 Insufficient Balance During Trip

- If a trip has already started and the driver’s balance is insufficient to cover the commission for the actual number of passengers at completion:
  - The commission is still calculated and deducted.
  - The driver goes into debt if the balance is insufficient.
  - After trip completion, the driver is blocked from starting new trips (unpublishing trips) until the debt is cleared.

### 7.5 Plan Expiration While Active Trips Exist

- If a plan expires while the driver has active trips (booked but not yet completed):
  - The trips remain valid (passenger agreements are honored).
  - When those trips complete, commission is deducted from the **next active plan** in the queue, or from the total balance (which may be zero or negative). If no plan exists, the driver goes into debt.
- Expiration does not automatically cancel bookings.

### 7.6 Commission Rate at Trip Completion

- The commission rate used is the rate of the **active plan at the time of trip completion**, not at the time of booking.
- If the active plan changes between booking and completion (e.g., a new plan activates before completion), the new plan’s rate applies.

---

## 8. Notifications

### 8.1 Subscription Notifications

| Event | Channels | Content |
|-------|----------|---------|
| Payment submitted | In‑app only | “Your payment is pending admin review.” |
| Payment approved | SMS + In‑app | “Your [Plan Name] subscription is now active! You have $X.XX balance.” |
| Payment rejected | SMS + In‑app | “Your subscription payment was rejected: [REASON]. Please try again.” |

### 8.2 Balance & Trip Notifications

| Event | Channels | Content |
|-------|----------|---------|
| Low balance warning (24h before trip) | In‑app + Push | “Warning: Your balance is $X.XX. You need $Y.YY for your upcoming trip. Please subscribe to a new plan.” |
| Insufficient balance at trip start | SMS + In‑app + Push | “Your trip [destination] cannot be started because your balance is insufficient. Please subscribe to a plan.” |
| Plan expiring soon | In‑app + Push | “Your [Plan Name] expires in [X] days. Subscribe now to keep your trips active.” |
| Plan expired | In‑app + Push | “Your [Plan Name] has expired. Your trips have been unpublished. Subscribe to reactivate.” |
| Debt warning | In‑app + Push | “You have a negative balance of $X.XX. Your trips are unpublished. Subscribe to a new plan to clear the debt and reactivate.” |

---

## 9. Sequence Diagrams

### 9.1 Subscription Approval Flow

```
Driver          App            Admin Dashboard          SMS Service
  |              |                     |                    |
  | Select plan  |                     |                    |
  |------------->|                     |                    |
  | Upload scree |                     |                    |
  |------------->|                     |                    |
  |              | POST /subscriptions |                    |
  |              |-------------------->| (pending)          |
  |              |                     |                    |
  |              |           Admin approves               |
  |              |<----------------------------------------|
  |              |                     |                    |
  |              | Activate plan (balance +, status)       |
  |              |------------------->|                    |
  |              |                     |                    |
  |              | Send SMS + in-app notification         |
  |              |---------------------------------------->|
  |              |                     |                    |
  |<-------------| (notification)     |                    |
```

### 9.2 Commission Deduction on Trip Completion

```
Trip completes → System calculates total fare
  → Determine active plan at completion time
  → Compute commission
  → If balance >= commission: deduct and update
  → Else: deduct remaining, mark debt, unpublish trips
  → Update driver total balance
  → Send any relevant notifications
```

---

## 10. Edge Cases & Handling

| Scenario | Handling |
|----------|----------|
| Driver subscribes while in debt | New balance is first applied to debt. Only if new balance > debt does the driver get positive balance. |
| Driver rejects payment and then resubmits | Old pending request is marked as `cancelled`; new request is created. |
| Admin approves a payment but the plan was deactivated in the meantime | Approval should be blocked; admin must choose an active plan. |
| Driver has multiple active plans and one expires | The next plan in queue becomes active; if none, balance goes to 0 and trips are unpublished. |
| Driver has booked trips but no active plan at completion | Commission is deducted from total balance (which may be zero) → debt if negative. |
| Driver tries to publish trip with insufficient balance | Rejected with specific error message mentioning required amount. |
| Free plan: driver used it, then subscribed to paid plan, then the paid plan expires | Free plan cannot be reused. Driver must subscribe to a new paid plan. |
| Driver changes phone number | Can do so in settings; National ID remains tied to free plan eligibility. |

---

## 11. Implementation Notes

- **SMS integration**: Use a provider (Twilio, etc.) with templates for each notification type.
- **Admin dashboard**: Should include filtering and sorting for pending payments.
- **Cron jobs**: Periodically check for expiring plans (24h before) and send reminders; also check for debt and unpublish trips automatically.
- **Idempotency**: Ensure payment submissions are idempotent (prevent duplicate pending requests).
- **Screenshot upload**: Use secure storage (S3, etc.) with signed URLs for admin access.

---

This specification provides a complete definition of the driver subscription system, aligning with Masar's no‑payment‑processing principle while enabling a sustainable revenue model. All business rules, edge cases, and administrative controls are detailed for implementation.