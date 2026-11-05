"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSetting = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class NotificationSetting extends sequelize_1.Model {
}
exports.NotificationSetting = NotificationSetting;
NotificationSetting.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    notificationType: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    enabledInApp: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    enabledPush: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'NotificationSetting',
    tableName: 'notification_settings',
    underscored: true,
    timestamps: true,
    updatedAt: 'updatedat',
    indexes: [
        {
            name: 'idx_notification_settings_user',
            fields: ['user_id'],
        },
        {
            name: 'uniq_notification_settings_user_type',
            unique: true,
            fields: ['user_id', 'notification_type'],
        },
    ],
});
exports.default = NotificationSetting;
module.exports = NotificationSetting;
Object.assign(module.exports, { default: NotificationSetting });
//# sourceMappingURL=NotificationSetting.js.map