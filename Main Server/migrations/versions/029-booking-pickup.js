'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "pickup_type" to table "bookings"
 * addColumn "pickup_stop_id" to table "bookings"
 * addColumn "pickup_label" to table "bookings"
 * addColumn "pickup_city" to table "bookings"
 * addColumn "pickup_area" to table "bookings"
 * addColumn "detour_seconds" to table "bookings"
 * addColumn "pickup_status" to table "bookings"
 * addColumn "arrived_at" to table "bookings"
 * addColumn "picked_up_at" to table "bookings"
 **/

var info = {
    "revision": 29,
    "name": "booking-pickup",
    "created": "2026-10-02T00:00:00.000Z",
    "comment": "spec 013 DB2: passenger pickup model on bookings"
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "bookings",
        "pickup_type",
        { "type": Sequelize.ENUM('stop', 'custom'), allowNull: true }
    ]
},
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_stop_id",
            { "type": Sequelize.UUID, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_label",
            { "type": Sequelize.TEXT, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_city",
            { "type": Sequelize.STRING(100), allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_area",
            { "type": Sequelize.STRING(120), allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "detour_seconds",
            { "type": Sequelize.INTEGER, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "pickup_status",
            { "type": Sequelize.ENUM('pending', 'arrived', 'picked_up', 'missed'), allowNull: false, defaultValue: 'pending' }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "arrived_at",
            { "type": Sequelize.DATE, allowNull: true }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "bookings",
            "picked_up_at",
            { "type": Sequelize.DATE, allowNull: true }
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
