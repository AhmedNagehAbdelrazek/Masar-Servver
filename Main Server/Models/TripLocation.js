const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TripLocation extends Model { }

TripLocation.init(
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
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        lat: {
            type: DataTypes.NUMERIC(10, 8),
            allowNull: false,
        },
        lng: {
            type: DataTypes.NUMERIC(11, 8),
            allowNull: false,
        },
        speed: {
            type: DataTypes.NUMERIC(10, 2),
            allowNull: true,
        },
        heading: {
            type: DataTypes.NUMERIC(10, 2),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'TripLocation',
        tableName: 'trip_locations',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                name: 'idx_trip_locations_trip_created',
                fields: ['trip_id', 'createdat'],
            },
        ],
    }
);

module.exports = TripLocation;
