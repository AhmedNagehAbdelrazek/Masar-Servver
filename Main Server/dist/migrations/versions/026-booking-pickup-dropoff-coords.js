'use strict';
var Sequelize = require('sequelize');
var info = {
    "revision": 26,
    "name": "booking-pickup-dropoff-coords",
    "created": "2026-09-06T00:00:00.000Z",
    "comment": "add pickup_lat/lng and dropoff_lat/lng to bookings for passenger booking with name+lat/lng"
};
var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_lat",
            {
                "type": Sequelize.NUMERIC(10, 8),
                "field": "pickup_lat",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_lng",
            {
                "type": Sequelize.NUMERIC(11, 8),
                "field": "pickup_lng",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "dropoff_lat",
            {
                "type": Sequelize.NUMERIC(10, 8),
                "field": "dropoff_lat",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "dropoff_lng",
            {
                "type": Sequelize.NUMERIC(11, 8),
                "field": "dropoff_lng",
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
    down: function (queryInterface) {
        return queryInterface.removeColumn("bookings", "dropoff_lng")
            .then(() => queryInterface.removeColumn("bookings", "dropoff_lat"))
            .then(() => queryInterface.removeColumn("bookings", "pickup_lng"))
            .then(() => queryInterface.removeColumn("bookings", "pickup_lat"));
    },
    info: info
};
//# sourceMappingURL=026-booking-pickup-dropoff-coords.js.map