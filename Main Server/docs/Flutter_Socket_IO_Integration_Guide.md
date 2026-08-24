# Flutter Socket.IO Integration Guide

Complete guide for integrating the Masar realtime server (Socket.IO) into the
Flutter app. This document covers connection/authentication, every event the
app can **send** (with exact payloads), and every event the app must
**listen** for (with exact response shapes).

> Source of truth: `Main Server/socketServer.js`, `Main Server/sockets/*`,
> and `Main Server/Services/*`. If this doc disagrees with code, code wins.

---

## Table of Contents

1. [Connection & Authentication](#1-connection--authentication)
2. [Ack (Acknowledgement) Contract](#2-ack-contract)
3. [Rate Limits](#3-rate-limits)
4. [Rooms](#4-rooms)
5. [Chat Events](#5-chat-events)
6. [Notification Events](#6-notification-events)
7. [SOS Emergency Events](#7-sos-emergency-events)
8. [Live Tracking Events](#8-live-tracking-events)
9. [Presence Events](#9-presence-events)
10. [Admin / Support Agent Events](#10-admin--support-agent-events)
11. [Session / Enforcement Events](#11-session--enforcement-events)
12. [Error Codes Reference](#12-error-codes-reference)
13. [Flutter Setup & Sample Service](#13-flutter-setup--sample-service)
14. [Best Practices Checklist](#14-best-practices-checklist)

---

## 1. Connection & Authentication

The socket runs on the **same host/port as the REST API** using the Socket.IO
protocol (path defaults to `/socket.io`).

### Connecting

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io(
  'https://<server-host>', // same base URL as the REST API
  IO.OptionBuilder()
      .setTransports(['websocket'])
      .setAuth({'token': accessToken})   // REQUIRED: access JWT
      .setQuery({'reconnecting': 'false'})
      .enableReconnection()
      .setReconnectionAttempts(5)
      .setReconnectionDelay(2000)
      .build(),
);
```

### Auth rules (handshake)

| Rule | Detail |
| --- | --- |
| Token type | Must be an **access** JWT (`type: 'access'`) — the same token from `POST /api/auth/login`. Refresh tokens are rejected. |
| Where | Sent in `auth.token`. A `?token=` query param also works but is discouraged. |
| Blacklist | Tokens revoked by logout are rejected (`TOKEN_REVOKED`). |
| User state | The user must exist and must not be `banned`/`suspended` (`ACCOUNT_SUSPENDED`). |

### Handshake failure reasons

When the handshake fails, the Flutter `onConnectError` receives one of:

| Error string | Meaning | App action |
| --- | --- | --- |
| `AUTH_REQUIRED` | No token provided | Force re-login |
| `TOKEN_EXPIRED` | Access token expired | Call refresh endpoint, reconnect with new token |
| `INVALID_TOKEN` | Malformed/bad signature | Force re-login |
| `INVALID_TOKEN_TYPE` | Not an access token (e.g. refresh token used) | Use access token |
| `TOKEN_REVOKED` | Token blacklisted (logged out) | Force re-login |
| `USER_NOT_FOUND` | Account deleted | Clear session |
| `ACCOUNT_SUSPENDED` | Banned or suspended | Show blocked-account screen |
| `AUTH_FAILED` | Internal auth error | Retry later |

### Auto-joined rooms (no client action needed)

On successful connect the server automatically joins your socket to:

- `user:{userId}` — personal delivery room (notifications, SOS acks, enforcement).
- `role:{role}` — role room (`passenger`, `driver`, `admin`, ...).

### State recovery

The server enables **connection-state recovery** for up to **2 minutes**
(`maxDisconnectionDuration: 120000ms`). If the app reconnects within that
window, `socket.recovered == true` and missed packets are replayed automatically.
After 2 minutes, re-sync via REST (e.g. `GET /api/notifications`, chat history).

---

## 2. Ack Contract

Every client→server event listed below supports an optional **acknowledgement
callback** as the last argument. Always use it to confirm delivery.

Success shape:

```json
{ "status": "ok", "data": { "...": "..." } }
```

Failure shape:

```json
{ "status": "error", "code": "VALIDATION_ERROR", "message": "message is required" }
```

Flutter helper:

```dart
Future<Map<String, dynamic>> emitWithAck(String event, Map<String, dynamic> payload,
    {Duration timeout = const Duration(seconds: 10)}) {
  final completer = Completer<Map<String, dynamic>>();
  socket.emitWithAck(event, payload,
      ack: (data) => completer.complete(Map<String, dynamic>.from(data)));
  return completer.future.timeout(timeout, onTimeout: () =>
      {'status': 'error', 'code': 'TIMEOUT', 'message': 'No server response'});
}
```

Always check `response['status'] == 'ok'`, then read `response['data']`.

---

## 3. Rate Limits

Per-user fixed windows enforced server-side. When exceeded you get ack
`{ status:'error', code:'RATE_LIMITED', message:'Rate limit exceeded' }`.

| Scope | Limit | Window |
| --- | --- | --- |
| `chat:send` | 10 msgs | 10 s |
| `chat:read` | 60 calls | 10 s |
| `chat:typing` | Throttled server-side to 1 broadcast / 1.5 s per user (extra sends return `{throttled:true}`) |
| `tracking:location` | 1 ping | 2 s |
| `sos:trigger` | 5 triggers | 60 s (repeat during active event is deduped, doesn't consume limit) |
| `presence:heartbeat` | 60 beats | 60 s |

**Flutter:** send location at most every 2 seconds; queue chat sends; treat
`RATE_LIMITED` as retry-later.

---

## 4. Rooms

You never join `user:{id}` or `role:{role}` manually. You opt in to context rooms:

| Room | Join via | Purpose |
| --- | --- | --- |
| `user:{userId}` | Automatic | Personal events (notifications, SOS, enforcement) |
| `role:{role}` | Automatic | Role broadcasts (presence, admin alerts) |
| `booking:{bookingId}` | `chat:join` | Driver↔passenger booking chat |
| `support:{ticketId}` | `chat:join` | User↔support ticket chat |
| `trip:{tripId}` | `tracking:join` | Live trip tracking updates |

---

## 5. Chat Events

Two chat contexts:
- **Booking chat** — driver ↔ passenger, only while booking is CONFIRMED and
  its trip is not completed/cancelled.
- **Support chat** — ticket owner ↔ support agents, available anytime.

### 5.1 Client → Server

#### `chat:join`
Join a chat room. **Call this when opening any chat screen.**

```json
// Option A — booking chat
{ "booking_id": "<booking uuid>" }

// Option B — support chat
{ "support_ticket_id": "<ticket uuid>" }
```

Ack success: `{ "status":"ok", "data": { "room": "booking:<id>" } }` (or `support:<id>`).

Errors: `VALIDATION_ERROR` (neither id given), `FORBIDDEN` (not a member /
booking not confirmed / trip finished), `NOT_FOUND`.
On booking join, other room members receive your current `presence:status`.

#### `chat:leave`
Leave a room (call on screen dispose):

```json
{ "booking_id": "<id>" }              // and/or
{ "support_ticket_id": "<id>" }
```

Ack success: `{ "status":"ok", "data": { "left": true } }` (never errors).

#### `chat:send`
Send a message. Persisted **before** broadcast.

```json
{
  "booking_id": "<uuid>",             // OR support_ticket_id — exactly one
  "message": "Hello!",
  "message_type": "text"              // optional: "text" (default) | "system"
}
```

Ack success data:

```json
{ "id": "<message uuid>", "created_at": "2026-08-24T10:00:00.000Z" }
```

Errors: `VALIDATION_ERROR` (missing id/message/empty after sanitize),
`FORBIDDEN` (membership/chat-closed), `NOT_FOUND`, `RATE_LIMITED`.

#### `chat:typing`
Typing indicator. Fire-and-forget friendly (still supports ack).

```json
{
  "booking_id": "<uuid>",            // OR support_ticket_id
  "is_typing": true
}
```

Ack success: `{ "status":"ok", "data": { "throttled": false } }` — `true` means
suppressed by the 1.5s throttle (normal; keep typing locally). Send `is_typing:false`
when the user stops typing.

#### `chat:read`
Mark read. Provide **one** of: `message_id`, `booking_id`, `support_ticket_id`.

```json
{ "message_id": "<uuid>" }
// or
{ "booking_id": "<uuid>" }
// or
{ "support_ticket_id": "<uuid>" }
```

Ack success data (echoes what was marked):
- Single message → `{ "message_id": "<uuid>" }`
- Whole booking chat → `{ "booking_id": "<uuid>" }`
- Whole support chat → `{ "support_ticket_id": "<uuid>" }`

Errors: `NOT_FOUND`, `FORBIDDEN` ("cannot mark own message read"), `VALIDATION_ERROR`,
`RATE_LIMITED`.

### 5.2 Server → Client (listen always while logged in)

#### `chat:receive`
New message in any joined room (including your own messages echoed back —
dedupe by `id`).

```json
{
  "id": "<message uuid>",
  "sender_id": "<user uuid>",
  "sender_name": "Layla Ahmad",
  "message": "I'm 5 minutes away",
  "message_type": "text",
  "booking_id": "<uuid> | null",
  "support_ticket_id": "<uuid> | null",
  "is_read": false,
  "read_at": null,
  "created_at": "2026-08-24T10:00:00.000Z",
  "timestamp": 1724493600000
}
```

#### `chat:typing`
Someone else in a joined room is typing (never your own echo).

```json
{
  "sender_id": "<user uuid>",
  "is_typing": true,
  "timestamp": 1724493600000
}
```

Show indicator ~3–4 s after last `is_typing:true`; clear immediately on `false`.

#### `chat:read_ack`
A message/chat was read by the other party.

```json
{
  "message_id": "<uuid> | null",       // null = whole conversation marked read
  "booking_id": "<uuid> | null",
  "support_ticket_id": "<uuid> | null",
  "read_by": "<user uuid>",
  "read_at": "2026-08-24T10:00:00.000Z",
  "timestamp": 1724493600000
}
```

If `message_id` is null, mark **all** messages not sent by `read_by` as read.

#### `presence:status` (also emitted here)
Emitted to booking-room members right after someone joins — see
[Presence Events](#9-presence-events).

---

## 6. Notification Events

### 6.1 On connect (no request needed)

Immediately after connecting the server pushes the current unread badge:

```json
{ "unread_count": 7, "timestamp": 1724493600000 }
```

Use this to initialize the badge on app start / reconnect.

### 6.2 Client → Server

#### `notification:read`

```json
{ "notification_id": "<uuid>" }
```

Ack success data: `{ "notification_id": "<uuid>" }`.
After this the server re-emits `notification:count` automatically.

#### `notification:read_all`

```json
{}   // payload may be omitted entirely
```

Ack success data: `{ "marked": 12 }` — number of notifications flipped to read.
`notification:count` follows automatically.

### 6.3 Server → Client (listen always)

#### `notification:new`
Fires whenever anything happens to this user (offer received, booking update,
trip cancellation, ticket resolved...). Persisted first, so nothing is lost
offline — after reconnect also fetch history via `GET /api/notifications`.

```json
{
  "id": "<notification uuid>",
  "type": "OFFER_RECEIVED",
  "title": "New offer on your ride request",
  "body": "Driver Layla offered 15.50 JOD.",
  "data": { },
  "reference_id": null,
  "reference_type": null,
  "created_at": "2026-08-24T10:00:00.000Z",
  "timestamp": 1724493600000
}
```

#### `notification:count`

```json
{ "unread_count": 3, "timestamp": 1724493600000 }
```

Set badge = `unread_count` unconditionally (it's authoritative).

---

## 7. SOS Emergency Events

Available **only during an active trip** (`in_progress` / `ongoing`) and only
for confirmed trip participants (driver or passenger with CONFIRMED booking).

### 7.1 Client → Server

#### `sos:trigger`

```json
{
  "trip_id": "<uuid>",        // required
  "lat": 31.9539,             // required
  "lng": 35.9106,             // required
  "urgency": "high"           // optional: low | medium | high (default) | critical
}
```

Ack success data:

```json
{ "sos_event_id": "<uuid>", "reused": false }
```

- `reused: true` → you already have an active SOS event; it was returned instead
  of creating another (does NOT consume rate limit).
- Errors: `VALIDATION_ERROR` (missing trip_id/lat/lng), `FORBIDDEN` (not a trip
  participant), `NOT_FOUND`, `CONFLICT` ("only available during an active trip"),
  `RATE_LIMITED`.

### 7.2 Server → Client

#### `sos:ack` (to the triggering user, on `user:{id}`)

Sent asynchronously right after creation — do **not** rely solely on the emit
ack; listen for this too.

```json
{
  "status": "received",
  "sos_event_id": "<uuid>",
  "assigned_support_id": null,
  "timestamp": 1724493600000
}
```

UI: show "help is on the way / alert received" screen.

#### `sos:alert` (admins/support dashboards only)

Broadcast to `role:admin` on trigger, then **re-broadcast every 60 s** until
resolved; `escalation_level` becomes `1` after 5 minutes unresolved.

```json
{
  "sos_event_id": "<uuid>",
  "user_id": "<reporter uuid>",
  "user_name": "Omar Khaled",
  "trip_id": "<uuid>",
  "lat": 31.9539,
  "lng": 35.9106,
  "urgency": "high",
  "escalation_level": 0,
  "triggered_at": "2026-08-24T10:00:00.000Z",
  "timestamp": 1724493600000
}
```

(`admin:sos_alert` carries the identical payload.)

#### `sos:resolved` (to reporter + admins)

```json
{
  "sos_event_id": "<uuid>",
  "resolution": "Resolved",
  "resolved_by": "<admin uuid>",
  "resolved_at": "2026-08-24T10:05:00.000Z",
  "timestamp": 1724493600000
}
```

UI (reporter): dismiss the emergency screen.

---

## 8. Live Tracking Events

Drivers share location to `trip:{tripId}`; passengers watch. Only the trip's
driver can start/send location; trip must be active (`in_progress`/`ongoing`).

### 8.1 Client → Server

#### `tracking:join` (both roles)
Join the trip room. Membership = driver of the trip OR passenger with CONFIRMED
booking on it.

```json
{ "trip_id": "<uuid>" }
```

Ack success data: `{ "room": "trip:<uuid>" }`. Errors: `FORBIDDEN`, implicit
`NOT_FOUND` via membership check.

#### `tracking:start` (driver only)
Announce tracking started; broadcasts an initial `tracking:update` (null coords,
`status: en_route`).

```json
{ "trip_id": "<uuid>" }
```

Ack success data (same shape as `tracking:update` below).

#### `tracking:location` (driver only) — ⏱ max 1 per 2 s

```json
{
  "trip_id": "<uuid>",     // required
  "lat": 31.9539,          // required, number
  "lng": 35.9106,          // required, number
  "speed": 12.5,           // optional, km/h (enables server ETA estimate)
  "heading": 270           // optional, degrees
}
```

Ack success data = the broadcast `tracking:update` object (see below), including
computed `eta_minutes` (when destination set and speed > 0).
Errors: `VALIDATION_ERROR`, `FORBIDDEN` ("Only the trip driver"), `CONFLICT`
("only for active trips"), `RATE_LIMITED`.

#### `tracking:stop` (driver only)

```json
{ "trip_id": "<uuid>" }
```

Ack success data = `tracking:update` shape with `"status": "stopped"`.

### 8.2 Server → Client

#### `tracking:update`
Broadcast to everyone in `trip:{tripId}` on start / each location ping / stop.

```json
{
  "trip_id": "<uuid>",
  "driver_lat": 31.9539,      // null on start/stop events
  "driver_lng": 35.9106,      // null on start/stop events
  "eta_minutes": 7,           // null when unknown (no destination or speed=0)
  "status": "en_route",       // "en_route" | "stopped"
  "timestamp": "2026-08-24T10:00:00.000Z"
}
```

Passenger UI: animate marker to `(driver_lat, driver_lng)`; show ETA if present;
clear map state when `status == "stopped"`.

---

## 9. Presence Events

Online/offline is managed automatically:
- **Connect** → user marked online (60s Redis TTL).
- **Disconnect** → offline transition scheduled after a **60 s grace period**
  (cancelled if the user reconnects).

### 9.1 Client → Server

#### `presence:heartbeat`
Keep-alive for long-lived connections. Recommended every 30–45 s while
foregrounded (limit: 60/min).

```json
{}   // no payload needed
```

Ack success data: `{ "status": "online" }`.

### 9.2 Server → Client

#### `presence:status`
Broadcast to the user's **role room** (peers/admin see it), plus to members of a
booking room when that user joins the chat.

```json
{
  "user_id": "<uuid>",
  "status": "online",                  // "online" | "offline"
  "last_seen": "2026-08-24T10:00:00.000Z",
  "timestamp": 1724493600000
}
```

#### `admin:driver_online` (admin dashboards only)

```json
{ "driver_id": "<uuid>", "lat": null, "lng": null, "timestamp": 1724493600000 }
```

---

## 10. Admin / Support Agent Events

Handlers are registered only for `admin`, `support`, and `moderator` roles;
other roles sending these get no response.

### 10.1 Client → Server

#### `admin:ticket_assign`

```json
{ "support_ticket_id": "<uuid>", "agent_id": "<agent user uuid>" }
```

Ack success data: `{ "support_ticket_id": "<uuid>", "assigned_to": "<agent id>" }`.
Assigning agent joins `support:{ticketId}` automatically.
Errors: `NOT_FOUND`, `VALIDATION_ERROR` (missing agent_id).

#### `admin:ticket_resolve`

```json
{ "support_ticket_id": "<uuid>", "solution": "Refund issued" }  // solution optional
```

Ack success data: `{ "support_ticket_id": "<uuid>", "status": "resolved" }`.
Ticket owner receives a TICKET_RESOLVED notification (→ `notification:new`).

### 10.2 Server → Client (agent dashboards listen)

| Event | Payload |
| --- | --- |
| `sos:alert`, `admin:sos_alert` | See §7.2 |
| `admin:driver_online` | See §9.2 |
| `chat:receive`, `chat:typing`, `chat:read_ack` | Standard chat events inside `support:{id}` rooms (§5) |
| Ticket/complaint created broadcasts | Emitted from domain services to `role:admin` — refresh list via REST |

---

## 11. Session / Enforcement Events

These arrive on `user:{userId}` — usually when it's too late to negotiate.

#### `enforcement:revoke`
Emitted just before force-disconnect when the account is suspended/banned.

```json
{
  "reason": "Account suspended",
  "action": "suspend",                 // "suspend" | "ban"
  "duration": null,                    // suspension length if time-bound
  "effective_at": "2026-08-24T10:00:00.000Z"
}
```

App action: show blocked-account UI, wipe tokens, **do not auto-reconnect**
(reconnect will fail handshake with `ACCOUNT_SUSPENDED`).

#### `force_disconnect`

```json
{ "reason": "SESSION_TERMINATED" }
```

Emitted before server-initiated disconnect (logout elsewhere / enforcement).
App action: tear down the socket cleanly; do not reconnect with the same token.

---

## 12. Error Codes Reference

All ack errors use these codes (from `utils/ApiError.js` + socket helpers):

| Code | Meaning |
| --- | --- |
| `BAD_REQUEST` | Malformed request |
| `UNAUTHORIZED` | Auth problem |
| `FORBIDDEN` | Not a member / action not allowed in current state |
| `NOT_FOUND` | Resource missing |
| `CONFLICT` | State conflict (e.g. SOS outside active trip) |
| `VALIDATION_ERROR` | Missing/invalid fields (HTTP-422 style) |
| `RATE_LIMITED` | Too many events — slow down |
| `INTERNAL_ERROR` | Unexpected server failure |
| `TIMEOUT` *(client-side)* | No ack within your timeout |

Handshake-only codes are listed in §1.

---

## 13. Flutter Setup & Sample Service

### Dependency

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

> Note: the server uses Socket.IO v4 protocol — use `socket_io_client` v2.x
> (which implements Engine.IO v4). Plain `web_socket_channel` will NOT work.

### Minimal service class

```dart
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  IO.Socket? _socket;
  final _notifications = StreamController<Map<String, dynamic>>.broadcast();
  final _trackingUpdates = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get notifications => _notifications.stream;
  Stream<Map<String, dynamic>> get trackingUpdates => _trackingUpdates.stream;

  void connect({required String baseUrl, required String accessToken}) {
    _socket = IO.io(baseUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': accessToken})
        .enableReconnection()
        .setReconnectionAttempts(5)
        .setReconnectionDelay(2000)
        .build());

    _socket!..onConnect((_) => print('connected'))
      ..on('connect_error', (err) => _handleConnectError(err))
      ..on('disconnect', (_) {})
      ..on('notification:new', (d) => _notifications.add(Map.from(d)))
      ..on('notification:count', (d) {/* update badge */})
      ..on('chat:receive', (d) {/* insert message, dedupe by id */})
      ..on('chat:typing', (d) {})
      ..on('chat:read_ack', (d) {})
      ..on('tracking:update', (d) => _trackingUpdates.add(Map.from(d)))
      ..on('presence:status', (d) {})
      ..on('sos:ack', (d) {})
      ..on('sos:resolved', (d) {})
      ..on('enforcement:revoke', (d) {/* block account, stop reconnect */})
      ..on('force_disconnect', (d) {});
  }

  void _handleConnectError(dynamic err) {
    switch (err.toString()) {
      case 'TOKEN_EXPIRED': /* refresh & reconnect */ break;
      case 'ACCOUNT_SUSPENDED': /* show blocked screen */ break;
      default: break;
    }
  }

  /// Emits with ack and normalizes the response.
  Future<Map<String, dynamic>> emit(
    String event, [
    Map<String, dynamic>? payload,
    Duration timeout = const Duration(seconds: 10),
  ]) {
    final c = Completer<Map<String, dynamic>>();
    _socket?.emitWithAck(event, payload ?? {}, ack: (data) {
      try {
        c.complete(Map<String, dynamic>.from(data as Map));
      } catch (_) {
        c.complete({'status': 'error', 'code': 'BAD_ACK', 'message': '$data'});
      }
    });
    return c.future.timeout(timeout, onTimeout: () =>
        {'status': 'error', 'code': 'TIMEOUT', 'message': 'No response'});
  }

  Future<bool> joinBookingChat(String bookingId) async {
    final r = await emit('chat:join', {'booking_id': bookingId});
    return r['status'] == 'ok';
  }

  Future<Map<String, dynamic>?> sendMessage({
    String? bookingId,
    String? supportTicketId,
    required String message,
  }) async {
    final r = await emit('chat:send', {
      if (bookingId != null) 'booking_id': bookingId,
      if (supportTicketId != null) 'support_ticket_id': supportTicketId,
      'message': message,
    });
    return r['status'] == 'ok' ? r['data'] as Map<String, dynamic>? : null;
  }

  /// Drivers: throttle to >= 2s between calls.
  Future<void> sendLocation({
    required String tripId,
    required double lat,
    required double lng,
    double? speed,
    double? heading,
  }) =>
      emit('tracking:location', {
        'trip_id': tripId, 'lat': lat, 'lng': lng,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
      }).then((_) {});

  Future<void> triggerSos({
    required String tripId,
    required double lat,
    required double lng,
    String urgency = 'high',
  }) =>
      emit('sos:trigger', {
        'trip_id': tripId, 'lat': lat, 'lng': lng, 'urgency': urgency,
      }).then((_) {});

  void heartbeat() => emit('presence:heartbeat');

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}
```

### Typical flows

**Passenger watching a trip:**
1. Trip becomes active → `emit('tracking:join', {trip_id})`.
2. Listen `tracking:update` → move driver marker.
3. Open booking chat → `chat:join {booking_id}`, listen `chat:receive`.
4. Trip ends → `chat:leave`, `tracking:stop` is driver's job.

**Driver during a trip:**
1. `tracking:start {trip_id}`.
2. Every ≥2 s: `tracking:location {...}` (use geolocator stream + throttle).
3. At arrival/trip end: `tracking:stop {trip_id}`.

**Emergency:** `sos:trigger` → wait for emit ack AND `sos:ack` → show status →
`sos:resolved` closes it.

---

## 14. Best Practices Checklist

- [ ] Pass the **access** token in `.setAuth()`; refresh-and-reconnect on `TOKEN_EXPIRED`.
- [ ] Always use ack callbacks; handle `status != 'ok'` explicitly.
- [ ] Deduplicate `chat:receive` by message `id` (your own messages echo back).
- [ ] Throttle location pings to ≥2 s and typing to ≥1.5 s client-side.
- [ ] Re-sync after long disconnects (>2 min recovery window): REST-fetch
      notifications + chat history, then rely on sockets again.
- [ ] Stop heartbeats/locations when app is backgrounded; resume on resume.
- [ ] Treat `enforcement:revoke` / `force_disconnect` as terminal — never
      auto-reconnect after them.
- [ ] One socket instance per app lifecycle; reuse across screens; join/leave
      rooms per screen.
