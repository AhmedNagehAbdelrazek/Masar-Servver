import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants';

export interface BookingAttributes {
  id: string;
  tripId: string;
  passengerId: string;
  seatNumber?: number | null;
  seatNumbers?: number[] | null;
  seatsBooked: number;
  agreedFare: number;
  currency?: string | null;
  pickupPlace?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupOrder?: number | null;
  pickupType?: string | null;
  pickupStopId?: string | null;
  pickupLabel?: string | null;
  pickupCity?: string | null;
  pickupArea?: string | null;
  detourSeconds?: number | null;
  pickupStatus?: string | null;
  arrivedAt?: Date | null;
  pickedUpAt?: Date | null;
  dropoffPlace?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffDeadline?: Date | null;
  dropoffOrder?: number | null;
  status: string;
  referenceCode: string;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: Date | null;
  paymentStatus?: string | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'seatNumber' | 'seatNumbers' | 'seatsBooked' | 'currency' | 'pickupPlace' | 'pickupLat' | 'pickupLng' | 'pickupOrder' | 'pickupType' | 'pickupStopId' | 'pickupLabel' | 'pickupCity' | 'pickupArea' | 'detourSeconds' | 'pickupStatus' | 'arrivedAt' | 'pickedUpAt' | 'dropoffPlace' | 'dropoffLat' | 'dropoffLng' | 'dropoffDeadline' | 'dropoffOrder' | 'status' | 'cancellationReason' | 'cancelledBy' | 'cancelledAt' | 'paymentStatus' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

export class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  declare id: string;
  declare tripId: string;
  declare passengerId: string;
  declare seatNumber?: number | null;
  declare seatNumbers?: number[] | null;
  declare seatsBooked: number;
  declare agreedFare: number;
  declare currency?: string | null;
  declare pickupPlace?: string | null;
  declare pickupLat?: number | null;
  declare pickupLng?: number | null;
  declare pickupOrder?: number | null;
  declare pickupType?: string | null;
  declare pickupStopId?: string | null;
  declare pickupLabel?: string | null;
  declare pickupCity?: string | null;
  declare pickupArea?: string | null;
  declare detourSeconds?: number | null;
  declare pickupStatus?: string | null;
  declare arrivedAt?: Date | null;
  declare pickedUpAt?: Date | null;
  declare dropoffPlace?: string | null;
  declare dropoffLat?: number | null;
  declare dropoffLng?: number | null;
  declare dropoffDeadline?: Date | null;
  declare dropoffOrder?: number | null;
  declare status: string;
  declare referenceCode: string;
  declare cancellationReason?: string | null;
  declare cancelledBy?: string | null;
  declare cancelledAt?: Date | null;
  declare paymentStatus?: string | null;
  declare completedAt?: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Booking.init(
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
    passengerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    seatNumber: {
            type: DataTypes.SMALLINT,
            allowNull: true,
        },
    seatNumbers: {
            type: DataTypes.ARRAY(DataTypes.SMALLINT),
            field: 'seat_numbers',
            allowNull: true,
        },
    seatsBooked: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 1,
        },
    agreedFare: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
            allowNull: false,
        },
    currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'JOD',
        },
    pickupPlace: {
            type: DataTypes.STRING(120),
            field: 'pickup_place',
            allowNull: true,
        },
    pickupLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            field: 'pickup_lat',
            allowNull: true,
        },
    pickupLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            field: 'pickup_lng',
            allowNull: true,
        },
    pickupOrder: {
            type: DataTypes.SMALLINT,
            field: 'pickup_order',
            allowNull: true,
        },
    // spec 013 DB2: pickup model (see migration 029)
    pickupType: {
            type: DataTypes.ENUM('stop', 'custom'),
            field: 'pickup_type',
            allowNull: true,
        },
    pickupStopId: {
            type: DataTypes.UUID,
            field: 'pickup_stop_id',
            allowNull: true,
        },
    pickupLabel: {
            type: DataTypes.TEXT,
            field: 'pickup_label',
            allowNull: true,
        },
    pickupCity: {
            type: DataTypes.STRING(100),
            field: 'pickup_city',
            allowNull: true,
        },
    pickupArea: {
            type: DataTypes.STRING(120),
            field: 'pickup_area',
            allowNull: true,
        },
    detourSeconds: {
            type: DataTypes.INTEGER,
            field: 'detour_seconds',
            allowNull: true,
        },
    pickupStatus: {
            type: DataTypes.ENUM('pending', 'arrived', 'picked_up', 'missed'),
            field: 'pickup_status',
            allowNull: false,
            defaultValue: 'pending',
        },
    arrivedAt: {
            type: DataTypes.DATE,
            field: 'arrived_at',
            allowNull: true,
        },
    pickedUpAt: {
            type: DataTypes.DATE,
            field: 'picked_up_at',
            allowNull: true,
        },
    dropoffPlace: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
    dropoffLat: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 8) as unknown as import('sequelize').DataType,
            field: 'dropoff_lat',
            allowNull: true,
        },
    dropoffLng: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(11, 8) as unknown as import('sequelize').DataType,
            field: 'dropoff_lng',
            allowNull: true,
        },
    dropoffDeadline: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    dropoffOrder: {
            type: DataTypes.SMALLINT,
            allowNull: true,
        },
    status: {
            type: DataTypes.ENUM(...Object.values(BOOKING_STATUS)),
            allowNull: false,
            defaultValue: BOOKING_STATUS.CONFIRMED,
        },
    referenceCode: {
            type: DataTypes.STRING(12),
            allowNull: false,
            unique: true,
        },
    cancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    cancelledBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    cancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    paymentStatus: {
            type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
            allowNull: true,
            defaultValue: PAYMENT_STATUS.PENDING,
        },
    completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'Booking',
        tableName: 'bookings',
        underscored: true,
        timestamps: true,
    }
);

export default Booking;
module.exports = Booking;
Object.assign(module.exports, { default: Booking });
