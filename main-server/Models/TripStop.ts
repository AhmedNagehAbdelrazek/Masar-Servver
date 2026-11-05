import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { STOP_TYPE } from '../config/constants';

export interface TripStopAttributes {
  id: string;
  tripId: string;
  stopOrder: number;
  stopName?: string | null;
  city?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  stopLat?: number | null;
  stopLng?: number | null;
  stopType?: string | null;
  estimatedArrival?: Date | null;
  createdAt?: Date;
}

export interface TripStopCreationAttributes extends Optional<TripStopAttributes, 'id' | 'stopName' | 'city' | 'address' | 'lat' | 'lng' | 'stopLat' | 'stopLng' | 'stopType' | 'estimatedArrival' | 'createdAt'> {}

export class TripStop extends Model<TripStopAttributes, TripStopCreationAttributes> implements TripStopAttributes {
  declare id: string;
  declare tripId: string;
  declare stopOrder: number;
  declare stopName?: string | null;
  declare city?: string | null;
  declare address?: string | null;
  declare lat?: number | null;
  declare lng?: number | null;
  declare stopLat?: number | null;
  declare stopLng?: number | null;
  declare stopType?: string | null;
  declare estimatedArrival?: Date | null;
  declare readonly createdAt?: Date;
}

TripStop.init(
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
    stopOrder: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    stopName: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
    city: {
            type: DataTypes.STRING(80),
            allowNull: true,
        },
    address: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    lat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    lng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    stopLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    stopLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    stopType: {
            type: DataTypes.ENUM(...Object.values(STOP_TYPE)),
            allowNull: true,
        },
    estimatedArrival: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'TripStop',
        tableName: 'trip_stops',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                name: 'idx_trip_stops_trip',
                fields: ['trip_id'],
            },
            {
                name: 'idx_trip_stops_unique',
                unique: true,
                fields: ['trip_id', 'stop_order'],
            },
        ],
    }
);

export default TripStop;
module.exports = TripStop;
Object.assign(module.exports, { default: TripStop });
