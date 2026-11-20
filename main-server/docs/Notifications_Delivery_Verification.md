# Notifications Delivery Verification (Admin → Driver)

**Context:** client reported that a driver did not receive a notification the admin sent from the dashboard. Investigation (Nov 2026) found the code path **already fixed** by commit `0ffa2b8` ("deliver dashboard notifications in-app and via push"). Before that commit, `POST /api/admin/dashboard/drivers/:driver_id/notifications` only wrote a `Notification` DB row — no socket event and no push, so a driver who was not looking at the notifications list at that moment received nothing.

Use this checklist to verify the **deployed** server and the driver app.

## 1. Fingerprint the deployed build

Send a notification from the dashboard:

```
POST /api/admin/dashboard/drivers/:driver_id/notifications
Authorization: Bearer <admin access token>
{ "title": "Smoke test", "body": "Delivery verification" }
```

- **Fixed build (commit `0ffa2b8` or later):** the response contains a truthful delivery report:

```json
{ "status": "success", "notification": { "category": "general" }, "delivery": { "in_app": true, "push": true } }
```

- **Stale build (pre-`0ffa2b8`):** no `delivery` field, or `in_app` hardcoded `true` with no push attempt → **redeploy the server**; this alone reproduces the client's report.

## 2. Interpret the `delivery` flags

| Flag | Meaning |
|---|---|
| `delivery.in_app: true` | A `Notification` row was persisted **and** socket events `notification:new` + `app:notification` + `notification:count` were emitted to room `user:{driver_id}`. |
| `delivery.in_app: false` | DB write failed — check server logs. |
| `delivery.push: false` | The driver has **no registered FCM token** (`POST /api/notifications/device` was never called, or the token was cleared on logout), or Firebase credentials are missing/invalid. Push failures are logged as `[push:log]` and never throw. |
| `delivery.push: true` | FCM accepted the message. A stale/invalid device token is FCM's problem to report — check server logs for FCM errors. |

## 3. Driver-app responsibilities (client side)

1. **Register the FCM token** after login: `POST /api/notifications/device { fcm_token, platform }`. Without it, push silently cannot happen. On logout the token is cleared (`DELETE /api/notifications/device`), so re-register on the next login.
2. **Sync unread notifications on connect/startup:** `GET /api/notifications` (paginated, newest first). Socket delivery is fire-and-forget — if the app was offline at emit time the event is gone; persistence is the offline mechanism.
3. **Handle the socket events:** `notification:new` (full payload), `app:notification` (toast-style), `notification:count` (badge). The server pushes the current unread count on every socket connect.
4. **Handle enforcement events** (when the *stop* is what should show): `enforcement:revoke` → treat as terminal (show stopped-account screen, log out, don't auto-reconnect); reconnect rejection `connect_error` with code `ACCOUNT_SUSPENDED` → blocked-account screen. See `Flutter_Socket_IO_Integration_Guide.md` §11.

## 4. Rule-outs (do not chase these)

- **Driver notification settings cannot suppress admin messages.** The dashboard notice uses type `ADMIN_NOTICE`, which is not part of the user-facing settings taxonomy — no settings row can exist for it, so channel gating always fails open.
- **Template presence:** `ADMIN_NOTICE` exists for both locales; unknown types are logged and dropped (`[notification] unknown type`), so watch for that log line if a custom `type` string was sent.

## 5. Multi-instance deployments

If the server runs as more than one instance, socket rooms live per instance — `notification:new` only reaches drivers connected to the emitting instance unless the Socket.IO Redis adapter is enabled (`@socket.io/redis-adapter`, wired in `socketServer.ts`). Single-instance deploys are unaffected.

## Related

- Delivery chain: `Services/notificationService/index.ts` (`sendToUser`), `channels/inApp.ts`, `channels/push.ts`.
- Admin endpoints: `POST /api/admin/dashboard/drivers/:driver_id/notifications`, `POST /api/admin/passengers/:passenger_id/notifications`.
- Enforcement/stopped-state events: `docs/ENDPOINTS_AND_FLOWS.md` `[sock-31]`/`[sock-32]`.
