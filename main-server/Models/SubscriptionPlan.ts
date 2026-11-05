import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SubscriptionPlanAttributes {
  id: string;
  name: string;
  periodDays: number;
  percentageCut: number;
  cost: number;
  status?: string | null;
  features: unknown;
  isFree: boolean;
  freeOffer?: unknown | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlanCreationAttributes extends Optional<SubscriptionPlanAttributes, 'id' | 'percentageCut' | 'cost' | 'status' | 'features' | 'isFree' | 'freeOffer' | 'isActive' | 'createdAt' | 'updatedAt'> {}

export class SubscriptionPlan extends Model<SubscriptionPlanAttributes, SubscriptionPlanCreationAttributes> implements SubscriptionPlanAttributes {
  declare id: string;
  declare name: string;
  declare periodDays: number;
  declare percentageCut: number;
  declare cost: number;
  declare status?: string | null;
  declare features: unknown;
  declare isFree: boolean;
  declare freeOffer?: unknown | null;
  declare isActive: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

SubscriptionPlan.init(
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
    periodDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    percentageCut: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).DECIMAL(5, 2) as unknown as import('sequelize').DataType,
            allowNull: false,
            defaultValue: 0,
        },
    cost: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).DECIMAL(10, 2) as unknown as import('sequelize').DataType,
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
  },
  {
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
    }
);

export default SubscriptionPlan;
module.exports = SubscriptionPlan;
Object.assign(module.exports, { default: SubscriptionPlan });
