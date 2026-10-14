-- Shared-DB convergence: stop using native PG enums so the Nest (Prisma)
-- server and the Express (Sequelize) server can run against ONE database.
--
-- Background: Prisma's baseline migration created `"SosStatus"`-style enum
-- types, while Sequelize creates `enum_<table>_<column>` types. Prisma emits
-- explicit `CAST(... AS "SosStatus")`, which 42704s on a Sequelize-managed
-- DB (`type "public.SosStatus" does not exist`) and crashed the Nest process
-- via the SOS escalation job. The schema now declares every value set as
-- String (allowed values enforced app-side from Main Server/config/constants.ts).
--
-- This migration converts all enum columns to VARCHAR (preserving values via
-- `USING ...::text`) and drops the baseline enum types. It is safe on BOTH
-- flavors of existing DBs:
--   * Prisma-baseline DBs: converts `"Enum"` columns, drops the types.
--   * Sequelize-managed DBs: converts `enum_*` columns; DROP TYPEs are no-ops.
-- Sequelize `sync({ force:false })` only creates missing tables, so it will
-- not revert these columns; both ORMs read/write plain strings afterwards.
-- Apply once with `prisma migrate deploy` (or the equivalent SQL) during a
-- low-traffic window; each ALTER rewrites the table.

ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR(20) USING "role"::text;
ALTER TABLE "users" ALTER COLUMN "gender" TYPE VARCHAR(10) USING "gender"::text;
ALTER TABLE "users" ALTER COLUMN "verification_status" TYPE VARCHAR(20) USING "verification_status"::text;
ALTER TABLE "users" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "driver_profiles" ALTER COLUMN "subscription_tier" TYPE VARCHAR(20) USING "subscription_tier"::text;

ALTER TABLE "vehicles" ALTER COLUMN "vehicle_type" TYPE VARCHAR(20) USING "vehicle_type"::text;

ALTER TABLE "passenger_profiles" ALTER COLUMN "preferred_gender" TYPE VARCHAR(10) USING "preferred_gender"::text;

ALTER TABLE "trips" ALTER COLUMN "gender_preference" TYPE VARCHAR(20) USING "gender_preference"::text;
ALTER TABLE "trips" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;
ALTER TABLE "trips" ALTER COLUMN "route_status" TYPE VARCHAR(20) USING "route_status"::text;

ALTER TABLE "trip_stops" ALTER COLUMN "stop_type" TYPE VARCHAR(20) USING "stop_type"::text;

ALTER TABLE "trip_seats" ALTER COLUMN "seat_type" TYPE VARCHAR(20) USING "seat_type"::text;

ALTER TABLE "bookings" ALTER COLUMN "pickup_type" TYPE VARCHAR(20) USING "pickup_type"::text;
ALTER TABLE "bookings" ALTER COLUMN "pickup_status" TYPE VARCHAR(20) USING "pickup_status"::text;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;
ALTER TABLE "bookings" ALTER COLUMN "payment_status" TYPE VARCHAR(20) USING "payment_status"::text;

ALTER TABLE "ride_requests" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "request_offers" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "complaints" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "penalties" ALTER COLUMN "type" TYPE VARCHAR(20) USING "type"::text;

ALTER TABLE "support_tickets" ALTER COLUMN "priority" TYPE VARCHAR(10) USING "priority"::text;
ALTER TABLE "support_tickets" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "sos_events" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "delay_events" ALTER COLUMN "party" TYPE VARCHAR(20) USING "party"::text;

ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE VARCHAR(10) USING "action"::text;

ALTER TABLE "driver_subscriptions" ALTER COLUMN "status" TYPE VARCHAR(30) USING "status"::text;

ALTER TABLE "payment_methods" ALTER COLUMN "type" TYPE VARCHAR(20) USING "type"::text;

ALTER TABLE "deletion_requests" ALTER COLUMN "status" TYPE VARCHAR(20) USING "status"::text;

ALTER TABLE "document_reviews" ALTER COLUMN "decision" TYPE VARCHAR(20) USING "decision"::text;

ALTER TABLE "verification_status_changes" ALTER COLUMN "from_status" TYPE VARCHAR(20) USING "from_status"::text;
ALTER TABLE "verification_status_changes" ALTER COLUMN "to_status" TYPE VARCHAR(20) USING "to_status"::text;

-- Drop the baseline native enum types (no-ops on Sequelize-managed DBs).
DROP TYPE IF EXISTS "Role";
DROP TYPE IF EXISTS "UserStatus";
DROP TYPE IF EXISTS "Gender";
DROP TYPE IF EXISTS "PreferredGender";
DROP TYPE IF EXISTS "VehicleType";
DROP TYPE IF EXISTS "TripStatus";
DROP TYPE IF EXISTS "SeatType";
DROP TYPE IF EXISTS "GenderPreference";
DROP TYPE IF EXISTS "BookingStatus";
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "RideRequestStatus";
DROP TYPE IF EXISTS "RequestOfferStatus";
DROP TYPE IF EXISTS "ComplaintStatus";
DROP TYPE IF EXISTS "PenaltyType";
DROP TYPE IF EXISTS "TicketStatus";
DROP TYPE IF EXISTS "TicketPriority";
DROP TYPE IF EXISTS "SubscriptionTier";
DROP TYPE IF EXISTS "StopType";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "PaymentMethodType";
DROP TYPE IF EXISTS "VerificationStatus";
DROP TYPE IF EXISTS "SosStatus";
DROP TYPE IF EXISTS "DelayParty";
DROP TYPE IF EXISTS "AuditAction";
DROP TYPE IF EXISTS "DocumentDecision";
DROP TYPE IF EXISTS "DeletionStatus";
DROP TYPE IF EXISTS "RouteStatus";
DROP TYPE IF EXISTS "PickupType";
DROP TYPE IF EXISTS "PickupStatus";
