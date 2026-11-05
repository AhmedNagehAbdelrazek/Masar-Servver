'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "verification_status" on table "users"
 * addColumn "verification_submitted_at" on table "users"
 * addColumn "verification_rejected_at" on table "users"
 * addColumn "verification_rejection_reason" on table "users"
 * addColumn "verification_rejection_fields" on table "users"
 * addColumn "verification_rejected_at" on table "vehicles"
 * addColumn "verification_rejection_reason" on table "vehicles"
 * createTable "verification_status_changes"
 *
 * Spec 006 added driver verification fields to the User/Vehicle models, but no
 * migration ever shipped them — existing databases were patched by hand, so a
 * fresh deployment (e.g. the VPS) was left missing these columns and crashed at
 * boot (seedAdmin → User.findOrCreate). This migration brings the schema in line
 * with the models. All commands are idempotent for the redo runner.
 **/
var VERIFICATION_ENUM = ['unverified', 'pending', 'rejected', 'approved'];
var info = {
    "revision": 14,
    "name": "add-driver-verification-columns",
    "created": "2026-08-12T00:00:00.000Z",
    "comment": "Add driver verification status columns + verification_status_changes table"
};
var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "users",
            "verification_status",
            {
                "type": Sequelize.ENUM.apply(Sequelize, VERIFICATION_ENUM),
                "field": "verification_status",
                "allowNull": false,
                "defaultValue": "unverified"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "users",
            "verification_submitted_at",
            {
                "type": Sequelize.DATE,
                "field": "verification_submitted_at",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "users",
            "verification_rejected_at",
            {
                "type": Sequelize.DATE,
                "field": "verification_rejected_at",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "users",
            "verification_rejection_reason",
            {
                "type": Sequelize.TEXT,
                "field": "verification_rejection_reason",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "users",
            "verification_rejection_fields",
            {
                "type": Sequelize.JSONB,
                "field": "verification_rejection_fields",
                "allowNull": true,
                "defaultValue": []
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "vehicles",
            "verification_rejected_at",
            {
                "type": Sequelize.DATE,
                "field": "verification_rejected_at",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "vehicles",
            "verification_rejection_reason",
            {
                "type": Sequelize.TEXT,
                "field": "verification_rejection_reason",
                "allowNull": true
            }
        ]
    },
    {
        fn: "createTable",
        params: [
            "verification_status_changes",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "driver_id": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "allowNull": false,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "from_status": {
                    "type": Sequelize.ENUM.apply(Sequelize, VERIFICATION_ENUM),
                    "field": "from_status",
                    "allowNull": true
                },
                "to_status": {
                    "type": Sequelize.ENUM.apply(Sequelize, VERIFICATION_ENUM),
                    "field": "to_status",
                    "allowNull": false
                },
                "reason": {
                    "type": Sequelize.TEXT,
                    "field": "reason",
                    "allowNull": true
                },
                "marked_fields": {
                    "type": Sequelize.JSONB,
                    "field": "marked_fields",
                    "allowNull": true
                },
                "changed_by": {
                    "type": Sequelize.UUID,
                    "field": "changed_by",
                    "allowNull": true,
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                }
            },
            {}
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
//# sourceMappingURL=014-add-driver-verification-columns.js.map