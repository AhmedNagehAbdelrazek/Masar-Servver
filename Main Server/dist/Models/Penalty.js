"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Penalty = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Penalty extends sequelize_1.Model {
}
exports.Penalty = Penalty;
Penalty.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    complaintId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.PENALTY_TYPES)),
        allowNull: false,
    },
    penaltyType: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'general',
    },
    severity: {
        type: sequelize_1.DataTypes.STRING(15),
        allowNull: false,
        defaultValue: 'minor',
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    details: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    startsAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    endsAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    issuedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    isAppealed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    appealReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    appealResolvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdat: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Penalty',
    tableName: 'penalties',
    underscored: true,
    timestamps: false,
});
exports.default = Penalty;
module.exports = Penalty;
Object.assign(module.exports, { default: Penalty });
//# sourceMappingURL=Penalty.js.map