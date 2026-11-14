'use strict';

/**
 * Trip activity history for the admin journey page.
 *
 * One row per meaningful trip/booking event: trip created, status changes,
 * passenger booked, pickup/onboard/drop-off, cancellation, etc. The dashboard
 * reads this table to show a chronological decision trail.
 *
 * The migration also backfills the events that can be reconstructed from the
 * existing trip/booking timestamps, so old trips are not blank.
 */

var info = {
    revision: 37,
    name: 'trip-events',
    created: '2026-11-14T00:00:00.000Z',
    comment: 'add trip_events history table and backfill existing trip/booking activity',
};

var migrationCommands = [
    {
        fn: 'rawQuery',
        params: [
            `CREATE TABLE IF NOT EXISTS "trip_events" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "trip_id" UUID NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
                "booking_id" UUID NULL REFERENCES "bookings"("id") ON DELETE SET NULL,
                "passenger_id" UUID NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "event_type" VARCHAR(50) NOT NULL,
                "from_status" VARCHAR(30) NULL,
                "to_status" VARCHAR(30) NULL,
                "actor_id" UUID NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "actor_role" VARCHAR(20) NULL,
                "details" JSONB NULL DEFAULT '{}'::jsonb,
                "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "createdat" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updatedat" TIMESTAMPTZ NOT NULL DEFAULT now()
            )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            'CREATE INDEX IF NOT EXISTS "idx_trip_events_trip_time" ON "trip_events" ("trip_id", "occurred_at")',
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            'CREATE INDEX IF NOT EXISTS "idx_trip_events_booking" ON "trip_events" ("booking_id")',
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            'CREATE INDEX IF NOT EXISTS "idx_trip_events_passenger" ON "trip_events" ("passenger_id")',
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            'CREATE INDEX IF NOT EXISTS "idx_trip_events_type" ON "trip_events" ("event_type")',
        ],
    },
    // ----- Backfill: trip lifecycle -----
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "event_type", "to_status", "actor_role", "details", "occurred_at")
             SELECT t."id", 'trip.created', 'published', 'system',
                    jsonb_build_object(
                      'origin', t."origin_city",
                      'destination', t."destination_city",
                      'departure_time', t."departure_time",
                      'total_seats', t."total_seats",
                      'seat_price', t."fare_per_seat",
                      'backfilled', true
                    ),
                    t."createdat"
             FROM "trips" t
             WHERE NOT EXISTS (
               SELECT 1 FROM "trip_events" e
               WHERE e."trip_id" = t."id" AND e."event_type" = 'trip.created'
             )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "event_type", "from_status", "to_status", "actor_role", "details", "occurred_at")
             SELECT t."id", 'trip.started', 'published', 'in_progress', 'system',
                    jsonb_build_object('backfilled', true),
                    t."started_at"
             FROM "trips" t
             WHERE t."started_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."trip_id" = t."id" AND e."event_type" = 'trip.started'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "event_type", "from_status", "to_status", "actor_role", "details", "occurred_at")
             SELECT t."id", 'trip.completed', 'in_progress', 'completed', 'system',
                    jsonb_build_object('backfilled', true),
                    t."completed_at"
             FROM "trips" t
             WHERE t."completed_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."trip_id" = t."id" AND e."event_type" = 'trip.completed'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "event_type", "from_status", "to_status", "actor_role", "details", "occurred_at")
             SELECT t."id", 'trip.abandoned', 'in_progress', 'abandoned', 'system',
                    jsonb_build_object('reason', t."abandon_reason", 'backfilled', true),
                    t."abandoned_at"
             FROM "trips" t
             WHERE t."abandoned_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."trip_id" = t."id" AND e."event_type" = 'trip.abandoned'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "event_type", "to_status", "actor_role", "details", "occurred_at")
             SELECT t."id", 'trip.cancelled', 'cancelled', 'system',
                    jsonb_build_object('backfilled', true),
                    COALESCE(t."updatedat", t."createdat")
             FROM "trips" t
             WHERE t."status" = 'cancelled'
               AND t."completed_at" IS NULL
               AND t."abandoned_at" IS NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."trip_id" = t."id" AND e."event_type" = 'trip.cancelled'
               )`,
        ],
    },
    // ----- Backfill: booking lifecycle -----
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "to_status", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.created', b."status", 'system',
                    jsonb_build_object(
                      'booking_no', b."reference_code",
                      'seats', b."seats_booked",
                      'seat_numbers', b."seat_numbers",
                      'fare', b."agreed_fare",
                      'pickup', COALESCE(b."pickup_label", b."pickup_place"),
                      'dropoff', b."dropoff_place",
                      'backfilled', true
                    ),
                    b."createdat"
             FROM "bookings" b
             WHERE NOT EXISTS (
               SELECT 1 FROM "trip_events" e
               WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.created'
             )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "to_status", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.cancelled', 'cancelled', 'system',
                    jsonb_build_object('reason', b."cancellation_reason", 'backfilled', true),
                    b."cancelled_at"
             FROM "bookings" b
             WHERE b."cancelled_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.cancelled'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.pickup_arrived', 'system',
                    jsonb_build_object('backfilled', true),
                    b."arrived_at"
             FROM "bookings" b
             WHERE b."arrived_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.pickup_arrived'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.picked_up', 'system',
                    jsonb_build_object('backfilled', true),
                    b."picked_up_at"
             FROM "bookings" b
             WHERE b."picked_up_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.picked_up'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.pickup_missed', 'system',
                    jsonb_build_object('backfilled', true),
                    COALESCE(b."updatedat", b."createdat")
             FROM "bookings" b
             WHERE b."pickup_status" = 'missed'
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.pickup_missed'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.passenger_boarded', 'passenger',
                    jsonb_build_object('backfilled', true),
                    b."passenger_started_at"
             FROM "bookings" b
             WHERE b."passenger_started_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.passenger_boarded'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "to_status", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.passenger_left', 'completed', 'passenger',
                    jsonb_build_object('backfilled', true),
                    b."passenger_ended_at"
             FROM "bookings" b
             WHERE b."passenger_ended_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.passenger_left'
               )`,
        ],
    },
    {
        fn: 'rawQuery',
        params: [
            `INSERT INTO "trip_events" ("trip_id", "booking_id", "passenger_id", "event_type", "actor_role", "details", "occurred_at")
             SELECT b."trip_id", b."id", b."passenger_id", 'booking.driver_confirmed', 'driver',
                    jsonb_build_object('was_on_trip', b."driver_confirmed_on_trip", 'backfilled', true),
                    b."driver_confirmed_at"
             FROM "bookings" b
             WHERE b."driver_confirmed_at" IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM "trip_events" e
                 WHERE e."booking_id" = b."id" AND e."event_type" = 'booking.driver_confirmed'
               )`,
        ],
    },
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface) {
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    const command = migrationCommands[index];
                    console.log('[# ' + index + '] execute: ' + command.fn);
                    index += 1;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                } else {
                    resolve();
                }
            }
            next();
        });
    },
    down: function (queryInterface) {
        return queryInterface.rawQuery('DROP TABLE IF EXISTS "trip_events" CASCADE');
    },
    info: info,
};
