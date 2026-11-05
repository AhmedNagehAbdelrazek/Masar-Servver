"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlan = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class SubscriptionPlan extends sequelize_1.Model {
}
exports.SubscriptionPlan = SubscriptionPlan;
SubscriptionPlan.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    periodDays: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    percentageCut: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    },
    cost: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    features: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    isFree: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    freeOffer: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
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
exports.default = SubscriptionPlan;
module.exports = SubscriptionPlan;
Object.assign(module.exports, { default: SubscriptionPlan });
//# sourceMappingURL=SubscriptionPlan.js.map