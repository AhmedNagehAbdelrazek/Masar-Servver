import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { COMPLAINT_STATUS } from '../config/constants';

export interface ComplaintAttributes {
  id: string;
  bookingId?: string | null;
  reporterId: string;
  accusedId: string;
  category: string;
  description: string;
  evidenceUrls?: string[] | null;
  status: string;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'bookingId' | 'evidenceUrls' | 'status' | 'resolution' | 'resolvedBy' | 'resolvedAt' | 'createdAt' | 'updatedAt'> {}

export class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
  declare id: string;
  declare bookingId?: string | null;
  declare reporterId: string;
  declare accusedId: string;
  declare category: string;
  declare description: string;
  declare evidenceUrls?: string[] | null;
  declare status: string;
  declare resolution?: string | null;
  declare resolvedBy?: string | null;
  declare resolvedAt?: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Complaint.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    bookingId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    reporterId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    accusedId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    category: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
    description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    evidenceUrls: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
        },
    status: {
            type: DataTypes.ENUM(...Object.values(COMPLAINT_STATUS)),
            allowNull: false,
            defaultValue: COMPLAINT_STATUS.OPEN,
        },
    resolution: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    resolvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'Complaint',
        tableName: 'complaints',
        underscored: true,
        timestamps: true,
    }
);

export default Complaint;
module.exports = Complaint;
Object.assign(module.exports, { default: Complaint });
