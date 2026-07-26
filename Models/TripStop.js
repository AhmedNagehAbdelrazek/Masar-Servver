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
        city: {
            type: DataTypes.STRING(80),
            allowNull: false,
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
        stopType: {
            type: DataTypes.ENUM(Object.values(STOP_TYPE)),
            allowNull: false,
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
    }
);

module.exports = TripStop;
