-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    country_code VARCHAR(5),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(160) UNIQUE,
    role VARCHAR(15) NOT NULL CHECK (role IN ('passenger', 'driver', 'admin', 'support', 'moderator')),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')) DEFAULT 'male',
    password_hash VARCHAR(255) NOT NULL,
    age numeric(3),
    avatar_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avg_rating NUMERIC(2,1) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    strikes SMALLINT NOT NULL DEFAULT 0, -- accumulated warnings
    locale VARCHAR(5) NOT NULL DEFAULT 'ar',
    status VARCHAR(15) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'warned', 'suspended', 'banned')),
    fcm_token TEXT, -- for push notifications
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- =====================================================
-- 2. VEHICLES TABLE
-- =====================================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manufacturer VARCHAR(80) NOT NULL, -- e.g., "Toyota", "Honda", "Ford"
    model VARCHAR(80) NOT NULL, -- e.g., "Camry", "Civic", "Focus"
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'bus', 'hatchback')),
    model_year SMALLINT,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(30),
    seats SMALLINT NOT NULL CHECK (seats BETWEEN 1 AND 50),

    registration_doc_front NUMERIC, -- ID to registration image
    registration_doc_back NUMERIC, -- ID to registration image
    vehicle_photo_front NUMERIC, -- ID to vehicle image
    vehicle_photo_back NUMERIC, -- ID to vehicle image

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);

-- =====================================================
-- 3. DRIVER PROFILES (Extended driver info)
-- =====================================================
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_identification_front NUMERIC, -- ID refrence to Uploaded Image
    user_identification_back NUMERIC,   -- ID refrence to Uploaded Image
    lincese_front NUMERIC,  -- ID refrence to Uploaded Image
    lincese_back NUMERIC,   -- ID refrence to Uploaded Image
    personal_image_with_id NUMERIC, -- ID refrence to Uploaded Image
    id_verified BOOLEAN DEFAULT FALSE,
    license_number VARCHAR(50),
    license_expiry DATE,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro_monthly', 'pro_annual')),
    subscription_expires_at TIMESTAMPTZ,
    total_trips INTEGER DEFAULT 0,
    total_earnings NUMERIC(12,2) DEFAULT 0, -- informational only, not processed by platform
    response_rate NUMERIC(5,2) DEFAULT 100,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. PASSENGER PREFERENCES
-- =====================================================
CREATE TABLE passenger_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_gender VARCHAR(10) CHECK (preferred_gender IN ('male', 'female', 'any')) DEFAULT 'any',
    smoking_preference VARCHAR(20) CHECK (smoking_preference IN ('no_preference', 'non_smoking', 'smoking_allowed')) DEFAULT 'no_preference',
    saved_routes JSONB DEFAULT '[]', -- [{origin, destination, frequency}]
    emergency_contacts JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. TRIPS TABLE
-- =====================================================
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    origin_city VARCHAR(80) NOT NULL,
    origin_address VARCHAR(255),
    origin_lat NUMERIC(10, 8), -- PostGIS alternative: geometry(Point, 4326)
    origin_lng NUMERIC(11, 8),
    destination_city VARCHAR(80) NOT NULL,
    destination_address VARCHAR(255),
    destination_lat NUMERIC(10, 8),
    destination_lng NUMERIC(11, 8),
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ, -- estimated
    total_seats SMALLINT NOT NULL,
    available_seats SMALLINT NOT NULL,
    fare_per_seat NUMERIC(10,2) NOT NULL, -- displayed fare; paid off-platform
    currency VARCHAR(3) DEFAULT 'JOD',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern JSONB, -- {frequency: 'daily', days: [1,3,5], until: '2026-12-31'}
    status VARCHAR(15) NOT NULL DEFAULT 'published' 
        CHECK (status IN ('published', 'full', 'ongoing', 'completed', 'cancelled')),
    is_featured BOOLEAN DEFAULT FALSE, -- paid promotion
    featured_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_route_time ON trips(origin_city, destination_city, departure_time);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_departure ON trips(departure_time);

-- =====================================================
-- 6. TRIP ATTRIBUTES (Service flags)
-- =====================================================
CREATE TABLE trip_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    attr_key VARCHAR(30) NOT NULL, -- 'smoking_allowed', 'women_only', 'ac', 'pets', 'luggage', 'music'
    attr_value VARCHAR(30) NOT NULL, -- 'true', 'false', 'yes', 'no'
    UNIQUE (trip_id, attr_key)
);

CREATE INDEX idx_trip_attrs_trip ON trip_attributes(trip_id);

-- =====================================================
-- 7. TRIP STOPS (Intermediate pickup/dropoff points)
-- =====================================================
CREATE TABLE trip_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    stop_order SMALLINT NOT NULL,
    city VARCHAR(80) NOT NULL,
    address VARCHAR(255),
    lat NUMERIC(10, 8),
    lng NUMERIC(11, 8),
    stop_type VARCHAR(20) NOT NULL CHECK (stop_type IN ('pickup', 'dropoff', 'both')),
    estimated_arrival TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_stops_trip ON trip_stops(trip_id);

-- =====================================================
-- 8. BOOKINGS (Reservations)
-- =====================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id),
    passenger_id UUID NOT NULL REFERENCES users(id),
    seat_number SMALLINT, -- specific chosen seat
    seats_booked SMALLINT NOT NULL DEFAULT 1 CHECK (seats_booked > 0),
    agreed_fare NUMERIC(10,2) NOT NULL, -- recorded for dispute reference
    currency VARCHAR(3) DEFAULT 'JOD',
    dropoff_place VARCHAR(120),
    dropoff_deadline TIMESTAMPTZ, -- for drop-off sequencing
    dropoff_order SMALLINT, -- computed sequence
    status VARCHAR(15) NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    reference_code VARCHAR(12) UNIQUE NOT NULL,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid_cash', 'paid_other', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(reference_code);

-- =====================================================
-- 9. RIDE REQUESTS (Passenger demand board)
-- =====================================================
CREATE TABLE ride_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    origin_place VARCHAR(120) NOT NULL, -- precise place, not just city
    origin_city VARCHAR(80) NOT NULL,
    origin_lat NUMERIC(10, 8),
    origin_lng NUMERIC(11, 8),
    origin_time TIMESTAMPTZ NOT NULL, -- desired departure
    destination_place VARCHAR(120) NOT NULL,
    destination_city VARCHAR(80) NOT NULL,
    destination_lat NUMERIC(10, 8),
    destination_lng NUMERIC(11, 8),
    arrival_deadline TIMESTAMPTZ, -- desired arrival
    seats_needed SMALLINT NOT NULL DEFAULT 1,
    max_budget NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'JOD',
    attributes_preferred JSONB DEFAULT '{}', -- {smoking: false, women_only: true}
    status VARCHAR(15) NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'offered', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_requests_passenger ON ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_ride_requests_route ON ride_requests(origin_city, destination_city);

-- =====================================================
-- 10. REQUEST OFFERS (Driver offers on passenger requests)
-- =====================================================
CREATE TABLE request_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES ride_requests(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    trip_id UUID REFERENCES trips(id), -- optional linked trip
    offered_fare NUMERIC(10,2),
    message TEXT,
    status VARCHAR(15) NOT NULL DEFAULT 'sent' 
        CHECK (status IN ('sent', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_offers_request ON request_offers(request_id);
CREATE INDEX idx_request_offers_driver ON request_offers(driver_id);

-- =====================================================
-- 11. RATINGS (Mutual ratings with punctuality)
-- =====================================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    rater_id UUID NOT NULL REFERENCES users(id),
    ratee_id UUID NOT NULL REFERENCES users(id),
    stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    was_late BOOLEAN DEFAULT FALSE, -- punctuality signal
    late_minutes SMALLINT DEFAULT 0,
    review TEXT,
    tags TEXT[], -- ['clean_car', 'safe_driving', 'punctual', 'rude', 'overcharged']
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ratings_booking ON ratings(booking_id);
CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);

-- =====================================================
-- 12. DELAY EVENTS (Recorded lateness)
-- =====================================================
CREATE TABLE delay_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    party VARCHAR(10) NOT NULL CHECK (party IN ('driver', 'passenger')),
    delay_minutes SMALLINT NOT NULL,
    reason TEXT,
    reported_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delay_events_booking ON delay_events(booking_id);

-- =====================================================
-- 13. COMPLAINTS
-- =====================================================
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    accused_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(30) NOT NULL, -- 'no_show', 'lateness', 'misconduct', 'fraud', 'safety', 'overcharging'
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(15) NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_reporter ON complaints(reporter_id);
CREATE INDEX idx_complaints_accused ON complaints(accused_id);
CREATE INDEX idx_complaints_status ON complaints(status);

-- =====================================================
-- 14. PENALTIES (Enforcement actions)
-- =====================================================
CREATE TABLE penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    complaint_id UUID REFERENCES complaints(id),
    type VARCHAR(15) NOT NULL CHECK (type IN ('warning', 'suspension', 'ban')),
    reason TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ, -- null = permanent (ban)
    issued_by UUID REFERENCES users(id), -- admin/moderator
    is_appealed BOOLEAN DEFAULT FALSE,
    appeal_reason TEXT,
    appeal_resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalties_user ON penalties(user_id);
CREATE INDEX idx_penalties_type ON penalties(type);

-- =====================================================
-- 15. SUPPORT TICKETS
-- =====================================================
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(30) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(15) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

-- =====================================================
-- 16. NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(30) NOT NULL, -- 'booking_confirmed', 'driver_offer', 'trip_reminder', 'delay_alert'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- {trip_id, booking_id, reference_code}
    is_read BOOLEAN DEFAULT FALSE,
    sent_via VARCHAR(20)[] DEFAULT ARRAY['push'], -- push, sms, in_app
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- =====================================================
-- 17. FAVORITE DRIVERS
-- =====================================================
CREATE TABLE favorite_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (passenger_id, driver_id)
);

-- =====================================================
-- 18. FAVORITE ROUTES
-- =====================================================
CREATE TABLE favorite_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    origin_city VARCHAR(80) NOT NULL,
    destination_city VARCHAR(80) NOT NULL,
    label VARCHAR(50), -- "Home to University"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (passenger_id, origin_city, destination_city)
);

-- =====================================================
-- 19. AUDIT LOGS (Immutable)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- =====================================================
-- 20. SUBSCRIPTION TRANSACTIONS (Driver payments to platform)
-- =====================================================
CREATE TABLE subscription_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id),
    tier VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JOD',
    payment_method VARCHAR(20) NOT NULL, -- 'card', 'wallet', 'bank_transfer'
    status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider_transaction_id VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_request_offers_updated_at BEFORE UPDATE ON request_offers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update avg_rating after new rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET avg_rating = (
        SELECT ROUND(AVG(stars)::numeric, 1) 
        FROM ratings 
        WHERE ratee_id = NEW.ratee_id AND is_visible = TRUE
    )
    WHERE id = NEW.ratee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_rating
    AFTER INSERT OR UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rating();

-- Decrease available_seats on booking
CREATE OR REPLACE FUNCTION decrease_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE trips 
        SET available_seats = available_seats - NEW.seats_booked,
            status = CASE WHEN available_seats - NEW.seats_booked <= 0 THEN 'full' ELSE status END
        WHERE id = NEW.trip_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_trip_seats
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION decrease_trip_seats();

-- Increase available_seats on cancellation
CREATE OR REPLACE FUNCTION increase_trip_seats_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        UPDATE trips 
        SET available_seats = available_seats + OLD.seats_booked,
            status = CASE WHEN status = 'full' THEN 'published' ELSE status END
        WHERE id = OLD.trip_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increase_trip_seats
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status = 'confirmed' AND NEW.status = 'cancelled')
    EXECUTE FUNCTION increase_trip_seats_on_cancel();

-- Generate reference code for bookings
CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_code := 'MSR-' || UPPER(SUBSTRING(MD5(NEW.id::text), 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_reference_code
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_reference_code();