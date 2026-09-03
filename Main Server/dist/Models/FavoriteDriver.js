"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteDriver = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class FavoriteDriver extends sequelize_1.Model {
}
exports.FavoriteDriver = FavoriteDriver;
FavoriteDriver.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    passengerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'FavoriteDriver',
    tableName: 'favorite_drivers',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['passenger_id', 'driver_id'],
        },
    ],
});
exports.default = FavoriteDriver;
module.exports = FavoriteDriver;
Object.assign(module.exports, { default: FavoriteDriver });
//# sourceMappingURL=FavoriteDriver.js.map