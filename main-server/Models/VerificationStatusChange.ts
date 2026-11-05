import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { VERIFICATION_STATUS } from '../config/constants';

export interface VerificationStatusChangeAttributes {
  id: string;
  driverId: string;
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
  markedFields?: unknown | null;
  changedBy?: string | null;
  createdAt?: Date;
}

export interface VerificationStatusChangeCreationAttributes extends Optional<VerificationStatusChangeAttributes, 'id' | 'fromStatus' | 'reason' | 'markedFields' | 'changedBy' | 'createdAt'> {}

export class VerificationStatusChange extends Model<VerificationStatusChangeAttributes, VerificationStatusChangeCreationAttributes> implements VerificationStatusChangeAttributes {
  declare id: string;
  declare driverId: string;
  declare fromStatus?: string | null;
  declare toStatus: string;
  declare reason?: string | null;
  declare markedFields?: unknown | null;
  declare changedBy?: string | null;
  declare readonly createdAt?: Date;
}

VerificationStatusChange.init(
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
    fromStatus: {
            type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
            allowNull: true,
        },
    toStatus: {
            type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
            allowNull: false,
        },
    reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    markedFields: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    changedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'VerificationStatusChange',
        tableName: 'verification_status_changes',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

export default VerificationStatusChange;
module.exports = VerificationStatusChange;
Object.assign(module.exports, { default: VerificationStatusChange });
