'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "route_polyline" to table "trips"
 * addColumn "route_distance_m" to table "trips"
 * addColumn "route_duration_s" to table "trips"
 * addColumn "route_status" to table "trips"
 * addColumn "route_computed_at" to table "trips"
 * addColumn "route_version" to table "trips"
 **/

var info = {
    "revision": 28,
    "name": "trip-route",
    "created": "2026-10-02T00:00:00.000Z",
    "comment": "spec 013 DB1: planned route storage on trips"
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "trips",
        "route_polyline",
        { "type": Sequelize.TEXT, allowNull: true }
    ]
},
    {
        fn: "addColumn",
        params: [
            "trips",
            "route_distance_m",
            { "type": Sequelize.INTEGER, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "route_duration_s",
            { "type": Sequelize.INTEGER, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "route_status",
            { "type": Sequelize.ENUM('pending', 'ready', 'failed'), allowNull: false, defaultValue: 'pending' }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "route_computed_at",
            { "type": Sequelize.DATE, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "route_version",
            { "type": Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'UPDATE "trips" SET "route_status" = \'pending\', "route_version" = 0 WHERE "route_status" IS NULL OR "route_version" IS NULL'
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
