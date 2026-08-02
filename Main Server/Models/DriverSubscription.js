const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { SUBSCRIPTION_STATUS } = require('../config/constants');

class DriverSubscription extends Model { }

DriverSubscription.init(
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
        planId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        planName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        planPeriodDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        planPercentageCut: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        planCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        balance: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        screenshotId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references:{
                model: 'uploaded_images',
                key: 'id'
            }
        },
        paymentMethod: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(SUBSCRIPTION_STATUS)),
            allowNull: false,
            defaultValue: SUBSCRIPTION_STATUS.PENDING_APPROVAL,
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        activatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        freeTripsUsed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        freeOffer: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'DriverSubscription',
        tableName: 'driver_subscriptions',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                name: 'idx_subscriptions_driver',
                fields: ['driver_id', 'status'],
            },
            {
                name: 'idx_subscriptions_plan',
                fields: ['plan_id'],
            },
            {
                name: 'idx_subscriptions_expiry',
                fields: ['status', 'expires_at'],
            },
        ],
    }
);

module.exports = DriverSubscription;
