"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripStop = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class TripStop extends sequelize_1.Model {
}
exports.TripStop = TripStop;
TripStop.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    stopOrder: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    stopName: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
    },
    city: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    lat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    lng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: true,
    },
    stopLat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: true,
    },
    stopLng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: true,
    },
    stopType: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.STOP_TYPE)),
        allowNull: true,
    },
    estimatedArrival: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
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
});
exports.default = TripStop;
module.exports = TripStop;
Object.assign(module.exports, { default: TripStop });
//# sourceMappingURL=TripStop.js.map