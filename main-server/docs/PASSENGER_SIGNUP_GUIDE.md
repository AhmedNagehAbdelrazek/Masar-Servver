# Passenger Signup & Profile Completion Guide

**Scope:** Masar API — Express v1 (`main-server/`) and Nest v2 (`nest-server/`). Both expose the same auth contract for this flow.

**Verified against:**
- `main-server/Services/authService.ts` (`registerPhone`, `verifyRegistrationOTP`, `registerPassword`, `submitPassengerProfile`)
- `main-server/Routes/authRoutes.ts`, `main-server/utils/validators/authValidator.ts`
- `main-server/Services/passengerProfileService.ts`, `main-server/Routes/profileRoutes.ts`
- `nest-server/src/modules/auth/auth.service.ts`, `nest-server/src/modules/auth/auth.controller.ts`
- `main-server/tests/integration/auth.test.js` (passenger registration + profile assertions)

**Related docs:** [API_AUTH_GUIDE.md](./API_AUTH_GUIDE.md), [developer accounts](../../docs/developer-accounts.md)

---

## 1. The role question: will a passenger become a driver?

**No.** The server does not force `driver` when you register a passenger. The role is taken from the `role` field in **Step 1** and copied through Redis, the registration JWT, and finally `users.role`:

```text
POST /auth/register/phone  { role: "passenger" }
        │
        ├─ Redis: reg_data:{full_phone} = { role: "passenger", countryCode: "JO" }
        │
POST /auth/register/verify-otp
        │
        ├─ registration JWT: { phone, role: "passenger", type: "registration" }
        │
POST /auth/register/password
        │
        ├─ users.role = "passenger"
        └─ passenger_profiles placeholder row created
```

Code references:
- `registerPhone` stores `{ countryCode, role }` in Redis (`reg_data:{phone}`) for 10 minutes.
- `verifyRegistrationOTP` reads that Redis value and signs the registration token with the same role.
- `registerPassword` writes `role: regPayload.role` to the user row.
- For `role === "passenger"`, it also creates the `passenger_profiles` placeholder row and initializes default notification settings.

The Nest implementation does the same. Its only fallback is `role: decoded.role ?? "passenger"` when the JWT has **no role claim at all**; it never falls back to `driver`.

The database also cannot silently choose `driver`: `users.role` is a PostgreSQL enum (`enum_users_role`: `passenger`, `driver`, `admin`, `support`, `moderator`) with **no default** and `NOT NULL`. An insert must supply one of those values.

### Why you may still see a driver account

1. **The saved Postman request uses `"role": "driver"`.**
   In `postman/masar_api_collection.json`, the “Step 1 - Send Phone (Register)” body is:

   ```json
   {
     "country_code": "JO",
     "phone": "791234561",
     "role": "driver"
   }
   ```

   If you only change the phone number and run it, you are registering a **driver**. Change `role` to `passenger` before sending.

2. **A registration token from a driver attempt was reused.**
   The role is fixed inside the token. If Step 1 was sent with `driver`, the token issued in Step 2 will create a driver.

3. **You are looking at a seeded/test account, not the newly created account.**
   Check by phone number, not by name.

4. **You used a reserved developer/test phone.**
   Both servers re-seed the dedicated developer fixtures on boot:
   `+962700000001` is forced to `driver` and `+962700000002` is forced to
   `passenger` (override with `DEV_DRIVER_PHONE` / `DEV_PASSENGER_PHONE`).
   Restarting the server “restores the expected role” for those phones. See
   [developer accounts](../../docs/developer-accounts.md). Use a normal, unused
   phone number when testing passenger registration.

5. **The client is still using a driver's old token or cached role.**
   Access tokens carry the role at issue time. Log out, clear the stored tokens, and log in again; then check `GET /auth/me`.

6. **The account was created earlier with the wrong role.**
   There is no API to change `users.role` after registration. See “Fixing a wrong role” below.

### How to verify the role

```http
GET /auth/me
Authorization: Bearer <access_token>
```

The response includes:

```json
{
  "id": "uuid",
  "phone": "+962791234567",
  "role": "passenger",
  "fullName": "Ahmad Ali",
  "isVerified": false
}
```

Or query the database directly:

```sql
SELECT phone, role, full_name
FROM users
WHERE phone = '+962791234567';
```

### Fixing a wrong role

There is **no public “change role” endpoint**. Your options are:

- **Recommended:** register again with a different phone number and send `"role": "passenger"` in Step 1.
- **Operator-only:** update `users.role` in the database, then force the user to log in again (the old JWT keeps the old role until it expires). This should be audited and is not exposed by the API.

> **Important:** the role is chosen by the client at registration. The server validates that it is `passenger` or `driver`, but it cannot know whether the person intended to be a passenger. Always set `role` explicitly.

---

## 2. Prerequisites

| Item | Value |
|---|---|
| Content type | `application/json` |
| Phone format — Step 1 | Local digits without the dial code, e.g. `791234567` |
| Country code — Step 1 | 2-letter ISO code, e.g. `JO`, `AE`, `SA` |
| Phone format — Steps 2+ | Full international format, e.g. `+962791234567` |
| OTP delivery (dev) | Printed in the server console: `[OTP] register OTP for +962...: 123456` |
| OTP TTL | 5 minutes |
| OTP max attempts | 3 |
| Registration data / token TTL | 10 minutes |
| Registration token | Single-use |
| Locale | `Accept-Language: ar` (default) or `en`; messages are localized |

### Base URL

The route paths below are relative to the API prefix:

| Server | Local base URL | Prefix source |
|---|---|---|
| Express v1 | `http://localhost:8000/api` (Postman environment) or `http://localhost:8000/api/v1` | `API_BASE_PATH` env; `app.ts` defaults to `/api/v1` |
| Nest v2 | `http://localhost:3001/api/v2` (or `http://localhost:8001/api/v2` in Docker) | `API_PREFIX` env; `main.ts` defaults to `api/v2` |

Use the same prefix consistently for every request.

### What you need before starting

- A phone number that is **not already registered** and is **not a reserved developer/test phone** (`+962700000001` is forced to driver; `+962700000002` is forced to passenger).
- Access to the OTP (server console in dev, SMS in production).
- No uploads are required for passengers. Image uploads are driver-onboarding only.
- **Local data warning:** with `SEED_MOCK_ON_BOOT=true`, a boot where the mock marker user (`+962790000001`) is missing **truncates and reseeds** the mock tables. Use a disposable test database or set `SEED_MOCK_ON_BOOT=false` when you care about local accounts.
- **Do not run concurrent Step 1 requests for the same phone.** `reg_data` is keyed by phone, so the last `/auth/register/phone` call overwrites the role that Step 2 will embed in the registration token.

---

## 3. Step-by-step signup

### Step 1 — Request the registration OTP

```http
POST {base}/auth/register/phone
```

**Body:**

```json
{
  "country_code": "JO",
  "phone": "791234567",
  "role": "passenger"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `country_code` | string | Yes | 2 letters; must exist in the phone-code table (e.g. `JO`) |
| `phone` | string | Yes | Digits for the selected country, without the dial code |
| `role` | string | Yes | Exactly `passenger` or `driver` — use `passenger` |

**Success — `201`:**

```json
{
  "message": "OTP sent successfully"
}
```

**What the server stores:**

- `otp:{full_phone}` — the 6-digit OTP, 5-minute TTL.
- `otp_attempts:{full_phone}` — attempt counter, 5-minute TTL.
- `reg_data:{full_phone}` — `{ "countryCode": "JO", "role": "passenger" }`, 10-minute TTL.

**Common errors:**

| Status | Code / message | Cause |
|---|---|---|
| `409` | `PHONE_NUMBER_IS_ALREADY_REGISTERED` | The phone already has an account; log in instead |
| `422` | `VALIDATION_ERROR` | Missing/invalid country code, phone, or role |
| `502` / `503` | `SMS_SEND_FAILED` | SMS provider failure |

> **Do not skip this step's `role`.** This is the only place the passenger role is chosen.

If the OTP expires or is lost, resend it. Resending does **not** change the role stored in `reg_data`; however, `reg_data` itself expires after 10 minutes, so if it is already gone, start again from Step 1 with the correct role.

```http
POST {base}/auth/resend-otp
```

```json
{
  "phone": "+962791234567",
  "purpose": "register"
}
```

---

### Step 2 — Verify the OTP and get a registration token

```http
POST {base}/auth/register/verify-otp
```

**Body:**

```json
{
  "phone": "+962791234567",
  "otp": "123456"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `phone` | string | Yes | Full international number — must match the Step 1 phone after normalization |
| `otp` | string | Yes | 6 digits |

**Success — `201`:**

```json
{
  "registration_token": "eyJhbGciOiJIUzI1NiIs...",
  "phone": "+962791234567"
}
```

The token contains `{ phone, role: "passenger", countryCode, type: "registration" }`.

**Common errors:**

| Status | Code / message | Cause |
|---|---|---|
| `400` | `INVALID_OTP` | Wrong OTP |
| `400` | `OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE` | OTP older than 5 minutes |
| `400` | `MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE` | 3 failed attempts; request a new OTP |
| `409` | `PHONE_NUMBER_IS_ALREADY_REGISTERED` | An account was created between Step 1 and Step 2 |

> The registration token is valid for **10 minutes** and can be used **once**. Complete Step 3 immediately.

---

### Step 3 — Set the password and create the account

```http
POST {base}/auth/register/password
Authorization: Bearer <registration_token>
```

**Body:**

```json
{
  "password": "MySecure@123",
  "confirmPassword": "MySecure@123"
}
```

**Password policy:**

- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character from `@$!%*?&`

**Success — `201`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "phone": "+962791234567",
    "countryCode": "JO",
    "role": "passenger",
    "fullName": null,
    "isVerified": false
  }
}
```

**What the server creates:**

- `users` row with `role = "passenger"`, `locale = "ar"`, `status = "active"`, `is_verified = false`.
- `passenger_profiles` placeholder row with `passenger_id = user.id`; `national_id` and `home_address` are `NULL`.
- Default `notification_settings` rows for the user.
- Access + refresh tokens. The access token's `role` claim is `passenger`; access-token TTL is `JWT_EXPIRY` (default `24h`), refresh-token TTL is 7 days.

**Common errors:**

| Status | Code / message | Cause |
|---|---|---|
| `401` | `REGISTRATION_TOKEN_IS_REQUIRED` | Missing `Authorization` header |
| `401` | `INVALID_OR_EXPIRED_REGISTRATION_TOKEN` | Token expired or malformed |
| `401` | `REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED` | Token was already consumed |
| `409` | `PHONE_NUMBER_IS_ALREADY_REGISTERED` | Account exists |
| `422` | `VALIDATION_ERROR` | Weak password or mismatched confirmation |

---

### Step 4 — Complete the passenger profile (all required data)

```http
POST {base}/auth/onboarding/profile/passenger
Authorization: Bearer <access_token>
```

**Body:**

```json
{
  "fullname": "Ahmad Ali",
  "national_id": "9871234567",
  "age": 28,
  "home_address": "Amman, Jabal Amman, near the 3rd Circle",
  "gender": "male"
}
```

| Field | Type | Required | Rules | Stored in |
|---|---|---|---|---|
| `fullname` | string | Yes | 1–120 chars | `users.full_name` |
| `national_id` | string | Yes | 5–30 chars | `passenger_profiles.national_id` |
| `age` | integer | Yes | 18–100 | `users.age` |
| `home_address` | string | Yes | Non-empty string | `passenger_profiles.home_address` |
| `gender` | string | Yes | `male` or `female` | `users.gender` |

**Success — `201`:**

```json
{
  "passengerProfile": {
    "id": "uuid",
    "passengerId": "uuid",
    "preferredGender": "any",
    "smokingPreference": "no_preference",
    "savedRoutes": [],
    "nationalID": "9871234567",
    "homeAddress": "Amman, Jabal Amman, near the 3rd Circle",
    "emergencyContacts": [],
    "createdAt": "2026-11-14T10:00:00.000Z",
    "updatedAt": "2026-11-14T10:00:00.000Z"
  }
}
```

**Data constraints worth knowing:**

- `national_id` has **no uniqueness constraint** in the current schema; the same ID can be submitted by multiple accounts.
- `home_address` is stored in `VARCHAR(255)`; a longer value fails at the database layer even though the validator only checks that it is a non-empty string.
- `fullname` is stored in `VARCHAR(120)`.
- `age` is stored as a decimal/integer column and is returned as a number by the API.

**Behavior notes:**

- This endpoint is **one-time**. If `national_id` or `home_address` is already set, it returns `409 PASSENGER_PROFILE_ALREADY_EXISTS`.
- It updates both the `users` row (`full_name`, `age`, `gender`) and the `passenger_profiles` row (`national_id`, `home_address`).
- It does **not** set `is_verified = true` and does **not** change `verification_status`. Passenger onboarding is data collection, not identity verification.
- Use the **passenger** endpoint. The driver endpoints are different:
  - `POST /auth/onboarding/profile` (driver, camelCase `fullName`)
  - `POST /auth/onboarding/vehicle` (driver)
  - `GET /auth/onboarding/status` (driver-only)

**Common errors:**

| Status | Code / message | Cause |
|---|---|---|
| `401` | `AUTH_NO_TOKEN` / `AUTH_INVALID_TOKEN` | Missing/invalid access token |
| `403` | `AUTH_INSUFFICIENT_ROLE` | The account's role is not `passenger` (often a driver registration) |
| `403` | `ONLY_PASSENGERS_CAN_SUBMIT_A_PASSENGER_PROFILE` | Service-level role check failed |
| `409` | `PASSENGER_PROFILE_ALREADY_EXISTS` | Onboarding was already completed |
| `422` | `VALIDATION_ERROR` | Missing/invalid field; see the table above |

---

### Step 5 — Verify the completed account

#### `GET /auth/me`

```http
GET {base}/auth/me
Authorization: Bearer <access_token>
```

Expected fields:

```json
{
  "id": "uuid",
  "phone": "+962791234567",
  "countryCode": "JO",
  "fullName": "Ahmad Ali",
  "email": null,
  "role": "passenger",
  "gender": "male",
  "age": 28,
  "avatarUrl": null,
  "isVerified": false,
  "avgRating": 0,
  "status": "active",
  "locale": "ar"
}
```

#### `GET /profile/passenger`

```http
GET {base}/profile/passenger
Authorization: Bearer <access_token>
```

Expected response:

```json
{
  "passenger_profile": {
    "full_name": "Ahmad Ali",
    "age": 28,
    "gender": "male",
    "phone": "+962791234567",
    "national_id": "9871234567",
    "home_address": "Amman, Jabal Amman, near the 3rd Circle"
  }
}
```

> Note the shape difference: the onboarding response uses the Sequelize model shape (`passengerProfile`, camelCase), while `GET /profile/passenger` uses the public serializer (`passenger_profile`, snake_case).

---

### Step 6 — Optional passenger preferences

```http
PUT {base}/profile/passenger
Authorization: Bearer <access_token>
```

All fields are optional:

```json
{
  "preferred_gender": "any",
  "smoking_preference": "non_smoking",
  "national_id": "9871234567",
  "home_address": "Amman, Abdoun",
  "saved_routes": [],
  "emergency_contacts": [
    {
      "name": "Sara Ali",
      "phone": "+962798765432",
      "relation": "sister"
    }
  ]
}
```

| Field | Allowed values |
|---|---|
| `preferred_gender` | `male`, `female`, `any` |
| `smoking_preference` | `no_preference`, `non_smoking`, `smoking_allowed` |
| `national_id` | 5–30 chars |
| `home_address` | String |
| `saved_routes` | Array |
| `emergency_contacts` | Array |

**Success — `200`:**

```json
{
  "passenger_profile": {
    "id": "uuid",
    "passenger_id": "uuid",
    "preferred_gender": "any",
    "smoking_preference": "non_smoking",
    "saved_routes": [],
    "national_id": "9871234567",
    "home_address": "Amman, Abdoun",
    "emergency_contacts": [
      {
        "name": "Sara Ali",
        "phone": "+962798765432",
        "relation": "sister"
      }
    ],
    "created_at": "2026-11-14T10:00:00.000Z",
    "updated_at": "2026-11-14T10:05:00.000Z"
  }
}
```

**Limitations:**

- This endpoint cannot change `full_name`, `age`, or `gender`. Those are only written by the one-time onboarding endpoint.
- If you send no recognized fields, the server returns `422`. Express uses the message key `NO_UPDATABLE_FIELDS_PROVIDED`; Nest returns `VALIDATION_FAILED` with a `details` entry.

---

### Step 7 — Future logins

```http
POST {base}/auth/login
```

```json
{
  "phone": "+962791234567",
  "password": "MySecure@123",
  "role": "passenger"
}
```

The `role` field is mandatory. If it does not match the account's stored role, the server returns:

```json
{
  "status": "error",
  "message": "This account is not registered with the requested role",
  "code": "FORBIDDEN"
}
```

Status: `403`. Internally the message key is `ACCOUNT_ROLE_MISMATCH`; the public `code` is `FORBIDDEN` on both servers.

---

### Step 8 — What the passenger can do next

All of these require the passenger access token:

| Endpoint | Purpose |
|---|---|
| `GET /profile/passenger/home` | Passenger home payload |
| `GET /trips/search/available` | Search published trips |
| `GET /trips/:trip_id` | Trip details |
| `POST /trips/:trip_id/seats/lock` | Lock a seat |
| `POST /bookings` | Create a booking |
| `GET /bookings` | List bookings |
| `POST /bookings/:booking_id/ride/start` | Confirm boarding |
| `POST /bookings/:booking_id/ride/end` | Confirm leaving |
| `POST /bookings/:booking_id/delay` | Report a delay |
| `GET /bookings/:booking_id/route` | Planned route / pickup / recorded path |
| `POST /favorites/drivers` | Add a favorite driver |
| `GET /notifications` | List notifications |
| `POST /support-tickets` | Open a support ticket |

Driver-only endpoints return `403` (message key `AUTH_INSUFFICIENT_ROLE`, public `code: "FORBIDDEN"`) when called with a passenger token. Examples: `POST /trips`, `POST /auth/onboarding/profile`, `POST /auth/onboarding/vehicle`, `GET /auth/onboarding/status`, `GET /driver/*`.

---

## 4. Minimal end-to-end example (curl)

> Replace `BASE`, the phone, OTP, and tokens with real values. The OTP is printed in the server console in development.

```bash
BASE="http://localhost:8000/api"

# Step 1 — use a normal, unused phone; keep role=passenger
curl.exe -s -X POST "$BASE/auth/register/phone" \
  -H "Content-Type: application/json" \
  -d '{"country_code":"JO","phone":"791234567","role":"passenger"}'

# Step 2 — read the OTP from the server console first
curl.exe -s -X POST "$BASE/auth/register/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+962791234567","otp":"123456"}'

# Step 3 — copy registration_token from Step 2
REGISTRATION_TOKEN="<registration_token>"
curl.exe -s -X POST "$BASE/auth/register/password" \
  -H "Authorization: Bearer $REGISTRATION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"MySecure@123","confirmPassword":"MySecure@123"}'

# Step 4 — copy access_token from Step 3
ACCESS_TOKEN="<access_token>"
curl.exe -s -X POST "$BASE/auth/onboarding/profile/passenger" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullname":"Ahmad Ali","national_id":"9871234567","age":28,"home_address":"Amman, Jabal Amman","gender":"male"}'

# Step 5 — verify
curl.exe -s "$BASE/auth/me" -H "Authorization: Bearer $ACCESS_TOKEN"
curl.exe -s "$BASE/profile/passenger" -H "Authorization: Bearer $ACCESS_TOKEN"
```

> The single-quoted JSON works in both PowerShell and bash. In PowerShell, use `curl.exe` (not the `curl` alias) to avoid PowerShell's own command wrapper.

---

## 5. Database state after a successful passenger signup

| Table / column | Expected value |
|---|---|
| `users.role` | `passenger` |
| `users.phone` | Full international number, e.g. `+962791234567` |
| `users.country_code` | `JO` |
| `users.full_name` | `fullname` from Step 4 |
| `users.age` | `age` from Step 4 |
| `users.gender` | `gender` from Step 4 |
| `users.is_verified` | `false` (passenger flow does not verify identity) |
| `users.verification_status` | `unverified` (default) |
| `users.status` | `active` |
| `users.locale` | `ar` (default) |
| `passenger_profiles.passenger_id` | The user's ID |
| `passenger_profiles.national_id` | `national_id` from Step 4 |
| `passenger_profiles.home_address` | `home_address` from Step 4 |
| `passenger_profiles.preferred_gender` | `any` (default) |
| `passenger_profiles.smoking_preference` | `no_preference` (default) |
| `passenger_profiles.saved_routes` | `[]` (default) |
| `passenger_profiles.emergency_contacts` | `[]` (default) |
| `notification_settings` | Default rows created |
| `driver_profiles` | No row |
| `vehicles` | No row |
| `driver_subscriptions` | No row |

---

## 6. Error reference

| Status | Public code / message key | Meaning |
|---|---|---|
| `400` | `BAD_REQUEST` / `INVALID_OTP` | Wrong OTP |
| `400` | `BAD_REQUEST` / `OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE` | OTP expired |
| `400` | `BAD_REQUEST` / `MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE` | Too many attempts |
| `401` | `UNAUTHORIZED` / `AUTH_NO_TOKEN`, `AUTH_INVALID_TOKEN`, `AUTH_TOKEN_EXPIRED` | Missing/expired/invalid access token |
| `401` | `UNAUTHORIZED` / `REGISTRATION_TOKEN_IS_REQUIRED` | Step 3 called without the registration token |
| `401` | `UNAUTHORIZED` / `REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED` | Step 3 token reused or expired |
| `403` | `FORBIDDEN` / `AUTH_INSUFFICIENT_ROLE` | Token role is not allowed for this endpoint |
| `403` | `FORBIDDEN` / `ACCOUNT_ROLE_MISMATCH` | Login `role` does not match the account's stored role |
| `403` | `FORBIDDEN` / `ONLY_PASSENGERS_CAN_SUBMIT_A_PASSENGER_PROFILE` | Passenger onboarding called by a non-passenger |
| `409` | `CONFLICT` / `PHONE_NUMBER_IS_ALREADY_REGISTERED` | Phone already registered |
| `409` | `CONFLICT` / `PASSENGER_PROFILE_ALREADY_EXISTS` | Passenger onboarding already completed |
| `422` | `VALIDATION_ERROR` / `VALIDATION_FAILED` | A body field failed validation (details array included) |
| `422` | `VALIDATION_ERROR` / `NO_UPDATABLE_FIELDS_PROVIDED` | Empty `PUT /profile/passenger` payload (Express wording) |
| `502` / `503` | `SMS_SEND_FAILED` | OTP SMS delivery failed |

Error shape:

```json
{
  "status": "error",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "national_id",
      "message": "National ID must be between 5 and 30 characters",
      "value": "123"
    }
  ]
}
```

---

## 7. Troubleshooting checklist

- **The account comes out as `driver`**
  - Check the Step 1 body. It must contain `"role": "passenger"`.
  - If you used the Postman collection, the saved body contains `"role": "driver"`.
  - Check the phone with `GET /auth/me` or the SQL query above.
  - There is no role-change API; re-register with a new phone or have an operator correct the row.

- **Passenger onboarding returns `403 AUTH_INSUFFICIENT_ROLE`**
  - The access token's role is not `passenger`.
  - Log in with `"role": "passenger"` or inspect the Step 1 request.
  - Driver onboarding endpoints are not interchangeable with passenger onboarding.

- **`409 PASSENGER_PROFILE_ALREADY_EXISTS` on Step 4**
  - The profile already has `national_id` or `home_address`.
  - Read it with `GET /profile/passenger`; use `PUT /profile/passenger` for optional preferences.

- **OTP verification fails**
  - Step 2 must use the full normalized phone, e.g. `+962791234567`.
  - Complete Steps 1–3 within 10 minutes.
  - After 3 failed attempts, request a new OTP with `POST /auth/resend-otp` (`purpose: "register"`).

- **Step 3 fails or the role is unexpectedly missing**
  - The role is held in Redis under `reg_data:{phone}` for 10 minutes. If Redis is cleared, `reg_data` expires, or Step 1 and Step 2 are too far apart, the registration token can lack a usable role.
  - Express does not default a missing role; Nest falls back to `passenger` only when the JWT has no role claim at all. Neither falls back to `driver`.
  - Fix: start again from Step 1 with the correct `role` and complete Steps 1–3 within 10 minutes.

- **`isVerified` is `false` after passenger onboarding**
  - This is expected. The passenger flow stores profile data but does not run identity verification or set `is_verified`.

- **You need to change the passenger's name, age, or gender later**
  - The current contract has no passenger endpoint for that. Only the one-time `POST /auth/onboarding/profile/passenger` writes those `users` columns. `PUT /profile/passenger` updates preferences and profile fields, not `full_name`, `age`, or `gender`.

---

## 8. Endpoint role map (quick reference)

| Endpoint | Required role |
|---|---|
| `POST /auth/register/phone` | Public |
| `POST /auth/register/verify-otp` | Public |
| `POST /auth/register/password` | Registration token |
| `POST /auth/login` | Public (role must match the account) |
| `POST /auth/onboarding/profile/passenger` | `passenger` |
| `GET /profile/passenger` | `passenger` |
| `PUT /profile/passenger` | `passenger` |
| `GET /profile/passenger/home` | `passenger` |
| `GET /profile/passenger/account-summary` | `passenger` |
| `POST /auth/onboarding/profile` | `driver` |
| `POST /auth/onboarding/vehicle` | `driver` |
| `GET /auth/onboarding/status` | `driver` |
| `POST /trips` | `driver` |
| `GET /trips/driver/my-trips` | `driver` |
| `POST /bookings` | `passenger` |
| `GET /bookings` | `passenger` |
