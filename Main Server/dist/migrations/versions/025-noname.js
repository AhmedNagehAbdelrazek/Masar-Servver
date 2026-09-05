'use strict';
var Sequelize = require('sequelize');
/**
 * Actions summary:
 *
 * addColumn "pickupPlace" to table "bookings"
 * addColumn "pickupLat" to table "bookings"
 * addColumn "pickupLng" to table "bookings"
 * addColumn "pickupOrder" to table "bookings"
 * addColumn "dropoffLat" to table "bookings"
 * addColumn "dropoffLng" to table "bookings"
 * addColumn "note" to table "ride_requests"
 *
 **/
var info = {
    "revision": 25,
    "name": "noname",
    "created": "2026-09-05T17:54:53.359Z",
    "comment": ""
};
var migrationCommands = [{
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_place",
            {
                "type": Sequelize.STRING(120),
                "allowNull": true,
                "field": "pickup_place"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_lat",
            {
                "type": Sequelize.DECIMAL(10, 8),
                "allowNull": true,
                "field": "pickup_lat"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_lng",
            {
                "type": Sequelize.DECIMAL(11, 8),
                "allowNull": true,
                "field": "pickup_lng"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_order",
            {
                "type": Sequelize.SMALLINT,
                "allowNull": true,
                "field": "pickup_order"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "dropoff_lat",
            {
                "type": Sequelize.DECIMAL(10, 8),
                "allowNull": true,
                "field": "dropoff_lat"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "dropoff_lng",
            {
                "type": Sequelize.DECIMAL(11, 8),
                "allowNull": true,
                "field": "dropoff_lng"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "ride_requests",
            "note",
            {
                "type": Sequelize.TEXT,
                "allowNull": true,
                "field": "note"
            }
        ]
    }
];
module.exports = {
    pos: 0,
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
//# sourceMappingURL=025-noname.js.map