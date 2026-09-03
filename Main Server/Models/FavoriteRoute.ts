import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface FavoriteRouteAttributes {
  id: string;
  passengerId: string;
  originCity: string;
  destinationCity: string;
  label?: string | null;
  createdAt?: Date;
}

export interface FavoriteRouteCreationAttributes extends Optional<FavoriteRouteAttributes, 'id' | 'label' | 'createdAt'> {}

export class FavoriteRoute extends Model<FavoriteRouteAttributes, FavoriteRouteCreationAttributes> implements FavoriteRouteAttributes {
  declare id: string;
  declare passengerId: string;
  declare originCity: string;
  declare destinationCity: string;
  declare label?: string | null;
  declare readonly createdAt?: Date;
}

FavoriteRoute.init(
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
            type: DataTypes.STRING(80),
            allowNull: false,
        },
    destinationCity: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
    label: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'FavoriteRoute',
        tableName: 'favorite_routes',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['passenger_id', 'origin_city', 'destination_city'],
            },
        ],
    }
);

export default FavoriteRoute;
module.exports = FavoriteRoute;
Object.assign(module.exports, { default: FavoriteRoute });
