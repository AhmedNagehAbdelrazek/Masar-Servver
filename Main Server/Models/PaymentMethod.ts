import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { PAYMENT_METHOD_TYPE } from '../config/constants';

export interface PaymentMethodAttributes {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  email?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentMethodCreationAttributes extends Optional<PaymentMethodAttributes, 'id' | 'email' | 'isActive' | 'createdAt' | 'updatedAt'> {}

export class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes> implements PaymentMethodAttributes {
  declare id: string;
  declare name: string;
  declare accountNumber: string;
  declare type: string;
  declare email?: string | null;
  declare isActive: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

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
            type: DataTypes.ENUM(...Object.values(PAYMENT_METHOD_TYPE)),
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

export default PaymentMethod;
module.exports = PaymentMethod;
Object.assign(module.exports, { default: PaymentMethod });
