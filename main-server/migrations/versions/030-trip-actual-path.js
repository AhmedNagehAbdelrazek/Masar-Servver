'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "actual_path_polyline" to table "trips"
 * addColumn "actual_distance_m" to table "trips"
 * addColumn "actual_duration_s" to table "trips"
 * addColumn "started_at" to table "trips"
 * addColumn "completed_at" to table "trips"
 **/

var info = {
    "revision": 30,
    "name": "trip-actual-path",
    "created": "2026-10-02T00:00:00.000Z",
    "comment": "spec 013 DB3: recorded driven path on trips (started_at/completed_at were missing)"
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "trips",
        "actual_path_polyline",
        { "type": Sequelize.TEXT, allowNull: true }
    ]
},
    {
        fn: "addColumn",
        params: [
            "trips",
            "actual_distance_m",
            { "type": Sequelize.INTEGER, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "actual_duration_s",
            { "type": Sequelize.INTEGER, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "started_at",
            { "type": Sequelize.DATE, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "trips",
            "completed_at",
            { "type": Sequelize.DATE, allowNull: true }
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
