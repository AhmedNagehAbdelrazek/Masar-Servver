ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_polyline" TEXT;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_distance_m" INTEGER;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_duration_s" INTEGER;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_waypoint_hash" VARCHAR(64);
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_computed_at" TIMESTAMPTZ;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_source" VARCHAR(20);
