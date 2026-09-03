"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Booking extends sequelize_1.Model {
}
exports.Booking = Booking;
Booking.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    passengerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    seatNumber: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: true,
    },
    seatsBooked: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
    },
    agreedFare: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: false,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'JOD',
    },
    dropoffPlace: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
    },
    dropoffDeadline: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    dropoffOrder: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.BOOKING_STATUS)),
        allowNull: false,
        defaultValue: constants_1.BOOKING_STATUS.CONFIRMED,
    },
    referenceCode: {
        type: sequelize_1.DataTypes.STRING(12),
        allowNull: false,
        unique: true,
    },
    cancellationReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    cancelledBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    cancelledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.PAYMENT_STATUS)),
        allowNull: true,
        defaultValue: constants_1.PAYMENT_STATUS.PENDING,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Booking',
    tableName: 'bookings',
    underscored: true,
    timestamps: true,
});
exports.default = Booking;
module.exports = Booking;
Object.assign(module.exports, { default: Booking });
//# sourceMappingURL=Booking.js.map