The specification assumes a standard REST API setup: 
**Base URL:** `/api/v1/dashboard`
**Authentication:** Bearer Token (Admin Role)
**Headers:** `Accept: application/json`, `Content-Type: application/json`, `X-Locale: ar` (for Arabic/RTL).
**Standard Response Wrapper:** `{ "success": true, "data": {}, "message": "..." }`
**Pagination:** Standard `page` and `per_page` parameters returning a `meta` object with pagination details.

---

### Module 1: Global Dashboard (Screenshot 9)

**1.1 Get Dashboard Summary & KPIs**
*   **Endpoint:** `GET /dashboard/summary`
*   **Description:** Fetches the top metrics, alerts, top routes, pending trip requests, and latest complaints for the main dashboard.
*   **Response Data:** 
    *   `total_drivers`, `active_drivers`, `total_trips`, `active_trips`, `total_vehicles`, `pending_documents`
    *   `alerts`: Array of objects (Type, Message, Count)
    *   `top_routes`: Array of route objects with trip counts (e.g., {origin, destination, trips_count})
    *   `recent_trips`: Array of recent trips (ID, Driver, Route, Time, Status, Passengers)
    *   `pending_requests`: Array of pending trips/driver requests
    *   `latest_complaints`: Array of complaint objects (Driver, User, Date, Subject, Status)

---

### Module 2: Drivers List & Management (Screenshot 8)

**2.1 Get Drivers List**
*   **Endpoint:** `GET /drivers`
*   **Query Params:** `search` (Name or Phone), `status` (active, suspended, pending), `registration_date` (from, to), `sort_by`, `page`, `per_page`.
*   **Response Data:**
    *   Array of drivers: `id`, `name`, `phone`, `registration_date`, `avg_rating`, `total_trips`, `balance`, `account_status` (Active, Suspended, Pending Review).
*   **Note:** Matches the table in Screenshot 8.

**2.2 Get Driver Summary Stats**
*   **Endpoint:** `GET /drivers/stats/summary`
*   **Description:** Fetches the top header cards (Total, Active, Suspended, Pending).
*   **Response Data:** `total_drivers`, `active_drivers`, `suspended_drivers`, `pending_drivers`.

---

### Module 3: Driver Profile Detail (Screenshots 1-7, 10)

**3.1 Get Driver Global Profile**
*   **Endpoint:** `GET /drivers/{id}`
*   **Description:** Fetches the basic header info for all driver tabs.
*   **Response Data:** `id`, `name`, `phone`, `age`, `city`, `avatar_url`, `current_status` (Active, Suspended, etc.), `total_trips`, `completed_trips`, `canceled_trips`, `balance`, `avg_rating`, `total_reviews`.

#### Tab A: Overview (Screenshot 7)
**3.2 Get Driver Overview**
*   **Endpoint:** `GET /drivers/{id}/overview`
*   **Response Data:**
    *   `personal_info`: Name, Phone, Registration Date, Last Login, City.
    *   `trip_statistics`: Total, Completed, Canceled, Avg Rating.
    *   `balance_details`: Price per month, Duration, Interest Rate, Start Date, End Date.

#### Tab B: Trips (Screenshot 2)
**3.3 Get Driver Trips**
*   **Endpoint:** `GET /drivers/{id}/trips`
*   **Query Params:** `status` (all, pending, completed, canceled, active), `date_range` (e.g., `month=2026-10`), `page`, `per_page`.
*   **Response Data:** Array of trips: `trip_id`, `route` (Origin to Destination), `date_time`, `passengers_count`, `reservations_count`, `price`, `status`, `action` (View Trip).

#### Tab C: Evaluations (Screenshot 1)
**3.4 Get Driver Evaluations**
*   **Endpoint:** `GET /drivers/{id}/evaluations`
*   **Response Data:**
    *   `summary`: `average_rating` (4.8), `total_reviews` (289).
    *   `distribution`: Array of objects (e.g., `rating: 5, count: 58`, `rating: 4, count: 12`, etc. covering 5 to 1 stars).
    *   `top_tags`: Array of strings (e.g., "Clean Car", "Safe Driving").
    *   `reviews`: Array of reviews (Passenger Name, Passenger Avatar, Rating, Comment, Date).

#### Tab D: Account Status (Screenshots 3 & 10)
**3.5 Get Account Status Log**
*   **Endpoint:** `GET /drivers/{id}/account-log`
*   **Response Data:**
    *   `summary`: `violations`, `warnings`, `suspensions`, `complaints_against`, `complaints_by`.
    *   `log`: Array of records (Title, Reason, Related Trip, Date, Type (Enquiry, Warning, Suspension), Status (Pending, Resolved, Escalated)).
*   **Note:** In Screenshot 10, the top buttons indicate mutating actions. Add endpoints for these:
    *   `POST /drivers/{id}/account-status` (Body: `action` = `unblock`, `suspend`, `reactivate`)

#### Tab E: Car Details (Screenshot 4)
**3.6 Get Driver Car Details**
*   **Endpoint:** `GET /drivers/{id}/car`
*   **Response Data:**
    *   `car_info`: Make (Hyundai), Model, Year, Color, Plate Number, Seats.
    *   `car_photos`: `front`, `rear`, `dashboard`, `rear_seats`.
    *   `document_status`: Array of statuses for Registration, Insurance, etc. (`pending`, `approved`, `rejected`).

#### Tab F: Verification Documents (Screenshots 5 & 6)
**3.7 Get Driver Verification Documents**
*   **Endpoint:** `GET /drivers/{id}/documents`
*   **Description:** Fetches all driver and vehicle documents for the "توثيق" (Verification) tab.
*   **Response Data:** Grouped into `personal_documents` (ID Front/Back, Face Photo, License) and `vehicle_documents` (Registration, Insurance), each with `document_url`, `upload_date`, and `status`.

**3.8 Manage Verification Status (Actions)**
*   **Endpoint:** `POST /drivers/{id}/documents/{document_id}/approve`
*   **Endpoint:** `POST /drivers/{id}/documents/{document_id}/reject`
*   **Description:** Handles the Accept/Reject buttons in Screenshot 6.
*   **Body (for reject):** `{ "reason": "Optional reason string" }`

#### Tab G: Actions (Screenshots 5, 6, 10 - Top Bar)
**3.9 Manage Driver Availability/Status**
*   **Endpoint:** `POST /drivers/{id}/status`
*   **Body:** `{ "status": "active" | "suspended" | "pending" | "blocked" }`

---

### Module 4: Shared/Global Components

**4.1 Get Routes & Trips for Dashboard (Screenshot 9)**
*   **Endpoint:** `GET /dashboard/recent-trips`
*   **Query Params:** `page`, `per_page`, `status`
*   **Endpoint:** `GET /dashboard/top-routes`
*   **Endpoint:** `GET /dashboard/pending-requests`
*   **Endpoint:** `GET /dashboard/latest-complaints`
*   **Description:** Dedicated endpoints for the partial tables seen in the main dashboard to allow for independent pagination and filtering without reloading the whole page.

**4.2 Get All Reservations**
*   **Endpoint:** `GET /reservations` (For the sidebar "الحجوزات")
*   **Response Data:** List of reservations with driver info, passenger info, trip details, and status.

**4.3 Get Complaints**
*   **Endpoint:** `GET /complaints` (For the sidebar "الشكاوي")
*   **Response Data:** List of complaints with type (against driver / by driver), subject, involved parties, status, and actions (`POST /complaints/{id}/resolve`).

---

### Standard JSON Response Example (for Driver Profile Header):

```json
{
  "success": true,
  "data": {
    "id": 1234,
    "name": "أحمد محمد عبد العظيم شلبي",
    "phone": "078 447 2109",
    "age": 26,
    "city": "عمان",
    "avatar_url": "https://...",
    "status": "active",
    "trip_stats": {
      "total_trips": 312,
      "completed_trips": 298,
      "canceled_trips": 14,
      "avg_rating": 4.8,
      "reviews_count": 289
    },
    "balance": 50.0
  },
  "message": "Success"
}
```
