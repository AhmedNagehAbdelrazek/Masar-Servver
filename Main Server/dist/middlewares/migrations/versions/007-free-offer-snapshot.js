'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "free_offer" on table "driver_subscriptions"
 *
 **/
var info = {
    "revision": 7,
    "name": "free-offer-snapshot",
    "created": "2026-08-03T00:00:00.000Z",
    "comment": "Snapshot free_offer on subscription at signup so admin plan changes don't affect existing drivers"
};
function migrationSteps(queryInterface) {
    return [
        function () {
            return queryInterface.addColumn('driver_subscriptions', 'free_offer', {
                type: Sequelize.JSONB,
                allowNull: true,
            });
        },
    ];
}
var migrationCommands = [
    { fn: 'addColumn', params: ['driver_subscriptions', 'free_offer', { type: Sequelize.JSONB, allowNull: true }] }
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
                }
                else {
                    resolve();
                }
            }
            next();
        });
    },
    info: info
};
//# sourceMappingURL=007-free-offer-snapshot.js.map