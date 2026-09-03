"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class PaymentMethod extends sequelize_1.Model {
}
exports.PaymentMethod = PaymentMethod;
PaymentMethod.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    accountNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.PAYMENT_METHOD_TYPE)),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_payment_methods_active',
            fields: ['is_active'],
        },
    ],
});
exports.default = PaymentMethod;
module.exports = PaymentMethod;
Object.assign(module.exports, { default: PaymentMethod });
//# sourceMappingURL=PaymentMethod.js.map