'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "deletion_requests"
 * addColumn "display_name" on table "users"
 *
 * Spec 010 driver profile & settings pages: reviewed account-deletion
 * requests (cooling-off lifecycle with self-cancel) and a display name
 * field editable regardless of verification status.
 **/

var info = {
    "revision": 18,
    "name": "driver-profile-settings",
    "created": "2026-08-22T00:00:00.000Z",
    "comment": "Deletion_requests review table + users.display_name for driver profile/settings screens"
};

var migrationCommands = [
    {
        fn: "createTable",
        params: [
            "deletion_requests",
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
                "reason": {
                    "type": Sequelize.TEXT,
                    "field": "reason",
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM("pending", "approved", "rejected", "cancelled"),
                    "field": "status",
                    "allowNull": false,
                    "defaultValue": "pending"
                },
                "estimated_completion": {
                    "type": Sequelize.DATE,
                    "field": "estimated_completion",
                    "allowNull": true
                },
                "review_notes": {
                    "type": Sequelize.TEXT,
                    "field": "review_notes",
                    "allowNull": true
                },
                "reviewed_by": {
                    "type": Sequelize.UUID,
                    "field": "reviewed_by",
                    "allowNull": true,
                    "onUpdate": "SET NULL",
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
                        "name": "idx_deletion_requests_user",
                        "fields": ["user_id"]
                    },
                    {
                        "name": "idx_deletion_requests_status",
                        "fields": ["status"]
                    }
                ]
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "users",
            "display_name",
            {
                "type": Sequelize.STRING(120),
                "field": "display_name",
                "allowNull": true
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
