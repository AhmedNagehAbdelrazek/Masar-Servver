import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RatingAttributes {
  id: string;
  bookingId: string;
  raterId: string;
  rateeId: string;
  stars: number;
  wasLate?: boolean | null;
  lateMinutes?: number | null;
  review?: string | null;
  tags?: string[] | null;
  isVisible?: boolean | null;
  createdAt?: Date;
}

export interface RatingCreationAttributes extends Optional<RatingAttributes, 'id' | 'wasLate' | 'lateMinutes' | 'review' | 'tags' | 'isVisible' | 'createdAt'> {}

export class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  declare id: string;
  declare bookingId: string;
  declare raterId: string;
  declare rateeId: string;
  declare stars: number;
  declare wasLate?: boolean | null;
  declare lateMinutes?: number | null;
  declare review?: string | null;
  declare tags?: string[] | null;
  declare isVisible?: boolean | null;
  declare readonly createdAt?: Date;
}

Rating.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    bookingId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    raterId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    rateeId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    stars: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    wasLate: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    lateMinutes: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: 0,
        },
    review: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    tags: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
        },
    isVisible: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
  },
  {
        sequelize,
        modelName: 'Rating',
        tableName: 'ratings',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

export default Rating;
module.exports = Rating;
Object.assign(module.exports, { default: Rating });
