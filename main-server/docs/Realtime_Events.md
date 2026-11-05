# Realtime Events (Socket.IO)

Spec 009 documents the realtime tracking contract for trip progress and user
notifications. The transport is Socket.IO over the same origin as the API.

## Connection

```
wss://<host>/socket.io?token=<JWT>
```

- `token` is the same JWT issued by `POST /api/auth/login`.
- Connections without a valid token are rejected during the handshake.
- On connect the socket auto-joins the personal room `user:{userId}`.

## Rooms

| Room | Purpose |
| --- | --- |
| `user:{userId}` | Personal delivery room; joined automatically on connect. |
| `trip:{tripId}` | Trip broadcast room for live tracking updates. |

## Server -> Client events

### `notification`
Payload emitted via `notificationService.sendToUser(...)` (which fans out to
`emitToUser(userId, event, data)`). Delivered to room `user:{userId}`.

```json
{
  "id": "<notification uuid>",
  "type": "OFFER_RECEIVED",
  "title": "New offer on your request",
  "body": "Driver Layla offered 15.50 JOD for your ride request.",
  "data": {},
  "created_at": "2026-08-22T10:00:00.000Z"
}
```

### `tracking:update`
Broadcast to room `trip:{tripId}` while a driver is en route.

```json
{
  "trip_id": "<trip uuid>",
  "lat": 31.95,
  "lng": 35.91,
  "heading": 45,
  "updated_at": "2026-08-22T10:00:00.000Z"
}
```

## Client -> Server events

### `trip:join`
Join a trip broadcast room. Passengers join trips they hold bookings on;
drivers join their own trips.

```json
{ "trip_id": "<trip uuid>" }
```

### `trip:leave`
Leave a previously joined trip room.

```json
{ "trip_id": "<trip uuid>" }
```

### `tracking:location` (drivers only)
Drivers emit this event while a trip is `in_progress`; the server validates
ownership, then rebroadcasts a `tracking:update` to `trip:{tripId}` and
throttles persistence of the latest coordinate.

```json
{ "trip_id": "<trip uuid>", "lat": 31.95, "lng": 35.91, "heading": 45 }
```

## Delivery guarantees

- In-app notifications are always persisted first (`notifications` table), then
  emitted; if the socket is disconnected clients recover history through
  `GET /api/notifications`.
- Tracking updates are transient and not persisted as notifications.
