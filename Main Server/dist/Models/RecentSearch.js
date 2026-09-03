"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
class RecentSearch extends Model {
}
RecentSearch.init({
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
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    destinationCity: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    searchedOn: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'RecentSearch',
    tableName: 'recent_search',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['passenger_id', 'origin_city', 'destination_city'],
        },
        {
            fields: ['passenger_id', 'searched_on'],
        },
    ],
});
module.exports = RecentSearch;
//# sourceMappingURL=RecentSearch.js.map