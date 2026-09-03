"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class AuditLog extends sequelize_1.Model {
}
exports.AuditLog = AuditLog;
AuditLog.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tableName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    recordId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    action: {
        type: sequelize_1.DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
        allowNull: false,
    },
    oldData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    newData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    performedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.INET,
        allowNull: true,
    },
    userAgent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
exports.default = AuditLog;
module.exports = AuditLog;
Object.assign(module.exports, { default: AuditLog });
//# sourceMappingURL=AuditLog.js.map