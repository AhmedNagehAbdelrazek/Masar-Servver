import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { SUBSCRIPTION_STATUS } from '../config/constants';

export interface DriverSubscriptionAttributes {
  id: string;
  driverId: string;
  planId: string;
  planName: string;
  planPeriodDays: number;
  planPercentageCut: number;
  planCost: number;
  balance: number;
  screenshotId?: number | null;
  paymentMethod: unknown;
  adminNotes?: string | null;
  status: string;
  approvedAt?: Date | null;
  activatedAt?: Date | null;
  expiresAt?: Date | null;
  freeTripsUsed: number;
  freeOffer?: unknown | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DriverSubscriptionCreationAttributes extends Optional<DriverSubscriptionAttributes, 'id' | 'balance' | 'screenshotId' | 'adminNotes' | 'status' | 'approvedAt' | 'activatedAt' | 'expiresAt' | 'freeTripsUsed' | 'freeOffer' | 'createdAt' | 'updatedAt'> {}

export class DriverSubscription extends Model<DriverSubscriptionAttributes, DriverSubscriptionCreationAttributes> implements DriverSubscriptionAttributes {
  declare id: string;
  declare driverId: string;
  declare planId: string;
  declare planName: string;
  declare planPeriodDays: number;
  declare planPercentageCut: number;
  declare planCost: number;
  declare balance: number;
  declare screenshotId?: number | null;
  declare paymentMethod: unknown;
  declare adminNotes?: string | null;
  declare status: string;
  declare approvedAt?: Date | null;
  declare activatedAt?: Date | null;
  declare expiresAt?: Date | null;
  declare freeTripsUsed: number;
  declare freeOffer?: unknown | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

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
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).DECIMAL(5, 2) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    planCost: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).DECIMAL(10, 2) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    balance: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).DECIMAL(10, 2) as unknown as import('sequelize').DataType,
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

export default DriverSubscription;
module.exports = DriverSubscription;
Object.assign(module.exports, { default: DriverSubscription });
