'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "occurrence_date" to table "trip_locations"
 * addIndex on trip_locations(trip_id, createdat) is pre-existing (idx_trip_locations_trip_created);
 * this adds a per-occurrence lookup index.
 **/

var info = {
    "revision": 31,
    "name": "trip-location-occurrence",
    "created": "2026-10-02T00:00:00.000Z",
    "comment": "spec 013 DB4: occurrence_date so recurring-trip occurrences never overwrite paths"
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "trip_locations",
        "occurrence_date",
        { "type": Sequelize.DATEONLY, allowNull: true }
    ]
},
    {
        fn: "addIndex",
        params: [
            "trip_locations",
            ["trip_id", "occurrence_date"],
            { "name": "idx_trip_locations_trip_occurrence" }
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
