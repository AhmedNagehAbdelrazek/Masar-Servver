'use strict';

var Sequelize = require('sequelize');

/**
 * Trip integrity + reminders:
 * - trips.abandoned_at / abandon_reason / abandon_warned_at
 * - bookings.dropped_off_at
 * - trip_reminders table (idempotent driver/passenger reminders, recurring-safe)
 * - enum values: trips.status += abandoned; bookings.pickup_status += dropped_off
 */

var info = {
    "revision": 34,
    "name": "trip-integrity-reminders",
    "created": "2026-11-09T00:00:00.000Z",
    "comment": "abandoned trips, dropped-off bookings, trip reminders"
};

var migrationCommands = [
    {
        fn: "rawQuery",
        params: [
            'DO $$ BEGIN ' +
            'IF EXISTS (SELECT 1 FROM pg_type WHERE typname = \'enum_trips_status\') THEN ' +
            'ALTER TYPE "enum_trips_status" ADD VALUE IF NOT EXISTS \'abandoned\'; ' +
            'END IF; ' +
            'IF EXISTS (SELECT 1 FROM pg_type WHERE typname = \'TripStatus\') THEN ' +
            'ALTER TYPE "TripStatus" ADD VALUE IF NOT EXISTS \'abandoned\'; ' +
            'END IF; ' +
            'IF EXISTS (SELECT 1 FROM pg_type WHERE typname = \'enum_bookings_pickup_status\') THEN ' +
            'ALTER TYPE "enum_bookings_pickup_status" ADD VALUE IF NOT EXISTS \'dropped_off\'; ' +
            'END IF; ' +
            'IF EXISTS (SELECT 1 FROM pg_type WHERE typname = \'PickupStatus\') THEN ' +
            'ALTER TYPE "PickupStatus" ADD VALUE IF NOT EXISTS \'dropped_off\'; ' +
            'END IF; ' +
            'END $$'
        ]
    },
    {
        fn: "addColumn",
        params: ["trips", "abandoned_at", { type: Sequelize.DATE, allowNull: true }]
    },
    {
        fn: "addColumn",
        params: ["trips", "abandon_reason", { type: Sequelize.TEXT, allowNull: true }]
    },
    {
        fn: "addColumn",
        params: ["trips", "abandon_warned_at", { type: Sequelize.DATE, allowNull: true }]
    },
    {
        fn: "addColumn",
        params: ["bookings", "dropped_off_at", { type: Sequelize.DATE, allowNull: true }]
    },
    {
        fn: "createTable",
        params: ["trip_reminders", {
            id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
            trip_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'trips', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            kind: { type: Sequelize.STRING(30), allowNull: false },
            occurrence_at: { type: Sequelize.DATE, allowNull: false },
            sent_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            createdat: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            updatedat: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
        }]
    },
    {
        fn: "addIndex",
        params: ["trip_reminders", ["trip_id", "user_id", "kind", "occurrence_at"], {
            name: "uniq_trip_reminders_trip_user_kind_occurrence",
            unique: true
        }]
    },
    {
        fn: "addIndex",
        params: ["trip_reminders", ["trip_id", "occurrence_at"], {
            name: "idx_trip_reminders_trip_occurrence"
        }]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface) {
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    var command = migrationCommands[index];
                    console.log("[#" + index + "] execute: " + command.fn);
                    index++;
                    var target = command.fn === 'rawQuery'
                        ? queryInterface.sequelize
                        : queryInterface;
                    var run = command.fn === 'rawQuery'
                        ? target.query(command.params[0])
                        : target[command.fn].apply(target, command.params);
                    run.then(next, reject);
                } else resolve();
            }
            next();
        });
    },
    info: info
};
