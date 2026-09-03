"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Notification extends sequelize_1.Model {
}
exports.Notification = Notification;
Notification.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    body: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    data: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    sentVia: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: ['push'],
    },
}, {
    sequelize: database_1.default,
    modelName: 'Notification',
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
exports.default = Notification;
module.exports = Notification;
Object.assign(module.exports, { default: Notification });
//# sourceMappingURL=Notification.js.map