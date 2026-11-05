import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { SOS_STATUS, SOS_URGENCY } from '../config/constants';

export interface SosEventAttributes {
  id: string;
  userId: string;
  tripId: string;
  bookingId?: string | null;
  lat: number;
  lng: number;
  urgency: string;
  status: string;
  escalationLevel: number;
  lastAlertAt?: Date | null;
  acknowledgedBy?: string | null;
  acknowledgedAt?: Date | null;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: Date | null;
  createdAt?: Date;
}

export interface SosEventCreationAttributes extends Optional<SosEventAttributes, 'id' | 'bookingId' | 'urgency' | 'status' | 'escalationLevel' | 'lastAlertAt' | 'acknowledgedBy' | 'acknowledgedAt' | 'resolvedBy' | 'resolutionNote' | 'resolvedAt' | 'createdAt'> {}

export class SosEvent extends Model<SosEventAttributes, SosEventCreationAttributes> implements SosEventAttributes {
  declare id: string;
  declare userId: string;
  declare tripId: string;
  declare bookingId?: string | null;
  declare lat: number;
  declare lng: number;
  declare urgency: string;
  declare status: string;
  declare escalationLevel: number;
  declare lastAlertAt?: Date | null;
  declare acknowledgedBy?: string | null;
  declare acknowledgedAt?: Date | null;
  declare resolvedBy?: string | null;
  declare resolutionNote?: string | null;
  declare resolvedAt?: Date | null;
  declare readonly createdAt?: Date;
}

SosEvent.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    tripId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    bookingId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    lat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    lng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    urgency: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: SOS_URGENCY.HIGH,
        },
    status: {
            type: DataTypes.ENUM(...Object.values(SOS_STATUS)),
            allowNull: false,
            defaultValue: SOS_STATUS.PENDING,
        },
    escalationLevel: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
    lastAlertAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    acknowledgedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    acknowledgedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    resolvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    resolutionNote: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'SosEvent',
        tableName: 'sos_events',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                name: 'idx_sos_status',
                fields: ['status'],
            },
            {
                name: 'idx_sos_trip',
                fields: ['trip_id'],
            },
            {
                name: 'idx_sos_user',
                fields: ['user_id'],
            },
        ],
    }
);

export default SosEvent;
module.exports = SosEvent;
Object.assign(module.exports, { default: SosEvent });
