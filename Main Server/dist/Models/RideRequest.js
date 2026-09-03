"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideRequest = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class RideRequest extends sequelize_1.Model {
}
exports.RideRequest = RideRequest;
RideRequest.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    passengerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    originPlace: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    originCity: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    originLat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    originLng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: true,
    },
    originTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    destinationPlace: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: false,
    },
    destinationCity: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    destinationLat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    destinationLng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: true,
    },
    arrivalDeadline: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    seatsNeeded: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
    },
    maxBudget: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: true,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'JOD',
    },
    attributesPreferred: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.RIDE_REQUEST_STATUS)),
        allowNull: false,
        defaultValue: constants_1.RIDE_REQUEST_STATUS.OPEN,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'RideRequest',
    tableName: 'ride_requests',
    underscored: true,
    timestamps: true,
});
exports.default = RideRequest;
module.exports = RideRequest;
Object.assign(module.exports, { default: RideRequest });
//# sourceMappingURL=RideRequest.js.map