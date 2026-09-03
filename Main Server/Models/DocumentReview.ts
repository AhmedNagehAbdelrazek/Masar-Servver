import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DocumentReviewAttributes {
  id: string;
  driverId: string;
  documentKey: string;
  decision: string;
  reason?: string | null;
  decidedBy?: string | null;
  decidedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentReviewCreationAttributes extends Optional<DocumentReviewAttributes, 'id' | 'reason' | 'decidedBy' | 'decidedAt' | 'createdAt' | 'updatedAt'> {}

export class DocumentReview extends Model<DocumentReviewAttributes, DocumentReviewCreationAttributes> implements DocumentReviewAttributes {
  declare id: string;
  declare driverId: string;
  declare documentKey: string;
  declare decision: string;
  declare reason?: string | null;
  declare decidedBy?: string | null;
  declare decidedAt: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

DocumentReview.init(
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
    documentKey: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
    decision: {
            type: DataTypes.ENUM('approved', 'rejected'),
            allowNull: false,
        },
    reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    decidedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    decidedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
  },
  {
        sequelize,
        modelName: 'DocumentReview',
        tableName: 'document_reviews',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['driver_id', 'document_key'],
            },
            {
                fields: ['driver_id'],
            },
        ],
    }
);

export default DocumentReview;
module.exports = DocumentReview;
Object.assign(module.exports, { default: DocumentReview });
