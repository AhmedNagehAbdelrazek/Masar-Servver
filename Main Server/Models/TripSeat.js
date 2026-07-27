const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { SEAT_TYPE } = require('../config/constants');

class TripSeat extends Model { }

TripSeat.init(
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
        seatNumber: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        seatType: {
            type: DataTypes.ENUM(Object.values(SEAT_TYPE)),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'TripSeat',
        tableName: 'trip_seats',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            {
                name: 'idx_trip_seats_trip',
                fields: ['trip_id'],
            },
            {
                name: 'idx_trip_seats_unique',
                unique: true,
                fields: ['trip_id', 'seat_number'],
            },
        ],
    }
);

module.exports = TripSeat;
