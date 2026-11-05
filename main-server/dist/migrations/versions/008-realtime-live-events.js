'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addIndex "notifications(user_id, is_read)"
 * addIndex "support_tickets(assigned_to, status)"
 * addIndex "bookings(trip_id, passenger_id, status)"
 *
 * Supporting indexes for the realtime live events feature (spec 005):
 * notification read-state queries, support-ticket assignment queries and
 * trip-chat membership lookups. New tables (messages, sos_events,
 * trip_locations) are created by Sequelize sync from their models, which also
 * owns their indexes.
 */
var info = {
    "revision": 8,
    "name": "realtime-live-events",
    "created": "2026-08-04T00:00:00.000Z",
    "comment": "Supporting indexes for realtime live events (chat, notifications, SOS, tracking)"
};
function migrationSteps(queryInterface) {
    return [
        function () {
            return queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
                name: 'idx_notifications_user_read',
            });
        },
        function () {
            return queryInterface.addIndex('support_tickets', ['assigned_to', 'status'], {
                name: 'idx_support_tickets_assignee_status',
            });
        },
        function () {
            return queryInterface.addIndex('bookings', ['trip_id', 'passenger_id', 'status'], {
                name: 'idx_bookings_trip_passenger_status',
            });
        },
    ];
}
var migrationCommands = [
    { fn: 'addIndex', params: ['notifications', ['user_id', 'is_read'], { name: 'idx_notifications_user_read' }] },
    { fn: 'addIndex', params: ['support_tickets', ['assigned_to', 'status'], { name: 'idx_support_tickets_assignee_status' }] },
    { fn: 'addIndex', params: ['bookings', ['trip_id', 'passenger_id', 'status'], { name: 'idx_bookings_trip_passenger_status' }] },
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
//# sourceMappingURL=008-realtime-live-events.js.map