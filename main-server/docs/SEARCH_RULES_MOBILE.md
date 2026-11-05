# Masar — Search Rules for the Mobile App

**Audience:** mobile team (driver + passenger apps)
**Applies to:** Express API v1 (`/api/...`) **and** Nest API v2 (`/api/v2/...`) — both share these rules
**Verified:** live against the dev server on 2026-11-04 (Asia/Amman) — every rule below was executed, not inferred

> **Why this document exists:** the search endpoints do exactly what you send — no fuzzy matching, no automatic "relaxed" retry, no city synonyms. If the app sends a filter that has no match, the response is an empty list, not "results for the other filters". The rules below are the contract; **section 4** shows the client-side fallback pattern that produces the "show other results" UX you want.

---

## 0. Golden rules (read this first)

1. **Cities are exact strings.** `Amma` → 0 results. `amman` (lowercase) → 0 results. Use the shared city list, same spelling/case used when drivers create trips.
2. **Send `origin_city` + `destination_city` together.** One alone is allowed but returns a broad list (all future trips from/to that city).
3. **`date` is a range START, not a single day** — it returns that Jordan day **and every later day**. A later date **hides earlier** trips.
4. **Dates and times are Asia/Amman (UTC+3) calendar values.** Never derive them from a UTC slice near midnight (see §2.3).
5. **Time window:** send `time_from` **and** `time_to` together, `HH:MM`, `time_from < time_to`. `time_from` alone is a cutoff that still includes later days; `time_to` alone cuts at the anchor day.
6. **All filters are ANDed.** Any provided filter with no match ⇒ empty response. No server-side fallback.
7. **`seats` = minimum available seats.** Asking for more seats than any vehicle has ⇒ empty list.
8. **`vehicle_type` and `gender_preference` must be omitted when unselected.** Empty strings / invalid values ⇒ **422**.
9. **`gender_preference=women_only|men_only` returns ONLY trips explicitly marked that way** — all-gender trips are excluded. Warn the user in the UI.
10. **The driver request board has no city/date/time filtering server-side.** Filter locally for display only.

---

## 1. Endpoints

| Flow | Endpoint (v1 / v2) | Used by |
|---|---|---|
| Search published trips | `GET /trips/search/available` | passenger |
| Ranked candidates for a posted ride request | `GET /ride-requests/{request_id}/matches` | passenger |
| List open ride requests (board) | `GET /ride-requests` | driver |
| Driver's own trips | `GET /trips/driver/my-trips` | driver |
| Requests the driver accepted (with embedded trip) | `GET /driver/offers?status=accepted` | driver |

All require `Authorization: Bearer <access_token>`. `base_url` = `http://<host>/api` (v1) or `http://<host>/api/v2` (v2).

---

## 2. Passenger — trip search (`GET /trips/search/available`)

**Response:** `200 { trips: [...], returning_trips: [...] }` — each trip is the raw published trip (camelCase fields, e.g. `originCity`, `departureTime`, `availableSeats`, `farePerSeat`, `status`) plus serialized `driver` and `vehicle` objects.

### 2.1 Parameter table

| Parameter | Required? | Format | Behaviour / rule |
|---|---|---|---|
| `origin_city` | optional (recommended with destination) | exact string, ≤100 chars, trimmed | Exact, **case-sensitive** match against the trip's stored city. No partial words, no synonyms. `origin_city == destination_city` ⇒ 0 results. |
| `destination_city` | optional (recommended) | exact string, ≤100 chars | Same rules as origin. One city alone ⇒ broad list (all future trips matching that side). |
| `date` | optional | `YYYY-MM-DD` in **Asia/Amman** | **Range start (inclusive):** returns trips departing that Jordan day *or any later day*. Past Jordan dates ⇒ **422** (message key `DATE_CANNOT_BE_IN_THE_PAST`). A later date **excludes** earlier future trips. |
| `return_date` | optional | `YYYY-MM-DD` | Only used when **both cities** are sent; otherwise validated but ignored. Must be ≥ `date` and ≥ Jordan today, else **422**. Populates `returning_trips` with origin/destination swapped. |
| `time_from` | optional | `HH:MM` 24h (Jordan wall-clock) | **With `time_to`:** window `[from, to]` on the departure's time-of-day. **Alone:** cutoff — departures at/after `<anchor day> from`, **including later days**. |
| `time_to` | optional | `HH:MM` | **Alone:** departures from *now* until `<anchor day> to` (anchor = `date`, or today). `time_from > time_to` ⇒ **422** (message key `TIME_FROM_AFTER_TIME_TO`). Equal values are technically accepted but act as an exact-minute window — forbid in the UI. |
| `seats` | optional | integer ≥ 1 | Minimum available seats. `seats=2` excludes trips with 1 left. Asking for more than the vehicle capacity (e.g. `seats=4` on a 1-seat-left trip) ⇒ 0 results. |
| `vehicle_type` | optional | `sedan` \| `suv` \| `van` \| `bus` \| `hatchback` (lowercase) | Only trips whose vehicle has that type. **Omit when unselected** — an empty value (`vehicle_type=`) ⇒ **422**. `SEDAN` (uppercase) ⇒ **422**. |
| `gender_preference` | optional | `all` \| `women_only` \| `men_only` | `all` = no filtering. **`women_only`/`men_only` return only trips explicitly marked with that value** — trips marked `all` are excluded. |

No parameter is mandatory. An empty call returns every published trip with ≥1 available seat.

### 2.2 City matching (verified)

| Request | Result |
|---|---|
| `origin_city=Amman&destination_city=Irbid` | ✅ matches |
| `origin_city=Amma&destination_city=Irbi` (partial) | ❌ 0 |
| `origin_city=amman&destination_city=irbid` (lowercase) | ❌ 0 |
| `origin_city=Amman` only | ✅ all future trips from Amman |
| `origin_city=Amman&destination_city=Amman` | ❌ 0 |

**Mobile rule:** city fields must be pickers backed by one canonical list shared with trip creation — never free-text. Normalize to the exact stored value before sending.

### 2.3 Dates are Asia/Amman dates (verified, important)

At 21:04 UTC on 2026-11-03 it was already **2026-11-04 in Jordan**:

| Sent `date` | Result |
|---|---|
| `2026-11-03` (UTC date = Jordan *yesterday*) | ❌ 422 `DATE_CANNOT_BE_IN_THE_PAST` |
| `2026-11-04` (Jordan today) | ✅ 3 trips |

**Mobile rule:** compute "today", "tomorrow", and date-picker values in `Asia/Amman` (UTC+3), and always send `YYYY-MM-DD`. Do not slice `new Date().toISOString()` — near midnight it produces the wrong Jordan day.

### 2.4 Date range semantics (verified)

| Sent | Result |
|---|---|
| `date=<Jordan today>` | returns trips from today **and all later days** |
| `date=+60 days` | **0 trips** — earlier future trips are excluded (range start, not range end) |
| `date=<past Jordan date>` | ❌ 422 |

**Mobile rule:** if the UI offers a *single-day* picker, either (a) treat it as "from this day onward" and label it so, or (b) display only the trips whose `departureTime` falls on the chosen Jordan day (client-side filter). Do not assume the API returns one day only.

### 2.5 Time windows (verified — trip departs 08:00 Jordan)

| Sent (with cities + date) | Result | Why |
|---|---|---|
| `time_from=06:00` only | ✅ 1 trip | cutoff: 08:00 ≥ 06:00 — and later-day trips would also pass |
| `time_to=23:00` only | ❌ 0 trips | upper bound = anchor day 23:00; this trip departs the **next** day |
| `time_from=06:00&time_to=10:00` | ✅ 1 trip | 08:00 falls inside the window |
| `time_from=09:00&time_to=10:00` | ❌ 0 trips | window excludes the 08:00 departure |
| `time_from=12:00&time_to=09:00` | ❌ 422 | from > to |
| `time_from=08:00&time_to=08:00` | ✅ 1 trip | equal bounds = exact-minute window — allowed but useless; disallow in UI |

**Mobile rule:** always send both bounds; enforce `from < to`; a window that doesn't contain the departure's clock time can legitimately return nothing.

### 2.6 Seats / vehicle / gender (verified)

| Sent | Result |
|---|---|
| `seats=1` on a 1-seat-left trip | ✅ |
| `seats=2` on a 1-seat-left trip | ❌ 0 |
| `vehicle_type=sedan` | ✅ |
| `vehicle_type=bus` (none in results) | ❌ 0 |
| `vehicle_type=` (empty) | ❌ 422 |
| `gender_preference=all` | ✅ (no filter) |
| `gender_preference=women_only` (all trips are `all`) | ❌ 0 — **women_only excludes all-gender trips** |

---

## 3. Combination matrix — what the app may pair

| Combination | API behaviour | Mobile guidance |
|---|---|---|
| `origin_city` + `destination_city` | ✅ filters both sides | Recommended default |
| One city only | ⚠️ broad results | Allowed, but show "showing all trips from/to …" |
| `date` + `time_from` + `time_to` | ✅ time-of-day window across the whole range | Recommended |
| `time_from` without `time_to` (or vice versa) | ⚠️ cutoff semantics (see §2.5) | **Forbid** in UI; require both |
| `time_from` ≥ `time_to` | ⛔ 422 (equal allowed but pointless) | **Forbid**; require strictly less |
| `return_date` without both cities | ⚠️ ignored | Only enable round-trip when both cities set |
| `return_date` < `date` | ⛔ 422 | Validate client-side |
| `date` in the past (Jordan) | ⛔ 422 | Min date = Jordan today |
| `origin_city == destination_city` | ⛔ 0 results | Validate client-side |
| `seats` > vehicle capacity | ⛔ 0 results | Clamp `seats` to 1–4 (the app's max seats) |
| `vehicle_type=` / `gender_preference=` empty | ⛔ 422 | **Omit** the parameter when unselected |
| `gender_preference=women_only/men_only` | ⚠️ excludes `all` trips | Warn: "only women-only/men-only trips will be shown" |
| `date` far in the future | ⚠️ excludes earlier trips | If the user sees 0, offer "any date" (drop `date`) |

---

## 4. Optional filters and "no match" — the exact semantics

**The API ANDs every provided filter.** There is no server-side relaxation, threshold, or fallback. Expected outcomes:

| Situation | Response |
|---|---|
| All provided filters match at least one trip | those trips |
| Any one provided filter matches nothing | **empty list** — the server does not "still show the other filters" |

This is by design: a result either satisfies the user's stated filters or it doesn't. To get the UX "show other options when an optional filter has no match", implement the staged fallback **in the app**:

```
L0  Validate inputs locally (cities from picker, date ≥ Jordan today,
    from < to, seats 1..4, omit empty params).
L1  Full search with all chosen filters.
L2  If empty and a time window was set → retry without time_from/time_to.
L3  If empty and vehicle_type / gender_preference were set → retry with them cleared.
L4  If empty and seats > 1 → retry with seats = 1.
L5  If empty and a date was set → retry without date ("all upcoming").
L6  Still empty → show the empty state with suggestions
    (change destination, try tomorrow, remove constraints).
```

Whenever a fallback level returns results, tell the user which filter was relaxed — never silently drop a selected filter. Only the **path parameters** (`request_id`, `trip_id`) are truly mandatory; everything else in this document is optional.

---

## 5. Driver — ride-request board (`GET /ride-requests`)

| Parameter | Required? | Format | Behaviour |
|---|---|---|---|
| `status` | optional | `open` (default) \| `offered` \| `accepted` \| `expired` \| `cancelled` | Filters the **global** list by status. Any other value ⇒ **422**. |
| `page` | optional | integer ≥ 1 (default 1) | Pagination. |
| `limit` | optional | integer 1–100 (default 20) | Pagination. |

**Rules:**

- The board lists requests from **other passengers only**; it is **not scoped to one driver** and has **no city/date/time filtering** server-side. Unknown query params (e.g. `origin_city`, `date`) are accepted but **silently ignored** — verified: same rows returned.
- To get **requests this driver accepted** (with the trip summary embedded), use `GET /driver/offers?status=accepted` — each row has `request`, `trip` (`trip_id`, route, departure, seats, status) and `booking_id`.
- **Mobile rule:** any route/date filtering on the board is client-side **within the fetched page(s)**. If you filter locally, say so in the UI ("filtering loaded results") and load more pages as the user scrolls; otherwise the user may see "no results" while matches exist on later pages.

---

## 6. Passenger — ride-request matches (`GET /ride-requests/{request_id}/matches`)

- **Owner only** (the passenger who posted the request); any other caller ⇒ **403**. Passenger role only.
- Returns **ranked candidates, not route-filtered**: every `published` trip with enough seats whose departure is within **origin_time − 24h … + 48h**, sorted by a score (route match is the strongest signal, then time proximity, free seats, gender compatibility). A different-route trip **can** appear if it falls in the window.
- There is **no status guard** on this endpoint (it works for requests in any status and simply scores the trip window), but the app should only offer it for `open`/`offered` requests — expired/cancelled requests show a closed state.
- Does not book anything.

**Mobile rule:** present these as "suggested trips" and always render the actual `origin`/`destination` of each suggestion; do not imply they are same-route matches.

---

## 7. Driver — my trips (`GET /trips/driver/my-trips`)

| Parameter | Required? | Behaviour |
|---|---|---|
| `status` | optional | **Exact single status** (`published`, `full`, `in_progress`, `ongoing`, `completed`, `cancelled`). No comma lists. |

**Rules:**

- Without `status`: **all** trips of the driver, including ones created by accepting ride requests. Trips are **not marked** as "from a ride request" here — use `/driver/offers?status=accepted` for that screen.
- `?status=published` **hides `full` trips** (an accepted booking can fill the last seat and flip the trip to `full`). For an "upcoming trips" screen query unfiltered, or run two calls (`published` + `full`), or filter locally.
- No pagination; response rows use snake_case `trip_id`, `available_seats`, `status` (different from the trip-search shape — see the endpoint doc).
- Reading this endpoint also closes out trips whose departure has already passed (status auto-updates).

---

## 8. Error handling cheat-sheet

| Status / code | Meaning | App action |
|---|---|---|
| `422` `VALIDATION_ERROR` | Bad query values (field-level problems in `details[]`) | Show the field-specific message from `details[]` |
| `422` `VALIDATION_ERROR` + message key `DATE_CANNOT_BE_IN_THE_PAST` | `date`/`return_date` is before Jordan today (or `return_date < date`) | Recompute dates in Asia/Amman; min = Jordan today |
| `422` `VALIDATION_ERROR` + message key `TIME_FROM_AFTER_TIME_TO` (in `details[]`) | `time_from` > `time_to` | Enforce `from < to` |
| `401` `UNAUTHORIZED` | Missing/expired token | Refresh/login |
| `403` | Wrong role or not the owner | Hide the action for that role |
| `404` | Trip/request gone | Re-fetch lists |
| `409` | State changed (e.g. request no longer accepting) | Re-fetch the request; show its current status |

---

## 9. Do / Don't checklist (mobile)

**Do**
- Use city pickers backed by the canonical city list; send exact strings.
- Send both cities for route search; both time bounds when a time filter is on.
- Compute dates in `Asia/Amman`; format `YYYY-MM-DD`; times `HH:MM` 24h.
- Clamp `seats` to 1–4; omit `vehicle_type`/`gender_preference` when unselected.
- Implement the staged fallback (§4) and tell the user when a filter was relaxed.
- Use `/driver/offers?status=accepted` for "trips I accepted from requests".

**Don't**
- Don't send partial or lowercase city names; don't send empty `vehicle_type=` / `gender_preference=`.
- Don't treat `date` as a single-day filter.
- Don't send `time_from`/`time_to` without the pair, or equal values.
- Don't rely on server-side filtering for the driver board or for "upcoming trips" (`?status=published` misses `full`).
- Don't present ride-request matches as guaranteed same-route results.
