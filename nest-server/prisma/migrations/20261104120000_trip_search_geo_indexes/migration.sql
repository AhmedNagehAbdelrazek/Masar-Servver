-- Proximity trip search (spec 013 P1): candidate prefilter + date/status scan.
-- These are btree helper indexes, not a replacement for PostGIS. The exact
-- distance/ordering checks run in the application (trip-search.matcher.ts).
CREATE INDEX IF NOT EXISTS "idx_trips_status_departure" ON "trips"("status", "departure_time");
CREATE INDEX IF NOT EXISTS "idx_trips_origin_geo" ON "trips"("origin_lat", "origin_lng");
CREATE INDEX IF NOT EXISTS "idx_trips_destination_geo" ON "trips"("destination_lat", "destination_lng");
CREATE INDEX IF NOT EXISTS "idx_trip_stops_geo" ON "trip_stops"("lat", "lng");
