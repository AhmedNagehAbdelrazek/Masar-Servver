'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "booking_id" on table "messages"
 * removeIndex "idx_messages_trip_created" on table "messages"
 * removeColumn "trip_id" on table "messages"
 * addIndex "idx_messages_booking_created" on table "messages"
 *
 * Booking chat concept: the driver<->passenger chat is scoped to a booking
 * (room `booking:{bookingId}`) instead of a trip. Legacy trip-scoped rows
 * cannot be mapped 1:1 onto bookings (a trip has many passengers), so they
 * are discarded together with the trip_id column.
 **/
var info = {
    "revision": 19,
    "name": "booking-chat",
    "created": "2026-08-23T00:00:00.000Z",
    "comment": "Booking-scoped driver/passenger chat: messages.booking_id replaces messages.trip_id"
};
var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "messages",
            "booking_id",
            {
                "type": Sequelize.UUID,
                "field": "booking_id",
                "allowNull": true
            }
        ]
    },
    {
        fn: "removeIndex",
        params: [
            "messages",
            "idx_messages_trip_created"
        ]
    },
    {
        fn: "removeColumn",
        params: [
            "messages",
            "trip_id"
        ]
    },
    {
        fn: "addIndex",
        params: [
            "messages",
            ["booking_id", "createdat"],
            {
                "indexName": "idx_messages_booking_created"
            }
        ]
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
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
//# sourceMappingURL=019-booking-chat.js.map