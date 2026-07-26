const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FavoriteRoute extends Model { }

FavoriteRoute.init(
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
        originCity: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        destinationCity: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        label: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'FavoriteRoute',
        tableName: 'favorite_routes',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['passenger_id', 'origin_city', 'destination_city'],
            },
        ],
    }
);

module.exports = FavoriteRoute;
