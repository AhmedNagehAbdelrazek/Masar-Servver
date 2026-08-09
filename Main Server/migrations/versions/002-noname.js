'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "trip_seats", deps: [trips]
 * addColumn "originArea" to table "trips"
 * addColumn "destinationArea" to table "trips"
 * addColumn "recurrenceDays" to table "trips"
 * addColumn "recurrenceEndDate" to table "trips"
 * addColumn "genderPreference" to table "trips"
 * addColumn "driverInstructions" to table "trips"
 * addColumn "additionalInstructions" to table "trips"
 * addColumn "stopName" to table "trip_stops"
 * addColumn "stopLat" to table "trip_stops"
 * addColumn "stopLng" to table "trip_stops"
 * changeColumn "originCity" on table "trips"
 * changeColumn "destinationCity" on table "trips"
 * changeColumn "status" on table "trips"
 * changeColumn "status" on table "trips"
 * changeColumn "city" on table "trip_stops"
 * changeColumn "stopType" on table "trip_stops"
 * addIndex "idx_trip_seats_trip" to table "trip_seats"
 * addIndex "idx_trip_seats_unique" to table "trip_seats"
 *
 **/

var info = {
    "revision": 2,
    "name": "noname",
    "created": "2026-07-27T21:53:47.265Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "trip_seats",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "tripId": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "allowNull": false
                },
                "seatNumber": {
                    "type": Sequelize.SMALLINT,
                    "field": "seat_number",
                    "allowNull": false
                },
                "seatType": {
                    "type": Sequelize.ENUM('driver', 'unavailable', 'available'),
                    "field": "seat_type",
                    "allowNull": false
                },
                "created_at": {
                    "type": Sequelize.DATE,
                    "field": "created_at",
                    "allowNull": false
                },
                "trip_id": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "trips",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "origin_area",
            {
                "type": Sequelize.STRING(120),
                "field": "origin_area",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "destination_area",
            {
                "type": Sequelize.STRING(120),
                "field": "destination_area",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "recurrence_days",
            {
                "type": Sequelize.ARRAY(Sequelize.SMALLINT),
                "field": "recurrence_days",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "recurrence_end_date",
            {
                "type": Sequelize.DATE,
                "field": "recurrence_end_date",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "gender_preference",
            {
                "type": Sequelize.ENUM('all', 'women_only', 'men_only'),
                "field": "gender_preference",
                "defaultValue": "all",
                "allowNull": false
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "driver_instructions",
            {
                "type": Sequelize.TEXT,
                "field": "driver_instructions",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "additional_instructions",
            {
                "type": Sequelize.TEXT,
                "field": "additional_instructions",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trip_stops",
            "stop_name",
            {
                "type": Sequelize.STRING(120),
                "field": "stop_name",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trip_stops",
            "stop_lat",
            {
                "type": Sequelize.DECIMAL(10, 8),
                "field": "stop_lat",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trip_stops",
            "stop_lng",
            {
                "type": Sequelize.DECIMAL(11, 8),
                "field": "stop_lng",
                "allowNull": true
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trips",
            "origin_city",
            {
                "type": Sequelize.STRING(100),
                "field": "origin_city",
                "allowNull": false
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trips",
            "destination_city",
            {
                "type": Sequelize.STRING(100),
                "field": "destination_city",
                "allowNull": false
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trips",
            "status",
            {
                "type": Sequelize.ENUM('published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled'),
                "field": "status",
                "defaultValue": "published",
                "allowNull": false
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trips",
            "status",
            {
                "type": Sequelize.ENUM( 'published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled'),
                "field": "status",
                "defaultValue": "published",
                "allowNull": false
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trip_stops",
            "city",
            {
                "type": Sequelize.STRING(80),
                "field": "city",
                "allowNull": true
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trip_stops",
            "stop_type",
            {
                "type": Sequelize.ENUM('pickup', 'dropoff', 'both'),
                "field": "stop_type",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "trip_seats",
            ["trip_id"],
            {
                "indexName": "idx_trip_seats_trip"
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "trip_seats",
            ["trip_id", "seat_number"],
            {
                "indexName": "idx_trip_seats_unique",
                "indicesType": "UNIQUE"
            }
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
