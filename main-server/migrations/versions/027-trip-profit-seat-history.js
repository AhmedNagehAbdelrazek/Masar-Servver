'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "wasAvailable" to table "trip_seats"
 * addColumn "totalProfit" to table "trips"
 *
 * was_available remembers whether the driver designated the seat as
 * bookable at trip creation, so a booked (unavailable) seat still reads
 * back as originally available. total_profit stores the full-occupancy
 * revenue of the trip (fare_per_seat x sellable seats).
 *
 **/

var info = {
    "revision": 27,
    "name": "trip-profit-seat-history",
    "created": "2026-09-13T00:00:00.000Z",
    "comment": "trip_seats.was_available + trips.total_profit with backfills"
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "trip_seats",
        "was_available",
        {
            "type": Sequelize.BOOLEAN,
            "field": "was_available",
            "allowNull": false,
            "defaultValue": false
        }
    ]
},
    {
        fn: "rawQuery",
        params: [
            'UPDATE "trip_seats" SET "was_available" = true WHERE "seat_type" = \'available\''
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'UPDATE "trip_seats" ts SET "was_available" = true FROM "bookings" b WHERE b."trip_id" = ts."trip_id" AND (ts."seat_number" = ANY(b."seat_numbers") OR ts."seat_number" = b."seat_number")'
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "total_profit",
            {
                "type": Sequelize.NUMERIC(12, 2),
                "field": "total_profit",
                "allowNull": false,
                "defaultValue": 0
            }
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'UPDATE "trips" t SET "total_profit" = t."fare_per_seat" * COALESCE((SELECT COUNT(*) FROM "trip_seats" ts WHERE ts."trip_id" = t."id" AND ts."was_available" = true), 0)'
        ]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
