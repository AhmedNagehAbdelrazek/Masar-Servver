'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "seatNumbers" to table "bookings"
 *
 **/
var info = {
    "revision": 26,
    "name": "booking-seat-numbers",
    "created": "2026-09-09T09:19:05.304Z",
    "comment": ""
};
var migrationCommands = [{
        fn: "addColumn",
        params: [
            "bookings",
            "seat_numbers",
            {
                "type": Sequelize.ARRAY(Sequelize.SMALLINT),
                "allowNull": true,
                "field": "seat_numbers"
            }
        ]
    },
    {
        fn: "rawQuery",
        params: [
            'UPDATE "bookings" SET "seat_numbers" = ARRAY["seat_number"] WHERE "seat_number" IS NOT NULL AND "seat_numbers" IS NULL'
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
//# sourceMappingURL=026-booking-seat-numbers.js.map