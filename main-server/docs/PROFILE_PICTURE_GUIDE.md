# Profile Picture (Avatar) — Update & Display Guide

> For the mobile (Flutter) / web client developers. Answers two questions:
> **how does a driver or passenger update their picture**, and **where does any
> screen read a picture from**. Companion to `ENDPOINTS_AND_FLOWS.md`,
> `Driver_Profile_Settings_Pages..md` (spec 010) and the Postman collection
> (`Upload Image`, `Update Personal Data`, and passenger `Update My Profile` requests).

## TL;DR

| Who | Update picture | Read own picture | See the other side's picture |
|---|---|---|---|
| **Driver** | ✅ `POST /api/upload` → `PUT /api/driver/personal-data` | `GET /api/driver/personal-data`, `GET /api/auth/me`, `GET /api/driver/home` | Passenger avatar: `GET /api/trips/:id` |
| **Passenger** | ✅ `POST /api/upload` → `PUT /api/profile/passenger` | `GET /api/profile/passenger`, `GET /api/auth/me` | Driver avatar: trip search, bookings list/detail, passenger home |

Storage: one column `users.avatar_url` (shared by all roles), `null` = no picture.

---

## 1) How avatars are stored

- The avatar is a **plain string** on `users.avatar_url`. The server does *not*
  check that it points to a real image — always upload through `/api/upload`
  and save the returned `url`; never send an arbitrary string.
- The value has two possible shapes depending on `UPLOAD_PROVIDER`
  (`cloudinary | local | s3`):
  - **absolute URL** (`https://res.cloudinary.example/...`) — Cloudinary/S3/Garage
  - **relative path** (`/uploads/<file>`) — `local` provider (the docker-compose
    default). The client must prefix the server origin, see §4.5.
- Admin / verification / subscription payloads run the value through
  `toAbsoluteMediaUrl` (`utils/mediaUrl.ts`): relative paths get prefixed with
  `PUBLIC_BASE_URL` (or `API_PUBLIC_URL` / `LOCAL_UPLOAD_BASE_URL`) **if
  configured**, otherwise the raw value passes through. App-facing endpoints
  (homes, bookings, trips, `auth/me`) always return the **raw** stored value —
  so the client must normalize either way.

---

## 2) Updating the driver picture — two steps

### Step 1 — upload the image

```http
POST /api/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

- Multipart field name **must be `file`**, single file per request.
- Allowed types: **JPEG / PNG / WebP / GIF**, max size **10 MB**.

Response `200` (raw JSON, no envelope wrapper):

```json
{
  "id": "00000000-0000-4000-8000-000000000abc",
  "url": "/uploads/1732694400-a1b2c3d4e5f6.jpg",
  "filename": "1732694400-a1b2c3d4e5f6.jpg",
  "cached": false,
  "duplicate": false,
  "provider": "local"
}
```

- Uploads are deduplicated by **SHA-256**: re-uploading the same bytes returns
  the existing row with `"duplicate": true, "cached": true` and the **same
  `url`** — treat this as success, not an error.

Errors (envelope `{status:'error', message, code}`):

| Status | Code | When |
|---|---|---|
| 400 | `NO_FILE_UPLOADED` | no multipart `file` field |
| 400 | `INVALID_FILE_TYPE` | type not jpeg/png/webp/gif |
| 413 | `FILE_TOO_LARGE` | file > 10 MB (multer `LIMIT_FILE_SIZE`) |

### Step 2 — save it on the profile

```http
PUT /api/driver/personal-data
Authorization: Bearer <driver_token>
Content-Type: application/json

{ "avatar_url": "<url returned by step 1>" }
```

Rules (from `Services/personalDataService.ts`):

- `avatar_url` is in `editable_now` — it is **always editable**, in every
  verification state (`unverified | pending | rejected | approved`). Identity
  and vehicle fields lock during review; the avatar never locks.
- An avatar-only edit **does not re-trigger verification** — the response has
  `"requires_verification": false` and the account stays where it is.
- Send `"avatar_url": null` to **remove** the picture.
- You may batch it with other editable fields (`display_name`, `phone`, `age`).
  Identity/vehicle fields in the same body will still follow their own lock
  rules (403 `FIELD_LOCKED` + `LOCKED_FIELDS_CANNOT_BE_MODIFIED` while
  pending/approved).
- Non-string value (number, object) → `422 VALIDATION_ERROR` with
  `AVATAR_URL_MUST_BE_A_STRING` in `details`.
- Account guards: banned → 403 `ACCOUNT_IS_BANNED`; suspended → 403
  `SUSPENDED_ACCOUNTS_CANNOT_PERFORM_THIS_ACTION` (suspended is read-only).

Response `200` — the full personal-data view, already updated:

```json
{
  "personal_data": {
    "full_name": "Ahmad Al",
    "display_name": null,
    "country_code": "+962",
    "phone": "+962790000000",
    "email": null,
    "email_verified": false,
    "age": 32,
    "gender": "male",
    "gender_label": "ذكر",
    "avatar_url": "/uploads/1732694400-a1b2c3d4e5f6.jpg",
    "national_id": "9876543210"
  },
  "vehicle": { "...": "..." },
  "editable_now": ["display_name", "phone", "age", "avatar_url"],
  "locked_fields": [],
  "rejected_fields": [],
  "verification_status": "approved",
  "requires_verification": false,
  "message": "تم تحديث البيانات بنجاح"
}
```

### End-to-end example

```bash
TOKEN="<driver access token>"
BASE="<server origin, e.g. http://localhost:8000>"

# 1. upload
URL=$(curl -s -X POST "$BASE/api/upload" \
  -H "Authorization: Bearer $TOKEN" -F "file=@avatar.jpg" | jq -r .url)

# 2. save
curl -s -X PUT "$BASE/api/driver/personal-data" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"avatar_url\":\"$URL\"}"
```

---

## 3) Updating the passenger picture — two steps

Use the **same `POST /api/upload` request from §2 Step 1**, then save the
returned URL on the passenger profile:

```http
PUT /api/profile/passenger
Authorization: Bearer <passenger_token>
Content-Type: application/json

{ "avatar_url": "<url returned by the upload>" }
```

Rules (from `Services/passengerProfileService.ts`):

- `avatar_url` can be sent alone or together with any profile/preferences
  fields. At least one supported field is still required.
- Send `"avatar_url": null` to **remove** the picture.
- Avatar changes are cosmetic: they **do not change** `isVerified`,
  `verification_status`, or any verification timestamps. Only changes to
  `national_id` or `home_address` trigger the existing passenger re-verification
  behavior.
- Non-string value (number, object) → `422 VALIDATION_ERROR` with
  `AVATAR_URL_MUST_BE_A_STRING` in `details`.
- Passenger onboarding (`POST /api/auth/onboarding/profile/passenger`) still
  does not accept an avatar; upload and update the picture after onboarding.

Response `200` includes the saved URL:

```json
{
  "passenger_profile": {
    "id": "d947d357-aaf0-4898-a3f2-72c4d04efbad",
    "passenger_id": "fb000000-0000-4000-8000-000000000001",
    "preferred_gender": "any",
    "smoking_preference": "no_preference",
    "saved_routes": [],
    "national_id": "9871234567",
    "home_address": "Amman, Jabal Amman",
    "emergency_contacts": [],
    "created_at": "2026-11-27T10:00:00.000Z",
    "updated_at": "2026-11-27T10:05:00.000Z",
    "avatar_url": "/uploads/1732694400-a1b2c3d4e5f6.jpg"
  }
}
```

```bash
TOKEN="<passenger access token>"
BASE="<server origin, e.g. http://localhost:8000>"

URL=$(curl -s -X POST "$BASE/api/upload" \
  -H "Authorization: Bearer $TOKEN" -F "file=@avatar.jpg" | jq -r .url)

curl -s -X PUT "$BASE/api/profile/passenger" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"avatar_url\":\"$URL\"}"
```

---

## 4) Viewing the picture — every read path

### 4.1 Your own picture

| Endpoint | JSON path | Notes |
|---|---|---|
| `GET /api/auth/me` | `avatarUrl` | **Any role** (driver, passenger, admin). Reads the DB directly → reflects changes immediately. |
| `GET /api/profile/passenger` | `passenger_profile.avatar_url` | Passenger. Raw stored value; also returned by the PUT update. |
| `GET /api/driver/personal-data` | `personal_data.avatar_url` | Driver. Raw stored value. |
| `GET /api/driver/home` | `profile.profile_picture_url` | Driver. Built fresh on every request (no home cache). |
| `GET /api/driver/profile` | `profile.profile_picture_url` | Driver (aggregated profile). |
| `GET /api/driver/dashboard` | `account.profile_picture_url` | Driver (legacy dashboard). |

### 4.2 Passenger → driver's picture

| Endpoint | JSON path | Notes |
|---|---|---|
| `GET /api/trips/search/available` | `trips[].driver.profile_picture_url` (also `driver.avatar_url`) | Search results. |
| `GET /api/bookings`, `GET /api/bookings/:id` | `driver.image` | Enriched booking list/detail. |
| `GET /api/profile/passenger/home` | `next_booking.driver.image`, last-trip entries `driver.image` | Passenger home. Built fresh on every request (no home cache). |
| `GET /api/bookings/:id/driver-profile` | — | **Does not return an avatar** (reveal = name, phone, stats, vehicle). Gap, §6. |

### 4.3 Driver → passenger's picture

| Endpoint | JSON path | Notes |
|---|---|---|
| `GET /api/trips/:id` | `passengers[].passenger.profile_picture_url` | Trip details; **confirmed** bookings only; access: trip driver, confirmed passenger, or admin. |
| `GET /api/driver/home` (next trip) | — | `passengers[]` has name/phone only, **no avatar**. Gap, §6. |
| `GET /api/driver/ratings` | — | Reviews include rater `full_name` only, **no avatar**. Gap, §6. |

### 4.4 Admin surfaces

Admin dashboard payloads (`GET /api/admin/dashboard/...` — dossier header,
trips, evaluations, bookings) return `avatar_url` / `passenger_avatar` already
converted to **absolute** URLs via `toAbsoluteMediaUrl` — absolute when
`PUBLIC_BASE_URL` is configured on the server, raw otherwise.

### 4.5 Resolving the URL in the app — do this everywhere

The value you receive is one of:

1. **`null`** → render a placeholder (no picture set).
2. **Absolute** (`http://` / `https://` / `//` / `data:` / `blob:` or a
   schemeless host) → use as-is.
3. **Relative** (`/uploads/<file>`) → prefix the API origin.

```dart
String? resolveAvatarUrl(String? raw, String apiOrigin) {
  final value = raw?.trim();
  if (value == null || value.isEmpty) return null;

  if (value.startsWith('//')) return 'https:$value';

  // http(s), data:, blob:, and any other explicit scheme pass through.
  final uri = Uri.tryParse(value);
  if (uri != null && uri.hasScheme) return value;

  // A schemeless public host such as cdn.example.com/avatar.jpg.
  final schemelessHost = RegExp(
    r'^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:/|$)',
    caseSensitive: false,
  );
  if (schemelessHost.hasMatch(value)) return 'https://$value';

  // Local uploads: "/uploads/avatar.jpg" -> "$apiOrigin/uploads/avatar.jpg".
  final base = apiOrigin.endsWith('/')
      ? apiOrigin.substring(0, apiOrigin.length - 1)
      : apiOrigin;
  return '$base/${value.replaceFirst(RegExp(r'^/+'), '')}';
}
```

**Server-side recommendation:** set `PUBLIC_BASE_URL` (or
`API_PUBLIC_URL`) so admin/verification/subscription URLs are absolute.
App-facing endpoints still return the raw value, so the client helper above is
needed regardless of provider.

### 4.6 Flutter — reusable avatar widget (no extra packages)

This widget handles **null, relative URLs, loading, invalid URLs, and server
errors**. If any image fails, it falls back to the same person placeholder.

```dart
import 'package:flutter/material.dart';

class MasarAvatar extends StatelessWidget {
  const MasarAvatar({
    super.key,
    required this.rawUrl,
    required this.apiOrigin,
    this.radius = 24,
  });

  final String? rawUrl;
  final String apiOrigin;
  final double radius;

  Widget _placeholder() {
    return ColoredBox(
      color: const Color(0xFFE0E0E0),
      child: Icon(Icons.person, size: radius, color: Colors.black45),
    );
  }

  @override
  Widget build(BuildContext context) {
    final url = resolveAvatarUrl(rawUrl, apiOrigin);
    final diameter = radius * 2;

    return ClipOval(
      child: SizedBox(
        width: diameter,
        height: diameter,
        child: url == null
            ? _placeholder()
            : Image.network(
                url,
                fit: BoxFit.cover,
                gaplessPlayback: true,
                filterQuality: FilterQuality.medium,
                // Decode close to the rendered size instead of full resolution.
                cacheWidth:
                    (diameter * MediaQuery.devicePixelRatioOf(context)).round(),
                loadingBuilder: (context, child, progress) {
                  return progress == null ? child : _placeholder();
                },
                errorBuilder: (context, error, stackTrace) => _placeholder(),
              ),
      ),
    );
  }
}
```

Use it anywhere by passing the **raw** API value; do not prefix `/uploads`
yourself:

```dart
const apiOrigin = 'https://api.example.com'; // no trailing slash required

// Current driver or passenger from GET /api/auth/me
MasarAvatar(rawUrl: me['avatarUrl'] as String?, apiOrigin: apiOrigin);

// Passenger profile from GET /api/profile/passenger
MasarAvatar(
  rawUrl: profile['passenger_profile']['avatar_url'] as String?,
  apiOrigin: apiOrigin,
  radius: 40,
);

// Driver personal data from GET /api/driver/personal-data
MasarAvatar(
  rawUrl: data['personal_data']['avatar_url'] as String?,
  apiOrigin: apiOrigin,
);

// Driver shown in a booking: driver.image
MasarAvatar(
  rawUrl: booking['driver']?['image'] as String?,
  apiOrigin: apiOrigin,
);

// Passenger shown in trip details: passenger.profile_picture_url
MasarAvatar(
  rawUrl: row['passenger']?['profile_picture_url'] as String?,
  apiOrigin: apiOrigin,
);
```

For production builds, configure `apiOrigin` per environment (dev, staging,
production) rather than hardcoding it. On an Android emulator, a server running
on your computer is usually reached at `http://10.0.2.2:8000`, not
`http://localhost:8000`.

---

## 5) FAQ / common pitfalls

- **"I updated the picture but still see the old one."**
  1. Read `GET /api/auth/me` (passenger: `GET /api/profile/passenger`, driver:
     `GET /api/driver/personal-data`) to confirm the new value was saved.
  2. The stored value is **raw**: with the local provider it is
     `/uploads/...`, not a full URL. If your image widget gets a relative path
     it will show nothing — run §4.5's resolver first.
  3. Make sure you PUT JSON to `/api/profile/passenger` (passenger) or
     `/api/driver/personal-data` (driver) — neither accepts multipart.
  4. If you are displaying an `Image.network`, use the §4.6 widget's
     `errorBuilder` output during debugging and check the resolved URL in a
     browser.
- **`duplicate: true` on upload** — success, not an error. Same bytes → same
  stored `url`.
- **413 `FILE_TOO_LARGE`** — compress/resize client-side before upload (≤ 10 MB,
  jpeg/png/webp/gif only).
- **422 `VALIDATION_ERROR` with `AVATAR_URL_MUST_BE_A_STRING`** — you sent a
  non-string `avatar_url` (e.g. a number or nested object).
- **Passenger avatar updates preserve verification** — only `national_id` and
  `home_address` changes can restart passenger verification; `avatar_url` never
  does.
- **`avatarUrl` vs `avatar_url` vs `image` vs `profile_picture_url`** — the
  field name differs per endpoint (camelCase on `auth/me`, snake_case on most
  others, `image` on booking/passenger-home driver blocks). The tables in §4
  are the source of truth.

---

## 6) Remaining server gaps & possible follow-ups (as of 2026-11-27)

**Implemented:** passengers can now update `avatar_url` through
`PUT /api/profile/passenger`, and both the PUT response and
`GET /api/profile/passenger` return it. Driver and passenger update flows use
the same upload endpoint.

1. **`GET /api/bookings/:id/driver-profile`** (driver reveal) — include the
   avatar (`avatar_url` is already selected from the DB, just not serialized).
2. **Driver home next-trip `passengers[]`** and **`GET /api/driver/ratings`
   reviews** — include passenger avatar.
3. Longer term: constrain `avatar_url` to URLs of rows in `uploaded_images`
   instead of accepting any string.

Updating a picture is now supported for **both drivers and passengers**.
