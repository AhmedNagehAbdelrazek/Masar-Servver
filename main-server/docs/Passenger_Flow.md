# Passenger Flow Specification (Add/Modify Backend)

## 1. Overview of the Flow
1. **Search & Filter (Home):** Passenger enters filters (time range, seats, vehicle type, gender pref, instructions) and searches for available trips.
2. **Trip Details (Image 2):** Passenger selects a trip and views basic trip, driver, and vehicle details.
3. **Reservation (Going Off Point & Seats):** Passenger clicks proceed, selects an intermediate "Going Off Point" (drop-off point), selects the number of seats, and clicks "Reserve".
4. **Post-Reservation:**
   - **Reservation List (Image 3):** The system returns a list of reservations with specific statuses (Upcoming, Completed, etc.) and details.
   - **Driver Data Reveal (Image 4):** A dedicated endpoint allows the passenger to see the driver's detailed profile (PII like National ID, Age) *after* the reservation is confirmed.
5. **Passenger Ride Request (Matching):** Passenger can create a request that holds all trip data. The system matches this request against active driver routes based on specific priority rules.

---

## 2. Detailed API & Backend Requirements

### A. Search Filters (Home Screen)
**Endpoint:** `GET /api/trips/search` *(Modify existing)*
**New Query Parameters:**
- `time_from` (e.g., `HH:mm`)
- `time_to` (e.g., `HH:mm`)
- `seats` (Int)
- `vehicle_type` (String: Sedan, Van, etc.)
- `gender_preference` (Enum: Male, Female, Any)
- `instructions` (String/Text)
**Response:** Returns an array of matching trips (as per Image 2 format) that fit the selected time window and filters.

### B. Trip Details & Reservation Flow (Images 2 & Booking Steps)
**Endpoint 1: Get Trip Details (Modify Existing)**
- Return data to match Image 2: Driver basic info, Vehicle details (Car, Plate), Fare, and Time.

**Endpoint 2: Get Available Drop-off Points & Seats (New)**
- **Endpoint:** `GET /api/trips/{trip_id}/options`
- **Response:** 
  - `drop_off_points`: List of IDs (or Lat/Lng) along the driver's predefined route where the passenger can "get off".
  - `available_seats`: The precise number of seats currently open.

**Endpoint 3: Create Reservation (Modify Existing)**
- **Endpoint:** `POST /api/reservations`
- **Payload:** `{ trip_id, passenger_id, drop_off_point_id, selected_seats }`
- **Logic:** Upon clicking "Reserve", the system checks if the `drop_off_point` is valid and if `selected_seats` is still available. If yes, the reservation is created and the seats are locked.

### C. Reservation List (Image 3)
**Endpoint:** `GET /api/reservations` *(Modify Existing)*
The system must return the reservation data structured exactly like Image 3. This means each reservation object contains:
- `status`: Enum (`upcoming`, `in_progress`, `completed`, `cancelled`)
- `time`: Date and time.
- `origin`: Location name.
- `destination`: Location name.
- `driver_info`: Name, Image, Rating.
- `vehicle_info`: Car Type, Plate, Number of Seats.
- `fare`: Price.
- `passenger_rating`: The rating the passenger gave the driver (e.g., `5.0`).
- **Note:** Ensure this endpoint filters correctly by `status` (All, Upcoming, In Progress, Completed, Cancelled) as seen in Image 3.

### D. Driver Data Reveal (Image 4)
**Endpoint:** `GET /api/reservations/{reservation_id}/driver-profile` *(New)*
*Constraint: To avoid leaking sensitive data prematurely, this endpoint should only be accessible via a valid Reservation ID (post-reservation).*
**Response:** Returns full driver data as seen in Image 4:
- `first_name`, `last_name`, `phone_number`, `national_id`
- `age`, `gender`
- `driver_stats`: `punctuality_rate` (96%), `completed_trips` (32), `rating` (4.8)
- `is_professional_driver`: Boolean (with badge)
- `vehicle_details`: `manufacturer` (Hyundai), `model` (Elantra), `year` (2016), `color` (White), `plate_number` (12-34567), `seat_capacity` (4).

### E. Passenger Ride Request & Matching Engine (Backend Logic)
**Endpoint:** `POST /api/ride-requests` *(New)*
**Payload:** The request holds almost all data from a driver's ride creation:
- `origin`
- `destination`
- `date_to_launch`
- `time_range`: `{ from: "14:00", to: "15:00" }`
- `seats_to_reserve`: (Int)
- `gender_preferences`: (Enum)
- `notes_to_driver`: (String)

**Matching System Logic:**
The system will run a matching job (real-time or background cron) against active driver trips. The priority of matching, as specified, is:
1. **Origin & Destination:** Must be the highest priority; these need to match or fall within a tight proximity threshold.
2. **Time Range:** The driver's trip time must fall within the passenger's requested time range.
3. **Seats Availability:** The driver's trip must have at least the requested number of seats available.
4. **Gender Preference:** Must match the driver's gender if the passenger specified a preference; otherwise, any.

---

## 3. Specific Backend Modifications (No Breaking Changes)

Since the constraint is to **"not change the current backend just add or modify"**:
- **Do not alter existing Database Tables** without migrating data unless absolutely necessary. Instead, add new fields to existing tables with default values (`NULL` or `0`).
- **Extend Responses:** Where existing endpoints (like `GET /reservations`) are used, add new key-value pairs in the JSON response so older app versions can ignore the new data without crashing.
- **New Endpoint Isolation:** The "Driver Data Reveal" (Image 4) should be a totally new endpoint, rather than modifying the initial trip search endpoint. This ensures that PII (National ID, specific age) is **not** exposed to passengers who haven't even booked yet.
- **Reservation State:** The "Go/Proceed" step before selecting seats should trigger a temporary `reservation_lock` on the chosen seats for 5-10 minutes to prevent double booking.

## 4. Development Priorities
1. **Search Filters** (Add query params to GET `/api/trips/search`).
2. **Trip Options** (Create `GET /api/trips/{id}/options`).
3. **Reservation Creation** (Modify `POST /api/reservations` to accept `drop_off_point` and `seat_count`).
4. **Reservation List** (Modify `GET /api/reservations` to include statuses and details from Image 3).
5. **Driver Reveal** (Create `GET /api/reservations/{id}/driver-profile`).
6. **Ride Requests & Matching** (Create `POST /api/ride-requests` and implement a robust matching service).