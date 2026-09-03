"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatusChange = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class VerificationStatusChange extends sequelize_1.Model {
}
exports.VerificationStatusChange = VerificationStatusChange;
VerificationStatusChange.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    fromStatus: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.VERIFICATION_STATUS)),
        allowNull: true,
    },
    toStatus: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.VERIFICATION_STATUS)),
        allowNull: false,
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    markedFields: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    changedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'VerificationStatusChange',
    tableName: 'verification_status_changes',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
exports.default = VerificationStatusChange;
module.exports = VerificationStatusChange;
Object.assign(module.exports, { default: VerificationStatusChange });
//# sourceMappingURL=VerificationStatusChange.js.map