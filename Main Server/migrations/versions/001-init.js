'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "users", deps: []
 * createTable "uploaded_images", deps: []
 * createTable "vehicles", deps: []
 * createTable "driver_profiles", deps: []
 * createTable "passenger_profiles", deps: []
 * createTable "trips", deps: []
 * createTable "trip_attributes", deps: []
 * createTable "trip_stops", deps: []
 * createTable "bookings", deps: []
 * createTable "ride_requests", deps: []
 * createTable "request_offers", deps: []
 * createTable "ratings", deps: []
 * createTable "delay_events", deps: []
 * createTable "complaints", deps: []
 * createTable "penalties", deps: []
 * createTable "support_tickets", deps: []
 * createTable "notifications", deps: []
 * createTable "favorite_drivers", deps: []
 * createTable "favorite_routes", deps: []
 * createTable "audit_logs", deps: []
 * createTable "subscription_transactions", deps: []
 * addIndex "trip_attributes_trip_id_attr_key" to table "trip_attributes"
 * addIndex "favorite_drivers_passenger_id_driver_id" to table "favorite_drivers"
 * addIndex "favorite_routes_passenger_id_origin_city_destination_city" to table "favorite_routes"
 *
 **/

var info = {
    "revision": 1,
    "name": "init",
    "created": "2026-07-27T15:11:59.511Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "users",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "uploaded_images",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "vehicles",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "driver_profiles",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "passenger_profiles",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "trips",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "trip_attributes",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "trip_stops",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "bookings",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "ride_requests",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "request_offers",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "ratings",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "delay_events",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "complaints",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "penalties",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "support_tickets",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "notifications",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "favorite_drivers",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "favorite_routes",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "audit_logs",
            {

            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "subscription_transactions",
            {

            },
            {}
        ]
    },
    {
        fn: "addIndex",
        params: [
            "trip_attributes",
            ["trip_id", "attr_key"],
            {
                "indexName": "trip_attributes_trip_id_attr_key",
                "indicesType": "UNIQUE"
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "favorite_drivers",
            ["passenger_id", "driver_id"],
            {
                "indexName": "favorite_drivers_passenger_id_driver_id",
                "indicesType": "UNIQUE"
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "favorite_routes",
            ["passenger_id", "origin_city", "destination_city"],
            {
                "indexName": "favorite_routes_passenger_id_origin_city_destination_city",
                "indicesType": "UNIQUE"
            }
        ]
    }
];

module.exports = {
    pos: 0,
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
