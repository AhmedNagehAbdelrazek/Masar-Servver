import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TRIP_STATUS, GENDER_PREFERENCE } from '../config/constants';

export interface TripAttributes {
  id: string;
  driverId: string;
  vehicleId: string;
  originCity: string;
  originArea?: string | null;
  originAddress?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destinationCity: string;
  destinationArea?: string | null;
  destinationAddress?: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  departureTime: Date;
  arrivalTime?: Date | null;
  totalSeats: number;
  availableSeats: number;
  farePerSeat: number;
  currency?: string | null;
  isRecurring: boolean;
  recurrencePattern?: unknown | null;
  recurrenceDays?: number[] | null;
  recurrenceEndDate?: Date | null;
  genderPreference: string;
  driverInstructions?: string[] | null;
  additionalInstructions?: string | null;
  status: string;
  isFeatured?: boolean | null;
  featuredUntil?: Date | null;
  isBlockedByBalance: boolean;
  isModerated: boolean;
  moderationReason?: string | null;
  moderatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripCreationAttributes extends Optional<TripAttributes, 'id' | 'originArea' | 'originAddress' | 'originLat' | 'originLng' | 'destinationArea' | 'destinationAddress' | 'destinationLat' | 'destinationLng' | 'arrivalTime' | 'currency' | 'isRecurring' | 'recurrencePattern' | 'recurrenceDays' | 'recurrenceEndDate' | 'genderPreference' | 'driverInstructions' | 'additionalInstructions' | 'status' | 'isFeatured' | 'featuredUntil' | 'isBlockedByBalance' | 'isModerated' | 'moderationReason' | 'moderatedBy' | 'createdAt' | 'updatedAt'> {}

export class Trip extends Model<TripAttributes, TripCreationAttributes> implements TripAttributes {
  declare id: string;
  declare driverId: string;
  declare vehicleId: string;
  declare originCity: string;
  declare originArea?: string | null;
  declare originAddress?: string | null;
  declare originLat?: number | null;
  declare originLng?: number | null;
  declare destinationCity: string;
  declare destinationArea?: string | null;
  declare destinationAddress?: string | null;
  declare destinationLat?: number | null;
  declare destinationLng?: number | null;
  declare departureTime: Date;
  declare arrivalTime?: Date | null;
  declare totalSeats: number;
  declare availableSeats: number;
  declare farePerSeat: number;
  declare currency?: string | null;
  declare isRecurring: boolean;
  declare recurrencePattern?: unknown | null;
  declare recurrenceDays?: number[] | null;
  declare recurrenceEndDate?: Date | null;
  declare genderPreference: string;
  declare driverInstructions?: string[] | null;
  declare additionalInstructions?: string | null;
  declare status: string;
  declare isFeatured?: boolean | null;
  declare featuredUntil?: Date | null;
  declare isBlockedByBalance: boolean;
  declare isModerated: boolean;
  declare moderationReason?: string | null;
  declare moderatedBy?: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Trip.init(
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
    vehicleId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    originCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    originArea: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
    originAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    originLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    originLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    destinationCity: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    destinationArea: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
    destinationAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    destinationLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    destinationLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    departureTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    arrivalTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    totalSeats: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    availableSeats: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    farePerSeat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'JOD',
        },
    isRecurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    recurrencePattern: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    recurrenceDays: {
            type: DataTypes.ARRAY(DataTypes.SMALLINT),
            allowNull: true,
        },
    recurrenceEndDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    genderPreference: {
            type: DataTypes.ENUM(...Object.values(GENDER_PREFERENCE)),
            allowNull: false,
            defaultValue: GENDER_PREFERENCE.ALL,
        },
    driverInstructions: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
        },
    additionalInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    status: {
            type: DataTypes.ENUM(...Object.values(TRIP_STATUS)),
            allowNull: false,
            defaultValue: TRIP_STATUS.PUBLISHED,
        },
    isFeatured: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    featuredUntil: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    isBlockedByBalance: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    isModerated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    moderationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    moderatedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'Trip',
        tableName: 'trips',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                name: 'idx_trips_driver_departure',
                fields: ['driver_id', 'departure_time'],
            },
            {
                name: 'idx_trips_origin_dest',
                fields: ['origin_city', 'destination_city', 'departure_time'],
            },
            {
                name: 'idx_trips_status',
                fields: ['status'],
            },
            {
                name: 'idx_trips_recurrence',
                fields: ['recurrence_days'],
                using: 'GIN',
            },
        ],
    }
);

export default Trip;
module.exports = Trip;
Object.assign(module.exports, { default: Trip });
