import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationSettingAttributes {
  id: string;
  userId: string;
  notificationType: string;
  enabledInApp: boolean;
  enabledPush: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationSettingCreationAttributes extends Optional<NotificationSettingAttributes, 'id' | 'enabledInApp' | 'enabledPush' | 'createdAt' | 'updatedAt'> {}

export class NotificationSetting extends Model<NotificationSettingAttributes, NotificationSettingCreationAttributes> implements NotificationSettingAttributes {
  declare id: string;
  declare userId: string;
  declare notificationType: string;
  declare enabledInApp: boolean;
  declare enabledPush: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

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

export default NotificationSetting;
module.exports = NotificationSetting;
Object.assign(module.exports, { default: NotificationSetting });
