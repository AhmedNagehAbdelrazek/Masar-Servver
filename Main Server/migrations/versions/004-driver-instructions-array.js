'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "driver_instructions" on table "trips" (TEXT → TEXT[])
 *
 * NOTE: rewritten to emit a USING cast — plain `ALTER COLUMN ... TYPE TEXT[]`
 * fails with 42804 because there is no implicit cast from text to text[].
 **/

var info = {
    "revision": 4,
    "name": "driver-instructions-array",
    "created": "2026-07-28T00:00:00.000Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "rawQuery",
    params: [`
        ALTER TABLE "trips"
        ALTER COLUMN "driver_instructions" TYPE TEXT[]
        USING (CASE
            WHEN "driver_instructions" IS NULL THEN NULL
            WHEN pg_typeof("driver_instructions")::text = 'text[]' THEN "driver_instructions"
            ELSE ARRAY["driver_instructions"]::text[]
        END)
    `]
}];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function(queryInterface)
    {
        // Wrap a legacy single text value into a one-element array; NULL stays NULL.
        return queryInterface.sequelize.query(migrationCommands[0].params[0]);
    },
    info: info
};
