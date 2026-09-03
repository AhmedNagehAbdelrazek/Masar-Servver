"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripLocation = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class TripLocation extends sequelize_1.Model {
}
exports.TripLocation = TripLocation;
TripLocation.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    lat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: false,
    },
    lng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: false,
    },
    speed: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: true,
    },
    heading: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'TripLocation',
    tableName: 'trip_locations',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            name: 'idx_trip_locations_trip_created',
            fields: ['trip_id', 'createdat'],
        },
    ],
});
exports.default = TripLocation;
module.exports = TripLocation;
Object.assign(module.exports, { default: TripLocation });
//# sourceMappingURL=TripLocation.js.map