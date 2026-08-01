const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PAYMENT_METHOD_TYPE } = require('../config/constants');

class PaymentMethod extends Model { }

PaymentMethod.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(Object.values(PAYMENT_METHOD_TYPE)),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
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
    }
);

module.exports = PaymentMethod;
