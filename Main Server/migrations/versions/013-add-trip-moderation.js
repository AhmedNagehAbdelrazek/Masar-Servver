'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "is_moderated" on table "trips"
 * addColumn "moderation_reason" on table "trips"
 * addColumn "moderated_by" on table "trips"
 *
 * The trips table in production was created before the migration system and
 * never received the moderation columns the Trip model expects.
 **/

var info = {
    "revision": 13,
    "name": "add-trip-moderation",
    "created": "2026-08-11T00:00:00.000Z",
    "comment": "Add moderation columns to trips"
};

function migrationSteps(queryInterface) {
  return [
    function () {
      return queryInterface.addColumn('trips', 'is_moderated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    },
    function () {
      return queryInterface.addColumn('trips', 'moderation_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    },
    function () {
      return queryInterface.addColumn('trips', 'moderated_by', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    },
  ];
}

var migrationCommands = [
  { fn: 'addColumn', params: ['trips', 'is_moderated', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }] },
  { fn: 'addColumn', params: ['trips', 'moderation_reason', { type: Sequelize.TEXT, allowNull: true }] },
  { fn: 'addColumn', params: ['trips', 'moderated_by', { type: Sequelize.UUID, allowNull: true }] }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface, Sequelize) {
        var steps = migrationSteps(queryInterface);
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < steps.length) {
                    console.log('[#' + index + '] execute migration step');
                    index++;
                    Promise.resolve(steps[index - 1]()).then(next, reject);
                } else {
                    resolve();
                }
            }
            next();
        });
    },
    info: info
};
