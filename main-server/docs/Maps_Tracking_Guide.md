# Maps, Tracking & Journey — Server Guide

> Companion to `MAPS_INTEGRATION_PLAN.md` (build input) and `specs/013-maps-tracking-journey/`.
> Server runs `MAPS_MOCK=true` until billing is attached; behavior is identical, distances are fixture values.

## Overview

Drivers publish trips with map coordinates and get a stored route. Passengers book
with a stop or a custom pickup near the route. During `in_progress` trips the
driver streams positions; each passenger sees the driver plus the ETA to their
own pickup only. After completion, planned + driven paths are reviewable.

## Auth

REST: `protect → roleGuard → validator → validate → controller → service → audit`.
Sockets: JWT handshake (`middlewares/socketAuth.ts`); banned/suspended are refused
at connect. Live rooms are `trip:<id>` and open for `in_progress` trips only.

## REST examples

```json
// POST /api/maps/route-preview (driver)
{ "origin": { "lat": 31.9539, "lng": 35.9106 },
  "destination": { "lat": 32.5568, "lng": 35.8469 }, "stops": [] }
// -> { "polyline": "...", "distance_m": 95200, "duration_s": 5400,
//      "suggested_arrival": "2026-10-07T14:00:00.000Z", "cached": false }

// POST /api/maps/reverse-geocode (driver, passenger)
{ "lat": 31.9539, "lng": 35.9106 }
// -> { "city": "Amman", "area": "", "label": "Amman, Jordan" }

// POST /api/trips/:id/pickup-preview (passenger)
{ "lat": 32.25, "lng": 35.8793 }
// -> { "accepted": true, "distance_from_route_m": 12,
//      "detour_seconds": 0, "reason": null }

// POST /api/bookings (passenger) — pickup block is optional, defaults to origin
// Custom points are accepted as-is for now (no distance/detour rejection) and
// become route points on the post-booking recompute.
{ "trip_id": "...", "seat_numbers": [2], "agreed_fare": "15.50",
  "pickup": { "name": "Wasfi Al-Tal St", "lat": 32.25, "lng": 35.8793 } }

// PATCH /api/trips/:id/stops (driver) — replace all stops, recompute, notify
{ "stops": [{ "stop_name": "Jerash", "city": "Jerash",
  "lat": 32.27, "lng": 35.89, "stop_type": "both" }] }

// GET /api/trips/:id/route (driver owner, admin)
{ "polyline": "...", "route_status": "ready", "route_version": 3,
  "stops": [], "pickups": [{ "booking_id": "...", "first_name": "Sara",
  "seats": 1, "pickup_status": "pending" }],
  "navigation_url": "https://www.google.com/maps/dir/?api=1&...",
  "navigation_legs": ["..."] }

// PATCH /api/trips/:id/pickups/:bookingId (driver)
{ "pickup_status": "arrived" } // arrived | picked_up | missed

// GET /api/bookings/:id/route — planned route + my pickup only
// GET /api/trips/:id/route/actual — recorded path after completion
// PATCH /api/bookings/:id/pickup (passenger) — before the cutoff only
{ "lat": 32.3, "lng": 35.875 }

// GET /api/admin/trips/:id/route + /route/actual (admin, support, moderator)
// read-only, every view audited; recorded path on completed trips only
```

## Realtime examples

```json
// tracking:join { "trip_id": "..." } -> ack { "status": "ok", "data": { "room": "trip:..." } }
// tracking:location { "trip_id": "...", "lat": 32.0, "lng": 35.895,
//   "speed": 60, "heading": 180, "recorded_at": "2026-10-02T10:00:00.000Z" }
//   or batch: { "trip_id": "...", "points": [{...}, ...] } (max 60)
// tracking:update (room) { "trip_id": "...", "driver_lat": 32.0,
//   "driver_lng": 35.895, "eta_minutes": 12, "status": "en_route" }
// tracking:update (per passenger) — same shape, ETA is to THEIR pickup
// tracking:next_pickup (driver) { "booking_id": "...", "label": "...",
//   "distance_m": 850, "remaining_count": 2 }
// tracking:proximity (passenger, once each) { "state": "near" } // then "arrived"
// tracking:pickup_status (room) { "booking_id": "...", "state": "picked_up" }
// tracking:route_updated (room) { "route_version": 4 } // refetch REST
// tracking:ended (room) { "trip_id": "...", "reason": "completed" }
```

Rules: 1 location / 2 s per driver; points older than 5 min are discarded;
batch points carry original timestamps; non-drivers are dropped.

## Failure modes

- Route provider down → publish/booking still succeed with
  `route_status: failed`; `routeRetryJob` (every 2 min) recovers automatically.
- Too many stops/pickups → `422 TOO_MANY_WAYPOINTS` (compute never splits;
  only navigation links split into legs past ~9 waypoints).
- Custom booking pickups are accepted as-is for now (no distance/detour
  rejection) and are included in the route on the post-booking recompute.
  `pickup-preview` still reports `PICKUP_TOO_FAR_FROM_ROUTE` /
  `PICKUP_DETOUR_TOO_LONG` for the UI.
- Pickup edit after the cutoff or after start → `422 PICKUP_EDIT_CUTOFF_PASSED`.
- Join from a stranger, cancelled booking, or finished trip → join refused.

## Retention & privacy

- Raw points: 30 days, 1 year on SOS-linked trips; driven path stays on the trip.
- Passengers see their own pickup only; names are first-name only, no phones.
- Admin recorded-path views are completed-trips-only and audited.
