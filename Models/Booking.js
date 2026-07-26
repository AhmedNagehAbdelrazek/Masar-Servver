const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../config/constants');

class Booking extends Model { }

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
            type: DataTypes.NUMERIC(10, 2),
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
            type: DataTypes.ENUM(Object.values(BOOKING_STATUS)),
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
            type: DataTypes.ENUM(Object.values(PAYMENT_STATUS)),
            allowNull: true,
            defaultValue: PAYMENT_STATUS.PENDING,
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

module.exports = Booking;
