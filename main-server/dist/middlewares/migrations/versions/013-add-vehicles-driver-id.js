'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "driver_id" on table "vehicles"
 * delete rows with no driver (orphaned test rows)
 * set column NOT NULL
 * add UNIQUE constraint "vehicles_driver_id_key" on "vehicles" ("driver_id")
 * add FK "vehicles_driver_id_fkey" on "vehicles" ("driver_id") → "users" ("id")
 *
 * The vehicles table was created before driver_id existed in the model, so the
 * column is missing in existing databases. This migration adds it to match the
 * Vehicle model (UUID, allowNull false, unique) and enforces one-vehicle-per-driver
 * at the DB level. Existing rows without a driver are test/orphan data and are removed.
 **/
var info = {
    "revision": 13,
    "name": "add-vehicles-driver-id",
    "created": "2026-08-12T00:00:00.000Z",
    "comment": "Add missing vehicles.driver_id column (FK to users, unique, not null)"
};
var migrationCommands = [{
        fn: "addColumn",
        params: [
            "vehicles",
            "driver_id",
            {
                "type": Sequelize.UUID,
                "field": "driver_id",
                "allowNull": true
            }
        ]
    }, {
        fn: "rawQuery",
        params: ['DELETE FROM "vehicles" WHERE "driver_id" IS NULL']
    }, {
        fn: "rawQuery",
        params: ['ALTER TABLE "vehicles" ALTER COLUMN "driver_id" SET NOT NULL']
    }, {
        fn: "rawQuery",
        params: ['ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_key" UNIQUE ("driver_id")']
    }, {
        fn: "rawQuery",
        params: ['ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL']
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
//# sourceMappingURL=013-add-vehicles-driver-id.js.map