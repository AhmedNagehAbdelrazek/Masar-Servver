import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RecentSearchAttributes {
  id: string;
  passengerId: string;
  originCity: string;
  destinationCity: string;
  searchedOn: Date;
  createdAt?: Date;
}

export interface RecentSearchCreationAttributes extends Optional<RecentSearchAttributes, 'id' | 'createdAt'> {}

export class RecentSearch extends Model<RecentSearchAttributes, RecentSearchCreationAttributes> implements RecentSearchAttributes {
  declare id: string;
  declare passengerId: string;
  declare originCity: string;
  declare destinationCity: string;
  declare searchedOn: Date;
  declare readonly createdAt?: Date;
}

RecentSearch.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    passengerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    originCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    destinationCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    searchedOn: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
  },
  {
        sequelize,
        modelName: 'RecentSearch',
        tableName: 'recent_search',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['passenger_id', 'origin_city', 'destination_city'],
            },
            {
                fields: ['passenger_id', 'searched_on'],
            },
        ],
    }
);

export default RecentSearch;
module.exports = RecentSearch;
Object.assign(module.exports, { default: RecentSearch });
