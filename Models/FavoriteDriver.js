const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FavoriteDriver extends Model { }

FavoriteDriver.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        passengerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'FavoriteDriver',
        tableName: 'favorite_drivers',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['passenger_id', 'driver_id'],
            },
        ],
    }
);

module.exports = FavoriteDriver;
