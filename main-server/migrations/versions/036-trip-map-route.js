'use strict';

/**
 * Dashboard map route cache:
 * - map_route_polyline: road-following geometry through origin -> ordered
 *   stops/passenger pickups -> destination.
 * - map_route_waypoint_hash: hash of the ordered waypoints. When a stop,
 *   pickup, origin or destination changes, the hash changes and the next map
 *   request recomputes and persists a fresh route.
 *
 * Uses IF NOT EXISTS so it is safe whether the Nest/Prisma migration or this
 * migration runs first on the shared database.
 */

var info = {
    "revision": 36,
    "name": "trip-map-route",
    "created": "2026-11-12T00:00:00.000Z",
    "comment": "persist the dashboard trip map road route with waypoint-hash invalidation"
};

var migrationCommands = [
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_polyline" TEXT'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_distance_m" INTEGER'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_duration_s" INTEGER'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_waypoint_hash" VARCHAR(64)'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_computed_at" TIMESTAMPTZ'
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "map_route_source" VARCHAR(20)'
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
