'use strict';

/**
 * Passenger ride confirmation:
 * - bookings.passenger_started_at: passenger confirmed they boarded
 * - bookings.passenger_ended_at: passenger confirmed they left
 * - bookings.driver_confirmed_at / driver_confirmed_on_trip: post-trip
 *   driver confirmation used by ratings and no-show complaints.
 *
 * Uses IF NOT EXISTS so it is safe whether the Nest/Prisma migration or this
 * migration runs first on the shared database.
 */

var info = {
    "revision": 35,
    "name": "passenger-ride-confirmation",
    "created": "2026-11-10T00:00:00.000Z",
    "comment": "passenger ride start/end confirmation and driver post-trip confirmation"
};

var migrationCommands = [
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "passenger_started_at" TIMESTAMPTZ'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "passenger_ended_at" TIMESTAMPTZ'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "driver_confirmed_at" TIMESTAMPTZ'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "driver_confirmed_on_trip" BOOLEAN'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'CREATE INDEX IF NOT EXISTS "idx_bookings_trip_driver_confirmed" ON "bookings" ("trip_id", "driver_confirmed_at")'
        ]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface) {
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    var command = migrationCommands[index];
                    console.log("[#" + index + "] execute: " + command.fn);
                    index++;
                    var run = command.fn === 'rawQuery'
                        ? queryInterface.sequelize.query(command.params[0])
                        : queryInterface[command.fn].apply(queryInterface, command.params);
                    run.then(next, reject);
                } else resolve();
            }
            next();
        });
    },
    info: info
};
