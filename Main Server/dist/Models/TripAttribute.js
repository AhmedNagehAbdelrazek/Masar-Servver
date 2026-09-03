"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
class TripAttribute extends Model {
}
TripAttribute.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tripId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    attrKey: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    attrValue: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'TripAttribute',
    tableName: 'trip_attributes',
    underscored: true,
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['trip_id', 'attr_key'],
        },
    ],
});
module.exports = TripAttribute;
//# sourceMappingURL=TripAttribute.js.map