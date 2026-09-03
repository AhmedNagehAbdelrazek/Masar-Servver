'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "code_number" to table "vehicles"
 *
 **/
var info = {
    "revision": 8,
    "name": "add-code-number",
    "created": "2026-08-09T00:00:00.000Z",
    "comment": ""
};
var migrationCommands = [{
        fn: "addColumn",
        params: [
            "vehicles",
            "code_number",
            {
                "type": Sequelize.STRING(20),
                "field": "code_number",
                "allowNull": true
            }
        ]
    }];
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
//# sourceMappingURL=008-add-code-number.js.map