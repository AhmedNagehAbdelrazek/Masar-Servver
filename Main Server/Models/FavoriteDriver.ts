import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface FavoriteDriverAttributes {
  id: string;
  passengerId: string;
  driverId: string;
  createdAt?: Date;
}

export interface FavoriteDriverCreationAttributes extends Optional<FavoriteDriverAttributes, 'id' | 'createdAt'> {}

export class FavoriteDriver extends Model<FavoriteDriverAttributes, FavoriteDriverCreationAttributes> implements FavoriteDriverAttributes {
  declare id: string;
  declare passengerId: string;
  declare driverId: string;
  declare readonly createdAt?: Date;
}

FavoriteDriver.init(
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
    driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
  },
  {
        sequelize,
        modelName: 'FavoriteDriver',
        tableName: 'favorite_drivers',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['passenger_id', 'driver_id'],
            },
        ],
    }
);

export default FavoriteDriver;
module.exports = FavoriteDriver;
Object.assign(module.exports, { default: FavoriteDriver });
