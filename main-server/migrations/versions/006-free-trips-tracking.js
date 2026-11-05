'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "free_trips_used" on table "driver_subscriptions"
 *
 **/

var info = {
    "revision": 6,
    "name": "free-trips-tracking",
    "created": "2026-08-03T00:00:00.000Z",
    "comment": "Track free trip usage per subscription"
};

function migrationSteps(queryInterface) {
  return [
    function () {
      return queryInterface.addColumn('driver_subscriptions', 'free_trips_used', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    },
  ];
}

var migrationCommands = [
  { fn: 'addColumn', params: ['driver_subscriptions', 'free_trips_used', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }] }
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
