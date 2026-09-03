import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DeletionRequestAttributes {
  id: string;
  userId: string;
  reason?: string | null;
  status: string;
  estimatedCompletion?: Date | null;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeletionRequestCreationAttributes extends Optional<DeletionRequestAttributes, 'id' | 'reason' | 'status' | 'estimatedCompletion' | 'reviewNotes' | 'reviewedBy' | 'createdAt' | 'updatedAt'> {}

export class DeletionRequest extends Model<DeletionRequestAttributes, DeletionRequestCreationAttributes> implements DeletionRequestAttributes {
  declare id: string;
  declare userId: string;
  declare reason?: string | null;
  declare status: string;
  declare estimatedCompletion?: Date | null;
  declare reviewNotes?: string | null;
  declare reviewedBy?: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

DeletionRequest.init(
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
    reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
    estimatedCompletion: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    reviewNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    reviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'DeletionRequest',
        tableName: 'deletion_requests',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                name: 'idx_deletion_requests_user',
                fields: ['user_id'],
            },
            {
                name: 'idx_deletion_requests_status',
                fields: ['status'],
            },
        ],
    }
);

export default DeletionRequest;
module.exports = DeletionRequest;
Object.assign(module.exports, { default: DeletionRequest });
