"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trip = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Trip extends sequelize_1.Model {
}
exports.Trip = Trip;
Trip.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    vehicleId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    originCity: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    originArea: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
    },
    originAddress: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    originLat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    originLng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: true,
    },
    destinationCity: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    destinationArea: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
    },
    destinationAddress: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    destinationLat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    destinationLng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: true,
    },
    departureTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    arrivalTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    totalSeats: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    availableSeats: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    farePerSeat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: false,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'JOD',
    },
    isRecurring: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    recurrencePattern: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    recurrenceDays: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.SMALLINT),
        allowNull: true,
    },
    recurrenceEndDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    genderPreference: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.GENDER_PREFERENCE)),
        allowNull: false,
        defaultValue: constants_1.GENDER_PREFERENCE.ALL,
    },
    driverInstructions: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        allowNull: true,
    },
    additionalInstructions: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.TRIP_STATUS)),
        allowNull: false,
        defaultValue: constants_1.TRIP_STATUS.PUBLISHED,
    },
    isFeatured: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    featuredUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isBlockedByBalance: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isModerated: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    moderationReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    moderatedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
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
});
exports.default = Trip;
module.exports = Trip;
Object.assign(module.exports, { default: Trip });
//# sourceMappingURL=Trip.js.map