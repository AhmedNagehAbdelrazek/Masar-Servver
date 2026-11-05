import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MESSAGE_TYPE } from '../config/constants';

export interface MessageAttributes {
  id: string;
  senderId: string;
  receiverId?: string | null;
  bookingId?: string | null;
  supportTicketId?: string | null;
  message: string;
  messageType: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt?: Date;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'receiverId' | 'bookingId' | 'supportTicketId' | 'messageType' | 'isRead' | 'readAt' | 'createdAt'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  declare id: string;
  declare senderId: string;
  declare receiverId?: string | null;
  declare bookingId?: string | null;
  declare supportTicketId?: string | null;
  declare message: string;
  declare messageType: string;
  declare isRead: boolean;
  declare readAt?: Date | null;
  declare readonly createdAt?: Date;
}

Message.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    senderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    receiverId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    bookingId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    supportTicketId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    messageType: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: MESSAGE_TYPE.TEXT,
        },
    isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                name: 'idx_messages_booking_created',
                fields: ['booking_id', 'createdat'],
            },
            {
                name: 'idx_messages_ticket_created',
                fields: ['support_ticket_id', 'createdat'],
            },
        ],
    }
);

export default Message;
module.exports = Message;
Object.assign(module.exports, { default: Message });
