import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SubscriptionTransactionAttributes {
  id: string;
  driverId: string;
  tier: string;
  amount: number;
  currency?: string | null;
  paymentMethod: string;
  status?: string | null;
  providerTransactionId?: string | null;
  expiresAt: Date;
  createdAt?: Date;
}

export interface SubscriptionTransactionCreationAttributes extends Optional<SubscriptionTransactionAttributes, 'id' | 'currency' | 'status' | 'providerTransactionId' | 'createdAt'> {}

export class SubscriptionTransaction extends Model<SubscriptionTransactionAttributes, SubscriptionTransactionCreationAttributes> implements SubscriptionTransactionAttributes {
  declare id: string;
  declare driverId: string;
  declare tier: string;
  declare amount: number;
  declare currency?: string | null;
  declare paymentMethod: string;
  declare status?: string | null;
  declare providerTransactionId?: string | null;
  declare expiresAt: Date;
  declare readonly createdAt?: Date;
}

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
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
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

export default SubscriptionTransaction;
module.exports = SubscriptionTransaction;
Object.assign(module.exports, { default: SubscriptionTransaction });
