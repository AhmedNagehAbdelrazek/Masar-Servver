'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "home_address" to table "passenger_profiles"
 *
 * Spec 012: passenger registration collects the home address alongside the
 * national id when the passenger completes their profile after phone confirm.
 **/
var info = {
    "revision": 23,
    "name": "passenger-profile-home-address",
    "created": "2026-09-01T00:00:00.000Z",
    "comment": "passenger_profiles.home_address column"
};
var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "passenger_profiles",
            "home_address",
            {
                "type": Sequelize.STRING(255),
                "field": "home_address",
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
        return queryInterface.removeColumn("passenger_profiles", "home_address");
    },
    info: info
};
//# sourceMappingURL=023-passenger-profile-home-address.js.map