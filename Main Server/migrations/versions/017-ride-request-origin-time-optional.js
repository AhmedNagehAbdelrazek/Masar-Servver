'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "origin_time" on table "ride_requests" (allow null)
 *
 * The ride-request API contract treats origin_time as optional
 * (expiry falls back to created_at + TTL), so the column must allow null.
 **/

var info = {
    "revision": 17,
    "name": "ride-request-origin-time-optional",
    "created": "2026-08-22T00:00:00.000Z",
    "comment": "Make ride_requests.origin_time nullable to match the optional API field"
};

var migrationCommands = [
    {
        fn: "changeColumn",
        params: [
            "ride_requests",
            "origin_time",
            {
                "type": Sequelize.DATE,
                "field": "origin_time",
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
    info: info
};
