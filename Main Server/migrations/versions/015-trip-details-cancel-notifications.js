'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "penalty_type" on table "penalties"
 * addColumn "severity" on table "penalties"
 * addColumn "trip_id" on table "penalties"
 * createTable "notification_settings"
 *
 * Spec 008 adds trip cancellation penalties with escalation and user
 * notification preferences. This migration extends the penalties table
 * with penalty_type, severity, and trip_id columns, and creates the
 * notification_settings table for per-user, per-type notification control.
 **/

var PENALTY_TYPE_ENUM = ['general', 'trip_cancellation', 'no_show', 'misconduct', 'fraud'];
var SEVERITY_ENUM = ['minor', 'moderate', 'major'];

var info = {
    "revision": 15,
    "name": "trip-details-cancel-notifications",
    "created": "2026-08-19T00:00:00.000Z",
    "comment": "Add penalty_type, severity, trip_id to penalties; create notification_settings table"
};

var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "penalties",
            "penalty_type",
            {
                "type": Sequelize.STRING(30),
                "field": "penalty_type",
                "allowNull": false,
                "defaultValue": "general"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "penalties",
            "severity",
            {
                "type": Sequelize.STRING(15),
                "field": "severity",
                "allowNull": false,
                "defaultValue": "minor"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "penalties",
            "trip_id",
            {
                "type": Sequelize.UUID,
                "field": "trip_id",
                "allowNull": true,
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "trips",
                    "key": "id"
                }
            }
        ]
    },
    {
        fn: "createTable",
        params: [
            "notification_settings",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "user_id": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "allowNull": false,
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "notification_type": {
                    "type": Sequelize.STRING(30),
                    "field": "notification_type",
                    "allowNull": false
                },
                "enabled_in_app": {
                    "type": Sequelize.BOOLEAN,
                    "field": "enabled_in_app",
                    "allowNull": false,
                    "defaultValue": true
                },
                "enabled_push": {
                    "type": Sequelize.BOOLEAN,
                    "field": "enabled_push",
                    "allowNull": false,
                    "defaultValue": true
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
                        "name": "idx_notification_settings_user",
                        "fields": ["user_id"]
                    },
                    {
                        "name": "uniq_notification_settings_user_type",
                        "unique": true,
                        "fields": ["user_id", "notification_type"]
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
