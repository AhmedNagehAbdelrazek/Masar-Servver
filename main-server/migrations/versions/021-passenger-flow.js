'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "punctuality_rate" to table "driver_profiles"
 * addColumn "professional_driver" to table "driver_profiles"
 * createTable "recent_search"
 *
 * Spec 012 passenger flow completion: materialized driver stats (computed
 * once at write time and persisted) plus a persistent per-passenger search
 * history used to power the passenger home "last searched trips" section.
 **/

var info = {
    "revision": 21,
    "name": "passenger-flow",
    "created": "2026-09-01T00:00:00.000Z",
    "comment": "driver_profiles stats columns + recent_search table"
};

var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "driver_profiles",
            "punctuality_rate",
            {
                "type": Sequelize.NUMERIC(5, 2),
                "field": "punctuality_rate",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "driver_profiles",
            "professional_driver",
            {
                "type": Sequelize.BOOLEAN,
                "field": "professional_driver",
                "allowNull": false,
                "defaultValue": false
            }
        ]
    },
    {
        fn: "createTable",
        params: [
            "recent_search",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "passenger_id": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "allowNull": false,
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "users",
                        "key": "id"
                    }
                },
                "origin_city": {
                    "type": Sequelize.STRING(100),
                    "field": "origin_city",
                    "allowNull": false
                },
                "destination_city": {
                    "type": Sequelize.STRING(100),
                    "field": "destination_city",
                    "allowNull": false
                },
                "searched_on": {
                    "type": Sequelize.DATEONLY,
                    "field": "searched_on",
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
                "uniqueKeys": {
                    "uq_recent_search_passenger_route": {
                        "fields": ["passenger_id", "origin_city", "destination_city"]
                    }
                },
                "indexes": [
                    {
                        "name": "idx_recent_search_passenger_searched_on",
                        "fields": ["passenger_id", "searched_on"]
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
        return queryInterface.dropTable("recent_search");
    },
    info: info
};
