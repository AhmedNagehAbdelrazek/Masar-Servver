const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { STOP_TYPE } = require('../config/constants');

class TripStop extends Model { }

TripStop.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tripId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        stopOrder: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        stopName: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(80),
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        lat: {
            type: DataTypes.NUMERIC(10, 8),
            allowNull: true,
        },
        lng: {
            type: DataTypes.NUMERIC(11, 8),
            allowNull: true,
        },
        stopLat: {
            type: DataTypes.NUMERIC(10, 8),
            allowNull: true,
        },
        stopLng: {
            type: DataTypes.NUMERIC(11, 8),
            allowNull: true,
        },
        stopType: {
            type: DataTypes.ENUM(Object.values(STOP_TYPE)),
            allowNull: true,
        },
        estimatedArrival: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'TripStop',
        tableName: 'trip_stops',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                name: 'idx_trip_stops_trip',
                fields: ['trip_id'],
            },
            {
                name: 'idx_trip_stops_unique',
                unique: true,
                fields: ['trip_id', 'stop_order'],
            },
        ],
    }
);

module.exports = TripStop;
