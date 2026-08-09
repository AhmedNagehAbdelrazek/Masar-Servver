'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "status" on table "trips"
 * changeColumn "status" on table "trips"
 *
 **/

var info = {
    "revision": 3,
    "name": "update",
    "created": "2026-07-27T23:12:45.272Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "changeColumn",
        params: [
            "trips",
            "status",
            {
                "type": Sequelize.ENUM('published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled'),
                "field": "status",
                "defaultValue": "published",
                "allowNull": false
            }
        ]
    },
    {
        fn: "changeColumn",
        params: [
            "trips",
            "status",
            {
                "type": Sequelize.ENUM('published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled'),
                "field": "status",
                "defaultValue": "published",
                "allowNull": false
            }
        ]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
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
