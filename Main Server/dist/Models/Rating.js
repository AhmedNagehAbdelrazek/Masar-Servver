"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
class Rating extends Model {
}
Rating.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    raterId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    rateeId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    stars: {
        type: DataTypes.SMALLINT,
        allowNull: false,
    },
    wasLate: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    lateMinutes: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 0,
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
    },
    isVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },
}, {
    sequelize,
    modelName: 'Rating',
    tableName: 'ratings',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
module.exports = Rating;
//# sourceMappingURL=Rating.js.map