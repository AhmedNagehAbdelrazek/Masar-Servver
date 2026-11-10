-- Passenger ride confirmation (shared Postgres DB).
-- IF NOT EXISTS keeps this idempotent with main-server migration 035.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "passenger_started_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "passenger_ended_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "driver_confirmed_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "driver_confirmed_on_trip" BOOLEAN;
CREATE INDEX IF NOT EXISTS "idx_bookings_trip_driver_confirmed" ON "bookings" ("trip_id", "driver_confirmed_at");
