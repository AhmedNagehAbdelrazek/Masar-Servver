"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { RIDE_REQUEST_STATUS } = require('../config/constants');
class RideRequest extends Model {
}
RideRequest.init({
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
        type: DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    originLng: {
        type: DataTypes.NUMERIC(11, 8),
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
        type: DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    destinationLng: {
        type: DataTypes.NUMERIC(11, 8),
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
        type: DataTypes.NUMERIC(10, 2),
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
        type: DataTypes.ENUM(Object.values(RIDE_REQUEST_STATUS)),
        allowNull: false,
        defaultValue: RIDE_REQUEST_STATUS.OPEN,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'RideRequest',
    tableName: 'ride_requests',
    underscored: true,
    timestamps: true,
});
module.exports = RideRequest;
//# sourceMappingURL=RideRequest.js.map