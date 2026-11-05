'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeIndex "vehicles_code_number_key" on table "vehicles"
 *
 * code_number is a free-text plate code — it may repeat across vehicles, so
 * the unique constraint is removed. Plate number stays unique.
 **/

var info = {
    "revision": 12,
    "name": "code-number-not-unique",
    "created": "2026-08-09T00:00:00.000Z",
    "comment": "Drop unique constraint on vehicles.code_number"
};

var migrationCommands = [{
    fn: "rawQuery",
    params: ['ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "vehicles_code_number_key"']
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
