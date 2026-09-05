'use strict';

var Sequelize = require('sequelize');

var info = {
    "revision": 25,
    "name": "booking-pickup-and-request-note",
    "created": "2026-09-06T00:00:00.000Z",
    "comment": "add pickup_place/pickup_order to bookings and note to ride_requests"
};

var migrationCommands = [
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_place",
            {
                "type": Sequelize.STRING(120),
                "field": "pickup_place",
                "allowNull": true
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
                "field": "pickup_order",
                "allowNull": true
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
                "field": "note",
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
        return queryInterface.removeColumn("ride_requests", "note")
            .then(() => queryInterface.removeColumn("bookings", "pickup_order"))
            .then(() => queryInterface.removeColumn("bookings", "pickup_place"));
    },
    info: info
};
