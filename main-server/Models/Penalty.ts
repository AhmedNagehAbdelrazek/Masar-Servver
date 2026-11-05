import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { PENALTY_TYPES } from '../config/constants';

export interface PenaltyAttributes {
  id: string;
  userId: string;
  complaintId?: string | null;
  tripId?: string | null;
  type: string;
  penaltyType: string;
  severity: string;
  reason: string;
  details?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  issuedBy?: string | null;
  isAppealed?: boolean | null;
  appealReason?: string | null;
  appealResolvedAt?: Date | null;
  createdat: Date;
}

export interface PenaltyCreationAttributes extends Optional<PenaltyAttributes, 'id' | 'complaintId' | 'tripId' | 'penaltyType' | 'severity' | 'details' | 'startsAt' | 'endsAt' | 'issuedBy' | 'isAppealed' | 'appealReason' | 'appealResolvedAt' | 'createdat'> {}

export class Penalty extends Model<PenaltyAttributes, PenaltyCreationAttributes> implements PenaltyAttributes {
  declare id: string;
  declare userId: string;
  declare complaintId?: string | null;
  declare tripId?: string | null;
  declare type: string;
  declare penaltyType: string;
  declare severity: string;
  declare reason: string;
  declare details?: string | null;
  declare startsAt: Date;
  declare endsAt?: Date | null;
  declare issuedBy?: string | null;
  declare isAppealed?: boolean | null;
  declare appealReason?: string | null;
  declare appealResolvedAt?: Date | null;
  declare createdat: Date;
}

Penalty.init(
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
    complaintId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    tripId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    type: {
            type: DataTypes.ENUM(...Object.values(PENALTY_TYPES)),
            allowNull: false,
        },
    penaltyType: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'general',
        },
    severity: {
            type: DataTypes.STRING(15),
            allowNull: false,
            defaultValue: 'minor',
        },
    reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    details: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    startsAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    endsAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    issuedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    isAppealed: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    appealReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    appealResolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    createdat: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
  },
  {
        sequelize,
        modelName: 'Penalty',
        tableName: 'penalties',
        underscored: true,
        timestamps: false,
    }
);

export default Penalty;
module.exports = Penalty;
Object.assign(module.exports, { default: Penalty });
