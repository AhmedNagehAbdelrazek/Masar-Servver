import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuditLogAttributes {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  oldData?: unknown | null;
  newData?: unknown | null;
  performedBy?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'oldData' | 'newData' | 'performedBy' | 'ipAddress' | 'userAgent' | 'createdAt'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare tableName: string;
  declare recordId: string;
  declare action: string;
  declare oldData?: unknown | null;
  declare newData?: unknown | null;
  declare performedBy?: string | null;
  declare ipAddress?: string | null;
  declare userAgent?: string | null;
  declare readonly createdAt?: Date;
}

AuditLog.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    tableName: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
    recordId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    action: {
            type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
            allowNull: false,
        },
    oldData: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    newData: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    performedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    ipAddress: {
            type: DataTypes.INET,
            allowNull: true,
        },
    userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'AuditLog',
        tableName: 'audit_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

export default AuditLog;
module.exports = AuditLog;
Object.assign(module.exports, { default: AuditLog });
