"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionTransaction = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class SubscriptionTransaction extends sequelize_1.Model {
}
exports.SubscriptionTransaction = SubscriptionTransaction;
SubscriptionTransaction.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    tier: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: false,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'JOD',
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(15),
        allowNull: true,
        defaultValue: 'pending',
    },
    providerTransactionId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'SubscriptionTransaction',
    tableName: 'subscription_transactions',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
exports.default = SubscriptionTransaction;
module.exports = SubscriptionTransaction;
Object.assign(module.exports, { default: SubscriptionTransaction });
//# sourceMappingURL=SubscriptionTransaction.js.map