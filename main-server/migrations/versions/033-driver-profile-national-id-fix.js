'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * Rename driver_profiles.national_i_d -> national_id.
 *
 * Root cause: DriverProfile uses underscored:true without an explicit
 * field mapping, so Sequelize auto-mapped nationalID to national_i_d,
 * while Prisma (nest-server/prisma/schema.prisma), docs/db_schema.sql and
 * the API convention all expect national_id. This broke
 * GET /api/v2/admin/subscriptions/pending with:
 *   The column `driver_profiles.national_id` does not exist
 **/

var info = {
    "revision": 33,
    "name": "driver-profile-national-id-fix",
    "created": "2026-10-16T00:00:00.000Z",
    "comment": "driver_profiles national_i_d -> national_id column rename"
};

var migrationCommands = [
    {
        fn: "rawQuery",
        params: [
            'DO $$ BEGIN ' +
            'IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = \'driver_profiles\' AND column_name = \'national_i_d\') ' +
            'AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = \'driver_profiles\' AND column_name = \'national_id\') THEN ' +
            'ALTER TABLE "driver_profiles" RENAME COLUMN "national_i_d" TO "national_id"; ' +
            'END IF; ' +
            'END $$'
        ]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface) {
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    let command = migrationCommands[index];
                    console.log("[#" + index + "] execute: " + command.fn);
                    index++;
                    // rawQuery goes straight to sequelize (see migrations/main/runner.ts)
                    queryInterface.sequelize.query.apply(queryInterface.sequelize, command.params).then(next, reject);
                } else resolve();
            }
            next();
        });
    },
    down: function (queryInterface) {
        return queryInterface.sequelize.query(
            'DO $$ BEGIN ' +
            'IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = \'driver_profiles\' AND column_name = \'national_id\') ' +
            'AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = \'driver_profiles\' AND column_name = \'national_i_d\') THEN ' +
            'ALTER TABLE "driver_profiles" RENAME COLUMN "national_id" TO "national_i_d"; ' +
            'END IF; ' +
            'END $$'
        );
    },
    info: info
};
