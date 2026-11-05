"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Rating extends sequelize_1.Model {
}
exports.Rating = Rating;
Rating.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    raterId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    rateeId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    stars: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    wasLate: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    lateMinutes: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 0,
    },
    review: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        allowNull: true,
    },
    isVisible: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Rating',
    tableName: 'ratings',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
exports.default = Rating;
module.exports = Rating;
Object.assign(module.exports, { default: Rating });
//# sourceMappingURL=Rating.js.map