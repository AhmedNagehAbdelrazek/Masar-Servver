'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "driver_instructions" on table "trips" (TEXT → TEXT[])
 *
 **/

var info = {
    "revision": 4,
    "name": "driver-instructions-array",
    "created": "2026-07-28T00:00:00.000Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "changeColumn",
    params: [
        "trips",
        "driver_instructions",
        {
            "type": Sequelize.ARRAY(Sequelize.TEXT),
            "field": "driver_instructions",
            "allowNull": true
        }
    ]
}];

module.exports = {
    pos: 0,
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
