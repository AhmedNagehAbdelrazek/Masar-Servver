import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../config/constants';

export interface BookingAttributes {
  id: string;
  tripId: string;
  passengerId: string;
  seatNumber?: number | null;
  seatsBooked: number;
  agreedFare: number;
  currency?: string | null;
  dropoffPlace?: string | null;
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

export interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'seatNumber' | 'seatsBooked' | 'currency' | 'dropoffPlace' | 'dropoffDeadline' | 'dropoffOrder' | 'status' | 'cancellationReason' | 'cancelledBy' | 'cancelledAt' | 'paymentStatus' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

export class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  declare id: string;
  declare tripId: string;
  declare passengerId: string;
  declare seatNumber?: number | null;
  declare seatsBooked: number;
  declare agreedFare: number;
  declare currency?: string | null;
  declare dropoffPlace?: string | null;
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
    dropoffPlace: {
            type: DataTypes.STRING(120),
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
