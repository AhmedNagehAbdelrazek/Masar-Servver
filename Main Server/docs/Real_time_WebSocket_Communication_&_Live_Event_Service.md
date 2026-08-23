# Feature: Real-time WebSocket Communication & Live Event Service

## 1. Overview
This feature implements persistent WebSocket connections (using Socket.IO or standard WebSocket with fallback) to deliver real-time experiences. It covers four core pillars:
1. **Chat** (Passenger ↔ Driver, User ↔ Support).
2. **Live Tracking** (Driver broadcasts location → Passenger listens).
3. **Notifications & Offers** (Booking updates, driver offers, reminders).
4. **SOS & Enforcement** (Emergency alerts to admins, instant session revocation).

---

## 2. Architecture & Infrastructure

### 2.1 Stack Recommendations
- **Library:** `socket.io` (for WebSocket + long-polling fallback, built-in rooms, and reconnection handling).
- **Adapter:** `socket.io-redis-adapter` (for horizontal scaling across multiple server instances).
- **Authentication:** JWT token sent during the handshake (`auth: { token: "..." }`). Connection rejected if JWT is invalid or user is banned/suspended.
- **Middleware:** Authentication middleware + rate limiting per connection.

### 2.2 Connection Lifecycle
1. **Handshake:** Client connects via `wss://api.masar.app/socket.io/?token=JWT`.
2. **Auth Middleware:** Decodes JWT, fetches user from DB/cache, checks status (not banned/suspended).
3. **Join Rooms:** Automatically joins:
   - `user:{userId}` – for private notifications.
   - `role:{role}` (e.g., `role:admin`, `role:driver`, `role:passenger`) – for broadcasting relevant system messages.
   - `trip:{tripId}` (when the user has an active booking or driving trip) – for tracking/chat.
4. **Disconnect:** Cleans up presence status and releases seat/trip locks if necessary.
5. **Reconnection:** Clients automatically attempt reconnection with exponential backoff; subscription to rooms is restored.

### 2.3 Security
- **JWT Validation:** Tokens must be valid and not expired. Refresh tokens handled via REST API.
- **Room Access Control:** Users can only join rooms they are authorized for (e.g., a passenger cannot join `trip:{tripId}` unless they have a confirmed booking for that trip).
- **Message Sanitization:** All chat messages are sanitized (XSS prevention) and passed through a moderation filter (abusive words) before broadcasting.
- **Rate Limiting:** Max 10 messages per 10 seconds per user to prevent spam.

---

## 3. Chat System (Passenger ↔ Driver / User ↔ Support)

### 3.1 Use Cases
- **P2P Chat:** Passenger and Driver discuss pickup details, delays, or specific locations.
- **Support Chat:** Passenger/Driver opens a support ticket and chats with a support agent (admin dashboard).

### 3.2 Data Model (Already exists via `messages` table – ensure it's created)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NULL, -- NULL for support room or group
  trip_id UUID NULL REFERENCES trips(id), -- optional, for trip context
  support_ticket_id UUID NULL REFERENCES support_tickets(id), -- for support chats
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_trip ON messages(trip_id);
CREATE INDEX idx_messages_ticket ON messages(support_ticket_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```
*(Already aligned with `trip` and `support_tickets` from your PRD)*

### 3.3 Socket Events (Chat)

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `chat:send` | `{ receiver_id, trip_id?, support_ticket_id?, message, message_type:'text' }` | Sends a message. At least `receiver_id` OR `support_ticket_id` must be provided. |
| `chat:typing` | `{ receiver_id, trip_id?, support_ticket_id?, is_typing: bool }` | Signals typing status to the other party. |
| `chat:read` | `{ message_id }` or `{ receiver_id, trip_id }` | Marks messages as read. If `receiver_id` provided, marks all messages in that chat as read. |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `chat:receive` | `{ id, sender_id, sender_name, message, trip_id, support_ticket_id, created_at }` | Delivers a new message to the recipient’s room. |
| `chat:typing` | `{ sender_id, is_typing }` | Broadcasts typing status to the other party. |
| `chat:read_ack` | `{ message_id, read_by }` | Confirms a message has been read. |

### 3.4 Room Strategy for Chat
- **P2P Chat:** Room name: `chat:{tripId}` (all participants of a specific trip join this room).
- **Support Chat:** Room name: `support:{supportTicketId}` (User + assigned support agents join).

---

## 4. Live Tracking (Driver → Passenger)

### 4.1 Use Case
Passenger needs to see the driver's real-time location (with ETA) on a map after booking.

### 4.2 Socket Events (Tracking)

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `tracking:start` | `{ trip_id }` | Called by the driver when the trip begins (or periodically). |
| `tracking:location` | `{ trip_id, lat, lng, speed?, heading? }` | Driver broadcasts GPS coordinates (every 3–5 seconds). |
| `tracking:stop` | `{ trip_id }` | Called by driver when trip is completed. |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `tracking:update` | `{ trip_id, driver_lat, driver_lng, eta_minutes, status: 'en_route'/'arriving'/'completed' }` | Broadcasts to all passengers in that trip room. |
| `tracking:arrival` | `{ trip_id, estimated_arrival_time }` | Special push when the driver is 5 minutes away. |

### 4.3 Room Strategy for Tracking
- Room: `trip:{tripId}` – this room is shared for chat, tracking, and trip-related notifications.

---

## 5. Notifications System

### 5.1 Types of Real-time Notifications
- **Booking Confirmed:** Passenger & Driver receive a notification.
- **New Reservation:** Driver gets alerted immediately when a passenger books a seat.
- **Driver Offer on Request:** Passenger receives the offer instantly.
- **Ride Reminder:** Push 1 hour before departure.
- **Delay Report:** Driver reports delay → all passengers notified.
- **Cancellation Alert:** Other party notified of cancellation.
- **Ratings:** New rating received notification.
- **Enforcement Action:** User notified of warning/suspension/ban.

### 5.2 Socket Events (Notifications)

#### Server → Client (via `user:{userId}` room)
| Event | Payload | Description |
|-------|---------|-------------|
| `notification:new` | `{ id, type: 'booking'/'offer'/'reminder'/'alert'/'admin', title, body, reference_id, reference_type (e.g., 'trip'/'booking'), timestamp }` | Delivered to the specific user's room. |
| `notification:count` | `{ unread_count }` | Updates the badge count on the client. |

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `notification:read` | `{ notification_id }` | Marks a specific notification as read. |
| `notification:read_all` | `{}` | Marks all as read. |

### 5.3 Fallback
- If the user is offline, `notification:new` is persisted in the DB (`notifications` table). The client can fetch missed notifications via REST API `GET /notifications?unread=true` upon reconnection.
- Push Notifications (FCM/APNS) are handled by a separate service that consumes the same event queue, but WebSocket is the primary in-app delivery method.

---

## 6. SOS / Emergency Alerts

### 6.1 Use Case
Passenger/Driver encounters an emergency (accident, harassment, safety concern). One tap triggers an alert.

### 6.2 Socket Events (SOS)

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `sos:trigger` | `{ trip_id, booking_id, lat, lng, urgency: 'high' }` | Triggers SOS. Server immediately broadcasts to admin and logs to DB. |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `sos:ack` | `{ status: 'received', assigned_support_id }` | Sent back to the SOS initiator to confirm receipt. |
| `sos:alert` | `{ user_id, user_name, trip_id, lat, lng, timestamp }` | **Broadcast to `role:admin` room** for all active admins/support to view on their dashboard map. |
| `sos:resolved` | `{ sos_event_id, resolution }` | Admin resolves the SOS; notifies the user and closes the event. |

### 6.3 Data Table for SOS (NEW)
```sql
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  trip_id UUID NULL REFERENCES trips(id),
  booking_id UUID NULL REFERENCES bookings(id),
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'cancelled')),
  resolved_by UUID NULL REFERENCES users(id), -- admin
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ NULL
);
```

---

## 7. Presence & Online Status

### 7.1 Use Cases
- Show "online" / "last seen" status in chats.
- Show which drivers are currently active on the admin map.
- Automatically revoke sessions if an admin bans/suspends a user.

### 7.2 Socket Events (Presence)

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `presence:status` | `{ user_id, status: 'online'/'offline', last_seen }` | Broadcast to contacts when a user connects/disconnects. |

#### Client → Server (Automatic)
- **Connection:** `presence:status` with `online` is broadcast to their relevant chat rooms.
- **Disconnection:** Auto-broadcast `offline` after a 60-second grace period (to prevent flickering).

### 7.3 Enforcement – Session Revocation
- **Admin Action:** Admin calls `POST /penalties` (suspension/ban).
- **Server Logic:** The API triggers a WebSocket event to **forcefully disconnect** the offending user.
- **Socket Event:** `enforcement:revoke` – Sent to `user:{userId}` room.
  ```json
  { "reason": "Suspended due to repeated no-shows", "action": "suspend", "duration": "7 days" }
  ```
- **Client Behavior:** The client must immediately close the socket, clear local session, and redirect to the login/blocked screen.

---

## 8. Admin/Support Live Dashboard Updates

### 8.1 Use Cases
- Admins see new complaints/tickets appear in real-time.
- Support agents receive incoming chat messages without refreshing.
- Live map updates showing all ongoing trips and drivers.

### 8.2 Socket Events (Admin)

#### Server → Client (`role:admin` room)
| Event | Payload | Description |
|-------|---------|-------------|
| `admin:ticket_new` | `{ support_ticket_id, user_name, priority }` | New support ticket created. |
| `admin:complaint_new` | `{ complaint_id, accused_name, category }` | New complaint filed. |
| `admin:driver_online` | `{ driver_id, lat, lng }` | Driver comes online (for live map). |
| `admin:sos_alert` | See section 6.2 | High-priority SOS alert. |

#### Client → Server (Admin)
| Event | Payload | Description |
|-------|---------|-------------|
| `admin:ticket_assign` | `{ support_ticket_id, agent_id }` | Admin assigns ticket to themselves. |
| `admin:ticket_resolve` | `{ support_ticket_id, solution }` | Resolves a ticket. |

---

## 9. Full Socket Event Map (Summary)

### Client → Server
| Event | Description |
|-------|-------------|
| `chat:send` | Send a message |
| `chat:typing` | Typing indicator |
| `chat:read` | Mark as read |
| `tracking:start` | Driver starts sharing location |
| `tracking:location` | Driver sends GPS ping |
| `tracking:stop` | Driver stops sharing |
| `notification:read` | Mark notification as read |
| `notification:read_all` | Mark all as read |
| `sos:trigger` | Trigger emergency alert |
| `admin:ticket_assign` | (Admin) Assign ticket |
| `admin:ticket_resolve` | (Admin) Resolve ticket |

### Server → Client
| Event | Description |
|-------|-------------|
| `chat:receive` | New message delivered |
| `chat:typing` | Other user typing |
| `chat:read_ack` | Read receipt |
| `tracking:update` | Location update with ETA |
| `tracking:arrival` | Driver 5 min away |
| `notification:new` | New notification |
| `notification:count` | Unread count update |
| `sos:ack` | SOS received by server |
| `sos:alert` | SOS broadcast to admins |
| `sos:resolved` | SOS resolved |
| `presence:status` | User online/offline |
| `enforcement:revoke` | User suspended/banned (force logout) |
| `admin:ticket_new` | (Admin) New support ticket |
| `admin:complaint_new` | (Admin) New complaint |
| `admin:driver_online` | (Admin) Driver on map |

---

## 10. Integration with Existing Services

- **Authentication:** JWT middleware connects to the Auth Service.
- **Trip Service:** Used to validate `trip_id` and check if the user is authorized to join the `trip:{tripId}` room.
- **Notification Service (REST):** Persists notifications to the DB for offline users.
- **Admin Dashboard:** Listens to `role:admin` and `sos:alert` events to update the live map and arbitration queue.

---

## 11. Performance & Scalability Considerations

- **Redis Adapter:** Ensures socket events can be broadcast across multiple server pods.
- **Heartbeats:** Ping/Pong interval set to 25 seconds to detect disconnections quickly.
- **Message Persistence:** `chat:send` and `notification:new` events should persist to the database *before* broadcasting to ensure durability (async write + immediate broadcast).
- **Rate Limiting:** Implement per-IP and per-user throttle for `chat:send` and `tracking:location` (max 1 location update per 2 seconds).

---

## 12. Acceptance Criteria

- [ ] **Chat:** Passenger and driver can exchange messages in real-time; typing indicators and read receipts work.
- [ ] **Support Chat:** User opens a ticket from the app → support agent receives the ticket and starts a chat.
- [ ] **Tracking:** Passenger sees driver's location updating on the map during an active trip.
- [ ] **Notifications:** Driver receives a WebSocket push immediately when a passenger books a seat.
- [ ] **SOS:** Passenger triggers SOS → Admin dashboard shows a flashing alert with the user's location within 2 seconds.
- [ ] **Enforcement:** Admin suspends a user → the user's WebSocket connection is terminated and they are redirected to the login page.
- [ ] **Scalability:** 10,000 concurrent connections are supported (tested with Redis adapter).
- [ ] **Offline Fallback:** If the client disconnects, notifications are persisted; fetching `GET /notifications` returns missed messages.

---

## 13. Future Enhancements (Optional)

- **Voice/Video Calls:** Utilize WebRTC (could be added to the same socket infrastructure for signaling).
- **Group Chats:** Extend `chat:send` to support a `room_id` for multi-passenger group chat (scalable for future).
- **AI Chatbot Integration:** Hook `support:chat` to an AI agent before assigning to a human.
