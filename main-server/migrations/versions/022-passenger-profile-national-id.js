'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "national_id" to table "passenger_profiles"
 *
 * Spec 012: the passenger profile endpoint returns personal data; the
 * passenger's national id is stored on the passenger_profiles table.
 **/

var info = {
    "revision": 22,
    "name": "passenger-profile-national-id",
    "created": "2026-09-01T00:00:00.000Z",
    "comment": "passenger_profiles.national_id column"
};

var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "passenger_profiles",
            "national_id",
            {
                "type": Sequelize.STRING(30),
                "field": "national_id",
                "allowNull": true
            }
        ]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface, Sequelize) {
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    let command = migrationCommands[index];
                    console.log("[#" + index + "] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    down: function (queryInterface) {
        return queryInterface.removeColumn("passenger_profiles", "national_id");
    },
    info: info
};