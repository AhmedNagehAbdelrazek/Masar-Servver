# Developer Accounts

Two dedicated accounts are seeded by both backends and always accept the fixed
OTP `000000`. They are separate from the legacy `TEST_PHONES` and cannot be
created by normal registration.

## Credentials

| Role | Phone | Password | OTP |
|---|---|---|---|
| Driver | `+962700000001` | `Test@1234` | `000000` |
| Passenger | `+962700000002` | `Test@1234` | `000000` |

The driver account is seeded with a verified Toyota Corolla (`DEV-0001`, 4
seats) so it can publish a trip immediately. The passenger account needs no
extra setup.

> These credentials are public by design. Change `DEV_DRIVER_PHONE`,
> `DEV_PASSENGER_PHONE`, or `DEV_ACCOUNT_PASSWORD` before deploying if your
> environment must not use the defaults.

## Configuration

Both servers read the same environment variables:

```text
DEV_DRIVER_PHONE=+962700000001
DEV_PASSENGER_PHONE=+962700000002
DEV_ACCOUNT_PASSWORD=Test@1234
SEED_DEV_ACCOUNTS=true
```

- `SEED_DEV_ACCOUNTS=false` disables the developer-account seed.
- The Main Server calls `seedDevAccounts()` on boot and from `npm run seed`.
- V2 seeds the same accounts in `SeedService`, including in production. This
  runs independently of `SEED_ON_BOOT`; only `SEED_DEV_ACCOUNTS=false` opts
  out.
- Restarting either server resets the developer password to
  `DEV_ACCOUNT_PASSWORD` and restores the expected role.

The fixed OTP applies to every OTP flow:

- registration OTP
- forgot-password OTP
- resend OTP

Request the OTP through the normal endpoint; the generated code is immediately
`000000`, so no SMS wait is needed. The seeded accounts already have passwords,
so login does not require an OTP.

## Permanently delete a developer account

Admin only. The account must use one of the configured developer phone numbers.

### V1

V1 is mounted at `API_BASE_PATH` (typically `/api/v1`):

```http
DELETE {API_BASE_PATH}/admin/users/:user_id
Authorization: Bearer <admin_access_token>
```

For example: `DELETE /api/v1/admin/users/:user_id`. Local setups that set
`API_BASE_PATH=/api/` use `DELETE /api/admin/users/:user_id`.

### V2

```http
DELETE /api/v2/admin/users/:user_id
Authorization: Bearer <admin_access_token>
```

### Success `200`

```json
{
  "message": "Developer account and all related history deleted successfully",
  "deleted": true,
  "user": {
    "id": "user_uuid",
    "phone": "+962700000001",
    "role": "driver"
  },
  "deleted_records": {
    "trips": 3,
    "bookings": 5,
    "vehicles": 1,
    "users": 1
  }
}
```

`deleted_records` only includes tables that had rows. The response is sent
after the whole purge commits.

### Errors

| HTTP | Code | Meaning |
|---|---|---|
| 404 | `NOT_FOUND` | User does not exist |
| 403 | `NOT_A_DEVELOPER_ACCOUNT` | Phone is not a configured developer number |
| 403 | `FORBIDDEN` | Caller is not an admin |

### What gets deleted

The purge runs in one transaction and removes the developer user plus:

- trips, trip attributes, stops, seats, locations, reminders
- bookings, ratings, delay events, SOS events
- ride requests and offers
- vehicles, driver/passenger profiles, uploaded document images
- driver subscriptions and subscription transactions
- verification changes and document reviews
- complaints, penalties, support tickets and their messages
- sent/received messages, notifications, notification settings
- favorites, recent searches, deletion requests
- audit rows performed by the user or recorded against the user record
- the `users` row itself

Rows owned by other users are left in place, except records that belong to the
developer user's trips/bookings (for example, a passenger booking on the
developer driver's trip).

The matching Postman request is in `postman/masar_api_collection.json` under
**Admin / Users Management / Permanently Delete Developer Account**.
