# Masar Postman Collection

Canonical Postman artifacts for the Masar backend.

## Import

1. Import `masar_api_collection.json`.
2. Import `environments/local-e2e.json`.
3. Select the **Masar Local E2E** environment.
4. Set `access_token` after login, or run the Auth requests to populate it.

Default URLs:

- V1: `http://localhost:8000/api`
- V2: `http://localhost:3001/api` (`{{nest_url}}`)

## New in this release

### Passenger ride confirmation

- `Passenger / Booking / Start Ride (Passenger Confirms Boarding)`
- `Passenger / Booking / End Ride (Passenger Confirms Leaving)`

### Driver post-trip confirmation

- `Driver / Trip Management / Confirm Passengers (Post-trip)`
- `Driver / Trip Management / Abandon Trip`

### Admin

- `Admin / Users Management / Permanently Delete Developer Account`

## Developer accounts

| Role | Phone | Password | OTP |
|---|---|---|---|
| Driver | `+962700000001` | `Test@1234` | `000000` |
| Passenger | `+962700000002` | `Test@1234` | `000000` |

The permanent-delete request only works for these configured developer phones.
See `docs/developer-accounts.md`.

## Notes

- Request tests use `pm.variables.get(...)`, so values work whether they are set
  on the collection or the environment.
- The old collection under `main-server/postman/` is kept as historical
  reference; this root folder is the current import source.
- Full endpoint notes:
  - `docs/passenger-ride-confirmation-change-catalog.md`
  - `docs/trip-integrity-change-catalog.md`
  - `docs/developer-accounts.md`
