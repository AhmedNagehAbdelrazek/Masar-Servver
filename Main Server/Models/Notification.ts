import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: unknown | null;
  isRead?: boolean | null;
  sentVia?: string[] | null;
  createdAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'data' | 'isRead' | 'sentVia' | 'createdAt'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: string;
  declare userId: string;
  declare type: string;
  declare title: string;
  declare body: string;
  declare data?: unknown | null;
  declare isRead?: boolean | null;
  declare sentVia?: string[] | null;
  declare readonly createdAt?: Date;
}

Notification.init(
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
    type: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
    title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    body: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    data: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
    isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    sentVia: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: ['push'],
        },
  },
  {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

export default Notification;
module.exports = Notification;
Object.assign(module.exports, { default: Notification });
