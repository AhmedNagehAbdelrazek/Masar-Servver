'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * createTable "document_reviews"
 *
 * Spec 011 admin dashboard API (part 1): per-document verification decisions
 * made by administrators from the driver dossier documents tab. One row per
 * (driver, document key) — upsert semantics implement "last confirmed action
 * wins". Records attribution (decided_by / decided_at) and an optional reason.
 **/
var info = {
    "revision": 20,
    "name": "admin-dashboard",
    "created": "2026-08-25T00:00:00.000Z",
    "comment": "document_reviews table for per-document approve/reject decisions in the admin dashboard"
};
var migrationCommands = [
    {
        fn: "createTable",
        params: [
            "document_reviews",
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
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "document_key": {
                    "type": Sequelize.STRING(40),
                    "field": "document_key",
                    "allowNull": false
                },
                "decision": {
                    "type": Sequelize.ENUM("approved", "rejected"),
                    "field": "decision",
                    "allowNull": false
                },
                "reason": {
                    "type": Sequelize.TEXT,
                    "field": "reason",
                    "allowNull": true
                },
                "decided_by": {
                    "type": Sequelize.UUID,
                    "field": "decided_by",
                    "allowNull": true,
                    "onUpdate": "SET NULL",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "decided_at": {
                    "type": Sequelize.DATE,
                    "field": "decided_at",
                    "allowNull": false,
                    "defaultValue": Sequelize.NOW
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
                "uniqueKeys": {
                    "uq_document_reviews_driver_key": {
                        "fields": ["driver_id", "document_key"]
                    }
                },
                "indexes": [
                    {
                        "name": "idx_document_reviews_driver",
                        "fields": ["driver_id"]
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
    down: function (queryInterface) {
        return queryInterface.dropTable("document_reviews");
    },
    info: info
};
//# sourceMappingURL=020-admin-dashboard.js.map