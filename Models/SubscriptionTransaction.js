const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SubscriptionTransaction extends Model { }

SubscriptionTransaction.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        tier: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        amount: {
            type: DataTypes.NUMERIC(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'JOD',
        },
        paymentMethod: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(15),
            allowNull: true,
            defaultValue: 'pending',
        },
        providerTransactionId: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'SubscriptionTransaction',
        tableName: 'subscription_transactions',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

module.exports = SubscriptionTransaction;
