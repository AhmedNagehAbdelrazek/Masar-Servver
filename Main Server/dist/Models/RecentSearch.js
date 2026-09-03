"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentSearch = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class RecentSearch extends sequelize_1.Model {
}
exports.RecentSearch = RecentSearch;
RecentSearch.init({
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
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    destinationCity: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    searchedOn: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: "RecentSearch",
    tableName: "recent_search",
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ["passenger_id", "origin_city", "destination_city"],
        },
        {
            fields: ["passenger_id", "searched_on"],
        },
    ],
});
exports.default = RecentSearch;
module.exports = RecentSearch;
Object.assign(module.exports, { default: RecentSearch });
//# sourceMappingURL=RecentSearch.js.map