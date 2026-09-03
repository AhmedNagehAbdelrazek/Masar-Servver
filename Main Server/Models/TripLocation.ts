import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TripLocationAttributes {
  id: string;
  tripId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  createdAt?: Date;
}

export interface TripLocationCreationAttributes extends Optional<TripLocationAttributes, 'id' | 'speed' | 'heading' | 'createdAt'> {}

export class TripLocation extends Model<TripLocationAttributes, TripLocationCreationAttributes> implements TripLocationAttributes {
  declare id: string;
  declare tripId: string;
  declare driverId: string;
  declare lat: number;
  declare lng: number;
  declare speed?: number | null;
  declare heading?: number | null;
  declare readonly createdAt?: Date;
}

TripLocation.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    tripId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    lat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    lng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    speed: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    heading: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'TripLocation',
        tableName: 'trip_locations',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                name: 'idx_trip_locations_trip_created',
                fields: ['trip_id', 'createdat'],
            },
        ],
    }
);

export default TripLocation;
module.exports = TripLocation;
Object.assign(module.exports, { default: TripLocation });
