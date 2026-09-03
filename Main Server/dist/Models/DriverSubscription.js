"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverSubscription = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class DriverSubscription extends sequelize_1.Model {
}
exports.DriverSubscription = DriverSubscription;
DriverSubscription.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    planId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    planName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    planPeriodDays: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    planPercentageCut: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
    },
    planCost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    balance: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    screenshotId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id'
        }
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    adminNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.SUBSCRIPTION_STATUS)),
        allowNull: false,
        defaultValue: constants_1.SUBSCRIPTION_STATUS.PENDING_APPROVAL,
    },
    approvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    activatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    freeTripsUsed: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    freeOffer: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
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
});
exports.default = DriverSubscription;
module.exports = DriverSubscription;
Object.assign(module.exports, { default: DriverSubscription });
//# sourceMappingURL=DriverSubscription.js.map