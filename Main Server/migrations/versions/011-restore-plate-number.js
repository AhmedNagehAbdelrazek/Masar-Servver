'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "plate_number" on table "vehicles"
 *
 * Restores the vehicles.plate_number column that was removed by the
 * experimental migrations 009-test / 010-delete_plateNunber_test.
 * allowNull is left true so existing rows are never rejected on re-add.
 **/

var info = {
    "revision": 11,
    "name": "restore-plate-number",
    "created": "2026-08-09T00:00:00.000Z",
    "comment": "Restore vehicles.plate_number removed by experimental migrations"
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "vehicles",
        "plate_number",
        {
            "type": Sequelize.STRING(20),
            "field": "plate_number",
            "unique": true,
            "allowNull": true
        }
    ]
}];

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
