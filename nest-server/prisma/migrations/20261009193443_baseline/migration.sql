-- CreateEnum
CREATE TYPE "Role" AS ENUM ('passenger', 'driver', 'admin', 'support', 'moderator');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'warned', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "PreferredGender" AS ENUM ('male', 'female', 'any');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('sedan', 'suv', 'van', 'bus', 'hatchback');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('driver', 'unavailable', 'available');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('all', 'women_only', 'men_only');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid_cash', 'paid_other', 'disputed');

-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('open', 'offered', 'accepted', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "RequestOfferStatus" AS ENUM ('sent', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('warning', 'suspension', 'ban');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'pro_monthly', 'pro_annual');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('pickup', 'dropoff', 'both');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending_approval', 'active', 'rejected', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('bank_account', 'e-wallet', 'mobile_money');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'rejected', 'approved');

-- CreateEnum
CREATE TYPE "SosStatus" AS ENUM ('pending', 'acknowledged', 'resolved', 'cancelled');

-- CreateEnum
CREATE TYPE "DelayParty" AS ENUM ('driver', 'passenger');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "DocumentDecision" AS ENUM ('approved', 'rejected');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('pending', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "PickupType" AS ENUM ('stop', 'custom');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('pending', 'arrived', 'picked_up', 'missed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120),
    "display_name" VARCHAR(120),
    "country_code" VARCHAR(5),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(160),
    "role" "Role" NOT NULL,
    "gender" "Gender" DEFAULT 'male',
    "password_hash" VARCHAR(255) NOT NULL,
    "age" DECIMAL(3,0),
    "avatar_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "verification_submitted_at" TIMESTAMPTZ,
    "verification_rejected_at" TIMESTAMPTZ,
    "verification_rejection_reason" TEXT,
    "verification_rejection_fields" JSONB DEFAULT '[]',
    "avg_rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "strikes" SMALLINT NOT NULL DEFAULT 0,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'ar',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "fcm_token" TEXT,
    "last_login_at" TIMESTAMPTZ,
    "total_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_in_debt" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "user_identification_front" INTEGER,
    "user_identification_back" INTEGER,
    "lincese_front" INTEGER,
    "lincese_back" INTEGER,
    "personal_image_with_id" INTEGER,
    "national_id" VARCHAR(30),
    "id_verified" BOOLEAN DEFAULT false,
    "license_number" VARCHAR(50),
    "license_expiry" DATE,
    "subscription_tier" "SubscriptionTier" DEFAULT 'free',
    "subscription_expires_at" TIMESTAMPTZ,
    "total_trips" INTEGER DEFAULT 0,
    "total_earnings" DECIMAL(12,2) DEFAULT 0,
    "response_rate" DECIMAL(5,2) DEFAULT 100,
    "punctuality_rate" DECIMAL(5,2),
    "professional_driver" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "manufacturer" VARCHAR(80) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "model_year" SMALLINT,
    "plate_number" VARCHAR(20) NOT NULL,
    "code_number" VARCHAR(20),
    "color" VARCHAR(30),
    "seats" SMALLINT NOT NULL,
    "registration_doc_front" INTEGER,
    "registration_doc_back" INTEGER,
    "vehicle_photo_front" INTEGER,
    "vehicle_photo_back" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_notes" TEXT,
    "verification_rejection_reason" TEXT,
    "verification_rejected_at" TIMESTAMPTZ,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_profiles" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "preferred_gender" "PreferredGender" DEFAULT 'any',
    "smoking_preference" VARCHAR(30) DEFAULT 'no_preference',
    "saved_routes" JSONB DEFAULT '[]',
    "national_id" VARCHAR(30),
    "home_address" VARCHAR(255),
    "emergency_contacts" JSONB DEFAULT '[]',
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passenger_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "origin_city" VARCHAR(100) NOT NULL,
    "origin_area" VARCHAR(120),
    "origin_address" VARCHAR(255),
    "origin_lat" DECIMAL(10,8),
    "origin_lng" DECIMAL(11,8),
    "destination_city" VARCHAR(100) NOT NULL,
    "destination_area" VARCHAR(120),
    "destination_address" VARCHAR(255),
    "destination_lat" DECIMAL(10,8),
    "destination_lng" DECIMAL(11,8),
    "departure_time" TIMESTAMPTZ NOT NULL,
    "arrival_time" TIMESTAMPTZ,
    "total_seats" SMALLINT NOT NULL,
    "available_seats" SMALLINT NOT NULL,
    "fare_per_seat" DECIMAL(10,2) NOT NULL,
    "total_profit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) DEFAULT 'JOD',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" JSONB,
    "recurrence_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "recurrence_end_date" TIMESTAMPTZ,
    "gender_preference" "GenderPreference" NOT NULL DEFAULT 'all',
    "driver_instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additional_instructions" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'published',
    "is_featured" BOOLEAN DEFAULT false,
    "featured_until" TIMESTAMPTZ,
    "is_blocked_by_balance" BOOLEAN NOT NULL DEFAULT false,
    "is_moderated" BOOLEAN NOT NULL DEFAULT false,
    "moderation_reason" TEXT,
    "moderated_by" UUID,
    "route_polyline" TEXT,
    "route_distance_m" INTEGER,
    "route_duration_s" INTEGER,
    "route_status" "RouteStatus" NOT NULL DEFAULT 'pending',
    "route_computed_at" TIMESTAMPTZ,
    "route_version" INTEGER NOT NULL DEFAULT 0,
    "actual_path_polyline" TEXT,
    "actual_distance_m" INTEGER,
    "actual_duration_s" INTEGER,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_attributes" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "attr_key" VARCHAR(30) NOT NULL,
    "attr_value" VARCHAR(30) NOT NULL,

    CONSTRAINT "trip_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "stop_order" SMALLINT NOT NULL,
    "stop_name" VARCHAR(120),
    "city" VARCHAR(80),
    "address" VARCHAR(255),
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "stop_lat" DECIMAL(10,8),
    "stop_lng" DECIMAL(11,8),
    "stop_type" "StopType",
    "estimated_arrival" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_seats" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "seat_number" SMALLINT NOT NULL,
    "seat_type" "SeatType" NOT NULL,
    "was_available" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_locations" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "lat" DECIMAL(10,8) NOT NULL,
    "lng" DECIMAL(11,8) NOT NULL,
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(10,2),
    "occurrence_date" DATE,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "seat_number" SMALLINT,
    "seat_numbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "seats_booked" SMALLINT NOT NULL DEFAULT 1,
    "agreed_fare" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'JOD',
    "pickup_place" VARCHAR(120),
    "pickup_lat" DECIMAL(10,8),
    "pickup_lng" DECIMAL(11,8),
    "pickup_order" SMALLINT,
    "pickup_type" "PickupType",
    "pickup_stop_id" UUID,
    "pickup_label" TEXT,
    "pickup_city" VARCHAR(100),
    "pickup_area" VARCHAR(120),
    "detour_seconds" INTEGER,
    "pickup_status" "PickupStatus" NOT NULL DEFAULT 'pending',
    "arrived_at" TIMESTAMPTZ,
    "picked_up_at" TIMESTAMPTZ,
    "dropoff_place" VARCHAR(120),
    "dropoff_lat" DECIMAL(10,8),
    "dropoff_lng" DECIMAL(11,8),
    "dropoff_deadline" TIMESTAMPTZ,
    "dropoff_order" SMALLINT,
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "reference_code" VARCHAR(12) NOT NULL,
    "cancellation_reason" TEXT,
    "cancelled_by" UUID,
    "cancelled_at" TIMESTAMPTZ,
    "payment_status" "PaymentStatus" DEFAULT 'pending',
    "completed_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_requests" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "origin_place" VARCHAR(120) NOT NULL,
    "origin_city" VARCHAR(80) NOT NULL,
    "origin_lat" DECIMAL(10,8),
    "origin_lng" DECIMAL(11,8),
    "origin_time" TIMESTAMPTZ,
    "destination_place" VARCHAR(120) NOT NULL,
    "destination_city" VARCHAR(80) NOT NULL,
    "destination_lat" DECIMAL(10,8),
    "destination_lng" DECIMAL(11,8),
    "arrival_deadline" TIMESTAMPTZ,
    "seats_needed" SMALLINT NOT NULL DEFAULT 1,
    "max_budget" DECIMAL(10,2),
    "currency" VARCHAR(3) DEFAULT 'JOD',
    "attributes_preferred" JSONB DEFAULT '{}',
    "note" TEXT,
    "status" "RideRequestStatus" NOT NULL DEFAULT 'open',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_offers" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "trip_id" UUID,
    "offered_fare" DECIMAL(10,2),
    "message" TEXT,
    "status" "RequestOfferStatus" NOT NULL DEFAULT 'sent',
    "agreed_fare" DECIMAL(10,2),
    "booking_id" UUID,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "rater_id" UUID NOT NULL,
    "ratee_id" UUID NOT NULL,
    "stars" SMALLINT NOT NULL,
    "was_late" BOOLEAN DEFAULT false,
    "late_minutes" SMALLINT DEFAULT 0,
    "review" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_visible" BOOLEAN DEFAULT true,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delay_events" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "party" "DelayParty" NOT NULL,
    "delay_minutes" SMALLINT NOT NULL,
    "reason" TEXT,
    "reported_by" UUID NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delay_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "booking_id" UUID,
    "reporter_id" UUID NOT NULL,
    "accused_id" UUID NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ComplaintStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalties" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "complaint_id" UUID,
    "trip_id" UUID,
    "type" "PenaltyType" NOT NULL,
    "penalty_type" VARCHAR(30) NOT NULL DEFAULT 'general',
    "severity" VARCHAR(15) NOT NULL DEFAULT 'minor',
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "starts_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ,
    "issued_by" UUID,
    "is_appealed" BOOLEAN DEFAULT false,
    "appeal_reason" TEXT,
    "appeal_resolved_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" DEFAULT 'medium',
    "status" "TicketStatus" DEFAULT 'open',
    "assigned_to" UUID,
    "reference_code" VARCHAR(12),
    "booking_id" UUID,
    "trip_id" UUID,
    "resolution_notes" TEXT,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID,
    "booking_id" UUID,
    "support_ticket_id" UUID,
    "message" TEXT NOT NULL,
    "message_type" VARCHAR(20) NOT NULL DEFAULT 'text',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "booking_id" UUID,
    "lat" DECIMAL(10,8) NOT NULL,
    "lng" DECIMAL(11,8) NOT NULL,
    "urgency" VARCHAR(20) NOT NULL DEFAULT 'high',
    "status" "SosStatus" NOT NULL DEFAULT 'pending',
    "escalation_level" SMALLINT NOT NULL DEFAULT 0,
    "last_alert_at" TIMESTAMPTZ,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMPTZ,
    "resolved_by" UUID,
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMPTZ,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB DEFAULT '{}',
    "is_read" BOOLEAN DEFAULT false,
    "sent_via" TEXT[] DEFAULT ARRAY['push']::TEXT[],
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" VARCHAR(30) NOT NULL,
    "enabled_in_app" BOOLEAN NOT NULL DEFAULT true,
    "enabled_push" BOOLEAN NOT NULL DEFAULT true,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_drivers" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_routes" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "origin_city" VARCHAR(80) NOT NULL,
    "destination_city" VARCHAR(80) NOT NULL,
    "label" VARCHAR(50),
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recent_search" (
    "id" UUID NOT NULL,
    "passenger_id" UUID NOT NULL,
    "origin_city" VARCHAR(100) NOT NULL,
    "destination_city" VARCHAR(100) NOT NULL,
    "searched_on" DATE NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "performed_by" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "period_days" INTEGER NOT NULL,
    "percentage_cut" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(30),
    "features" JSONB NOT NULL DEFAULT '[]',
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "free_offer" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_subscriptions" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "plan_period_days" INTEGER NOT NULL,
    "plan_percentage_cut" DECIMAL(5,2) NOT NULL,
    "plan_cost" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "screenshot_id" INTEGER,
    "payment_method" JSONB NOT NULL,
    "admin_notes" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending_approval',
    "approved_at" TIMESTAMPTZ,
    "activated_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "free_trips_used" INTEGER NOT NULL DEFAULT 0,
    "free_offer" JSONB,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_transactions" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "tier" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'JOD',
    "payment_method" VARCHAR(20) NOT NULL,
    "status" VARCHAR(15) DEFAULT 'pending',
    "provider_transaction_id" VARCHAR(255),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "email" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_images" (
    "id" SERIAL NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER,
    "provider" TEXT,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "status" "DeletionStatus" NOT NULL DEFAULT 'pending',
    "estimated_completion" TIMESTAMPTZ,
    "review_notes" TEXT,
    "reviewed_by" UUID,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_reviews" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "document_key" VARCHAR(40) NOT NULL,
    "decision" "DocumentDecision" NOT NULL,
    "reason" TEXT,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_status_changes" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "from_status" "VerificationStatus",
    "to_status" "VerificationStatus" NOT NULL,
    "reason" TEXT,
    "marked_fields" JSONB,
    "changed_by" UUID,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_driver_id_key" ON "driver_profiles"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_driver_id_key" ON "vehicles"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_profiles_passenger_id_key" ON "passenger_profiles"("passenger_id");

-- CreateIndex
CREATE INDEX "idx_trips_driver_departure" ON "trips"("driver_id", "departure_time");

-- CreateIndex
CREATE INDEX "idx_trips_origin_dest" ON "trips"("origin_city", "destination_city", "departure_time");

-- CreateIndex
CREATE INDEX "idx_trips_status" ON "trips"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_attributes_trip_id_attr_key_key" ON "trip_attributes"("trip_id", "attr_key");

-- CreateIndex
CREATE INDEX "idx_trip_stops_trip" ON "trip_stops"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stops_trip_id_stop_order_key" ON "trip_stops"("trip_id", "stop_order");

-- CreateIndex
CREATE INDEX "idx_trip_seats_trip" ON "trip_seats"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_seats_trip_id_seat_number_key" ON "trip_seats"("trip_id", "seat_number");

-- CreateIndex
CREATE INDEX "idx_trip_locations_trip_created" ON "trip_locations"("trip_id", "createdat");

-- CreateIndex
CREATE INDEX "idx_trip_locations_trip_occurrence" ON "trip_locations"("trip_id", "occurrence_date");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_code_key" ON "bookings"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_reference_code_key" ON "support_tickets"("reference_code");

-- CreateIndex
CREATE INDEX "idx_support_ticket_messages_ticket" ON "support_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_messages_booking_created" ON "messages"("booking_id", "createdat");

-- CreateIndex
CREATE INDEX "idx_messages_ticket_created" ON "messages"("support_ticket_id", "createdat");

-- CreateIndex
CREATE INDEX "idx_sos_status" ON "sos_events"("status");

-- CreateIndex
CREATE INDEX "idx_sos_trip" ON "sos_events"("trip_id");

-- CreateIndex
CREATE INDEX "idx_sos_user" ON "sos_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_notification_settings_user" ON "notification_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_notification_type_key" ON "notification_settings"("user_id", "notification_type");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_drivers_passenger_id_driver_id_key" ON "favorite_drivers"("passenger_id", "driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_routes_passenger_id_origin_city_destination_city_key" ON "favorite_routes"("passenger_id", "origin_city", "destination_city");

-- CreateIndex
CREATE INDEX "idx_recent_search_passenger_date" ON "recent_search"("passenger_id", "searched_on");

-- CreateIndex
CREATE UNIQUE INDEX "recent_search_passenger_id_origin_city_destination_city_key" ON "recent_search"("passenger_id", "origin_city", "destination_city");

-- CreateIndex
CREATE INDEX "idx_plans_active" ON "subscription_plans"("is_active");

-- CreateIndex
CREATE INDEX "idx_subscriptions_driver" ON "driver_subscriptions"("driver_id", "status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_plan" ON "driver_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_expiry" ON "driver_subscriptions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "idx_payment_methods_active" ON "payment_methods"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_images_hash_key" ON "uploaded_images"("hash");

-- CreateIndex
CREATE INDEX "idx_deletion_requests_user" ON "deletion_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_deletion_requests_status" ON "deletion_requests"("status");

-- CreateIndex
CREATE INDEX "idx_document_reviews_driver" ON "document_reviews"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_reviews_driver_id_document_key_key" ON "document_reviews"("driver_id", "document_key");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_profiles" ADD CONSTRAINT "passenger_profiles_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_attributes" ADD CONSTRAINT "trip_attributes_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_seats" ADD CONSTRAINT "trip_seats_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_offers" ADD CONSTRAINT "request_offers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ride_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_offers" ADD CONSTRAINT "request_offers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_offers" ADD CONSTRAINT "request_offers_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_id_fkey" FOREIGN KEY ("ratee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delay_events" ADD CONSTRAINT "delay_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_accused_id_fkey" FOREIGN KEY ("accused_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_support_ticket_id_fkey" FOREIGN KEY ("support_ticket_id") REFERENCES "support_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_drivers" ADD CONSTRAINT "favorite_drivers_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_drivers" ADD CONSTRAINT "favorite_drivers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_routes" ADD CONSTRAINT "favorite_routes_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recent_search" ADD CONSTRAINT "recent_search_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_subscriptions" ADD CONSTRAINT "driver_subscriptions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_subscriptions" ADD CONSTRAINT "driver_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_subscriptions" ADD CONSTRAINT "driver_subscriptions_screenshot_id_fkey" FOREIGN KEY ("screenshot_id") REFERENCES "uploaded_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_status_changes" ADD CONSTRAINT "verification_status_changes_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
