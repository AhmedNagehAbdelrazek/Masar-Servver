'use strict';

var Sequelize = require('sequelize');

var info = {
    "revision": 24,
    "name": "fix-recent-search-updatedat",
    "created": "2026-09-04T00:00:00.000Z",
    "comment": "Fix recent_search: remove spurious updatedat column (model has updatedAt:false, migration 021 incorrectly created it NOT NULL)"
};

var migrationCommands = [
    {
        fn: "rawQuery",
        params: ['ALTER TABLE "recent_search" DROP COLUMN IF EXISTS "updatedat"']
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
                } else resolve();
            }
            next();
        });
    },
    info: info
};
