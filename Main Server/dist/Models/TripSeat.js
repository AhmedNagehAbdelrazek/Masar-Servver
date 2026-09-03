"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripSeat = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class TripSeat extends sequelize_1.Model {
}
exports.TripSeat = TripSeat;
TripSeat.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    seatNumber: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    seatType: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.SEAT_TYPE)),
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'TripSeat',
    tableName: 'trip_seats',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            name: 'idx_trip_seats_trip',
            fields: ['trip_id'],
        },
        {
            name: 'idx_trip_seats_unique',
            unique: true,
            fields: ['trip_id', 'seat_number'],
        },
    ],
});
exports.default = TripSeat;
module.exports = TripSeat;
Object.assign(module.exports, { default: TripSeat });
//# sourceMappingURL=TripSeat.js.map