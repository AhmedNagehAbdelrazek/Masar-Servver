'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "details" on table "penalties"
 * addColumn "completed_at" on table "bookings"
 * addColumn "agreed_fare" on table "request_offers"
 * addColumn "booking_id" on table "request_offers"
 * addColumn "reference_code" on table "support_tickets"
 * addColumn "booking_id" on table "support_tickets"
 * addColumn "trip_id" on table "support_tickets"
 * createTable "support_ticket_messages"
 *
 * Spec 009 closes seeder-identified flow gaps: penalty detail storage,
 * booking completion timestamps, ride-request offer price agreement and
 * booking linkage, and a full support-ticket system with messages.
 **/

var info = {
    "revision": 16,
    "name": "fix-seeder-gaps",
    "created": "2026-08-22T00:00:00.000Z",
    "comment": "Penalty details, booking completed_at, offer agreed_fare/booking link, support tickets reference codes + messages table"
};

var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "penalties",
            "details",
            {
                "type": Sequelize.TEXT,
                "field": "details",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "completed_at",
            {
                "type": Sequelize.DATE,
                "field": "completed_at",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "request_offers",
            "agreed_fare",
            {
                "type": Sequelize.DECIMAL(10, 2),
                "field": "agreed_fare",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "request_offers",
            "booking_id",
            {
                "type": Sequelize.UUID,
                "field": "booking_id",
                "allowNull": true,
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "bookings",
                    "key": "id"
                }
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "support_tickets",
            "reference_code",
            {
                "type": Sequelize.STRING(12),
                "field": "reference_code",
                "allowNull": true,
                "unique": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "support_tickets",
            "booking_id",
            {
                "type": Sequelize.UUID,
                "field": "booking_id",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "support_tickets",
            "trip_id",
            {
                "type": Sequelize.UUID,
                "field": "trip_id",
                "allowNull": true
            }
        ]
    },
    {
        fn: "createTable",
        params: [
            "support_ticket_messages",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "ticket_id": {
                    "type": Sequelize.UUID,
                    "field": "ticket_id",
                    "allowNull": false,
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "support_tickets",
                        "key": "id"
                    }
                },
                "sender_id": {
                    "type": Sequelize.UUID,
                    "field": "sender_id",
                    "allowNull": false,
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "message": {
                    "type": Sequelize.TEXT,
                    "field": "message",
                    "allowNull": false
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                }
            },
            {
                "indexes": [
                    {
                        "name": "idx_support_ticket_messages_ticket",
                        "fields": ["ticket_id"]
                    }
                ]
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
