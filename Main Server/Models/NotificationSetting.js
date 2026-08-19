const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class NotificationSetting extends Model { }

NotificationSetting.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        notificationType: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        enabledInApp: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        enabledPush: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
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
    }
);

module.exports = NotificationSetting;
