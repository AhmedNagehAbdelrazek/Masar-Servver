"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteRoute = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class FavoriteRoute extends sequelize_1.Model {
}
exports.FavoriteRoute = FavoriteRoute;
FavoriteRoute.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    passengerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    originCity: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    destinationCity: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    label: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'FavoriteRoute',
    tableName: 'favorite_routes',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['passenger_id', 'origin_city', 'destination_city'],
        },
    ],
});
exports.default = FavoriteRoute;
module.exports = FavoriteRoute;
Object.assign(module.exports, { default: FavoriteRoute });
//# sourceMappingURL=FavoriteRoute.js.map