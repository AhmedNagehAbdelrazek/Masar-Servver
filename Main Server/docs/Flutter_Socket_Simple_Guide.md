# Socket Guide for Flutter (Simple Version)

How to connect to the server socket and which events to use.
If you only read one doc, read this one.

---

## 1) Connect

Add in `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

Connect like this. You MUST send the **access token** you got from login.

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io(
  'https://<server-url>',              // same URL as the REST API
  IO.OptionBuilder()
      .setTransports(['websocket'])
      .setAuth({'token': accessToken}) // <-- access token from login
      .enableReconnection()
      .build(),
);
```

Rules:
- No token = connection rejected. Expired token = rejected (`TOKEN_EXPIRED`) → refresh token then reconnect.
- Banned/suspended user = rejected.
- After connecting you are automatically in your personal room. Notifications come to you without joining anything.
- If the app was disconnected for more than 2 minutes, refresh your data from the REST API after reconnecting.

---

## 2) How every event works

- To **ask the server** for something: emit an event WITH a callback (ack). The answer is always either:

```json
{ "status": "ok",   "data": { ... } }
{ "status": "error", "code": "...", "message": "..." }
```

- To **receive updates** from the server: register `socket.on(...)` listeners once (e.g. in your service class).

Always emit with ack. Example:

```dart
socket.emitWithAck('chat:join', {'booking_id': bookingId}, ack: (res) {
  if (res['status'] == 'ok') {
    print('joined ${res['data']['room']}');
  } else {
    print('failed: ${res['message']}');
  }
});
```

---

## 3) Events you SEND (client → server)

### Chat

| Event | Send this | When |
| --- | --- | --- |
| `chat:join` | `{"booking_id": "<id>"}` OR `{"support_ticket_id": "<id>"}` | Opening a chat screen |
| `chat:leave` | same as join | Closing the chat screen |
| `chat:send` | `{"booking_id": "<id>", "message": "hi"}` (support chat uses `support_ticket_id` instead) | Sending a message |
| `chat:typing` | `{"booking_id": "<id>", "is_typing": true}` | User types / stops typing (`false`) |
| `chat:read` | `{"booking_id": "<id>"}` or `{"message_id": "<id>"}` or `{"support_ticket_id": "<id>"}` | Mark messages as read |

Acks you get back:
- `chat:join` → `data.room`
- `chat:send` → `data.id`, `data.created_at`
- `chat:typing` → `data.throttled` (true = too fast, ignore it)
- `chat:read` → echoes the id you sent

### Tracking

| Event | Send this | Who |
| --- | --- | --- |
| `tracking:join` | `{"trip_id": "<id>"}` | Passenger + driver, when trip screen opens |
| `tracking:start` | `{"trip_id": "<id>"}` | Driver only |
| `tracking:location` | `{"trip_id": "<id>", "lat": 31.95, "lng": 35.91}` | Driver only, **max once every 2 seconds** |
| `tracking:stop` | `{"trip_id": "<id>"}` | Driver only |

### SOS (emergency)

| Event | Send this |
| --- | --- |
| `sos:trigger` | `{"trip_id": "<id>", "lat": 31.95, "lng": 35.91}` |

Only works while a trip is active. If it worked you get `data.sos_event_id`.

### Presence & notifications

| Event | Send this | Notes |
| --- | --- | --- |
| `presence:heartbeat` | `{}` | Every ~30s while app is open |
| `notification:read` | `{"notification_id": "<id>"}` | Marks one as read |
| `notification:read_all` | `{}` | Marks all as read |

---

## 4) Events you LISTEN to (server → client)

Register these right after connecting:

```dart
socket.on('notification:new',     (d) {});  // new notification -> show it
socket.on('notification:count',   (d) {});  // {"unread_count": 3} -> badge number
socket.on('chat:receive',         (d) {});  // new chat message (also your own! dedupe by d['id'])
socket.on('chat:typing',          (d) {});  // {"sender_id":..., "is_typing":true/false}
socket.on('chat:read_ack',        (d) {});  // other side read your messages
socket.on('tracking:update',      (d) {});  // driver location -> move marker on map
socket.on('presence:status',      (d) {});  // {"user_id":..., "status":"online"/"offline"}
socket.on('sos:ack',              (d) {});  // SOS received by server -> show help screen
socket.on('sos:resolved',         (d) {});  // SOS handled -> close emergency screen
socket.on('enforcement:revoke',   (d) {});  // account banned/suspended -> logout, DON'T reconnect
socket.on('force_disconnect',     (d) {});  // server kicked you -> logout, DON'T reconnect
```

Key payloads:

```json
// notification:new
{ "id": "...", "type": "OFFER_RECEIVED", "title": "...", "body": "...", "created_at": "..." }

// notification:count
{ "unread_count": 3 }

// chat:receive
{ "id": "...", "sender_id": "...", "sender_name": "...", "message": "...",
  "booking_id": "...", "created_at": "..." }

// tracking:update
{ "trip_id": "...", "driver_lat": 31.95, "driver_lng": 35.91,
  "eta_minutes": 7, "status": "en_route" }

// sos:ack
{ "status": "received", "sos_event_id": "..." }
```

---

## 5) The 5 rules to remember

1. Always connect with the **access token**, reconnect with a fresh one if expired.
2. Always emit **with an ack callback** and check `status`.
3. Join rooms per screen (`chat:join`, `tracking:join`), leave them when the screen closes.
4. Location max **1 per 2 seconds**. Typing max **1 per 1.5 seconds**. Don't spam.
5. On `enforcement:revoke` or `force_disconnect`: log the user out and stop reconnecting.
