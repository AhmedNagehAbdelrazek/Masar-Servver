import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { RIDE_REQUEST_STATUS } from '../config/constants';

export interface RideRequestAttributes {
  id: string;
  passengerId: string;
  originPlace: string;
  originCity: string;
  originLat?: number | null;
  originLng?: number | null;
  originTime?: Date | null;
  destinationPlace: string;
  destinationCity: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  arrivalDeadline?: Date | null;
  seatsNeeded: number;
  maxBudget?: number | null;
  currency?: string | null;
  attributesPreferred?: unknown | null;
  status: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RideRequestCreationAttributes extends Optional<RideRequestAttributes, 'id' | 'originLat' | 'originLng' | 'originTime' | 'destinationLat' | 'destinationLng' | 'arrivalDeadline' | 'seatsNeeded' | 'maxBudget' | 'currency' | 'attributesPreferred' | 'status' | 'createdAt' | 'updatedAt'> {}

export class RideRequest extends Model<RideRequestAttributes, RideRequestCreationAttributes> implements RideRequestAttributes {
  declare id: string;
  declare passengerId: string;
  declare originPlace: string;
  declare originCity: string;
  declare originLat?: number | null;
  declare originLng?: number | null;
  declare originTime?: Date | null;
  declare destinationPlace: string;
  declare destinationCity: string;
  declare destinationLat?: number | null;
  declare destinationLng?: number | null;
  declare arrivalDeadline?: Date | null;
  declare seatsNeeded: number;
  declare maxBudget?: number | null;
  declare currency?: string | null;
  declare attributesPreferred?: unknown | null;
  declare status: string;
  declare expiresAt: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

RideRequest.init(
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
    originPlace: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
    originCity: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
    originLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    originLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    originTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    destinationPlace: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
    destinationCity: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
    destinationLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    destinationLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    arrivalDeadline: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    seatsNeeded: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 1,
        },
    maxBudget: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'JOD',
        },
    attributesPreferred: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
    status: {
            type: DataTypes.ENUM(...Object.values(RIDE_REQUEST_STATUS)),
            allowNull: false,
            defaultValue: RIDE_REQUEST_STATUS.OPEN,
        },
    expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
  },
  {
        sequelize,
        modelName: 'RideRequest',
        tableName: 'ride_requests',
        underscored: true,
        timestamps: true,
    }
);

export default RideRequest;
module.exports = RideRequest;
Object.assign(module.exports, { default: RideRequest });
