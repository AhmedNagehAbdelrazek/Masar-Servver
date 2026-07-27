const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { TRIP_STATUS, GENDER_PREFERENCE } = require('../config/constants');

class Trip extends Model { }

Trip.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        vehicleId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        originCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        originArea: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        originAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        originLat: {
            type: DataTypes.NUMERIC(10, 8),
            allowNull: true,
        },
        originLng: {
            type: DataTypes.NUMERIC(11, 8),
            allowNull: true,
        },
        destinationCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        destinationArea: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        destinationAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        destinationLat: {
            type: DataTypes.NUMERIC(10, 8),
            allowNull: true,
        },
        destinationLng: {
            type: DataTypes.NUMERIC(11, 8),
            allowNull: true,
        },
        departureTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        arrivalTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        totalSeats: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        availableSeats: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        farePerSeat: {
            type: DataTypes.NUMERIC(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'JOD',
        },
        isRecurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        recurrencePattern: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        recurrenceDays: {
            type: DataTypes.ARRAY(DataTypes.SMALLINT),
            allowNull: true,
        },
        recurrenceEndDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        genderPreference: {
            type: DataTypes.ENUM(Object.values(GENDER_PREFERENCE)),
            allowNull: false,
            defaultValue: GENDER_PREFERENCE.ALL,
        },
        driverInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        additionalInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(Object.values(TRIP_STATUS)),
            allowNull: false,
            defaultValue: TRIP_STATUS.PUBLISHED,
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        featuredUntil: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Trip',
        tableName: 'trips',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                name: 'idx_trips_driver_departure',
                fields: ['driver_id', 'departure_time'],
            },
            {
                name: 'idx_trips_origin_dest',
                fields: ['origin_city', 'destination_city', 'departure_time'],
            },
            {
                name: 'idx_trips_status',
                fields: ['status'],
            },
            {
                name: 'idx_trips_recurrence',
                fields: ['recurrence_days'],
                using: 'GIN',
            },
        ],
    }
);

module.exports = Trip;
