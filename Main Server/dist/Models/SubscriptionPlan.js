"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
class SubscriptionPlan extends Model {
}
SubscriptionPlan.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    periodDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    percentageCut: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: true,
    },
    features: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    isFree: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    freeOffer: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize,
    modelName: 'SubscriptionPlan',
    tableName: 'subscription_plans',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_plans_active',
            fields: ['is_active'],
        },
    ],
});
module.exports = SubscriptionPlan;
//# sourceMappingURL=SubscriptionPlan.js.map