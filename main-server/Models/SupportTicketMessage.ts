import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SupportTicketMessageAttributes {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupportTicketMessageCreationAttributes extends Optional<SupportTicketMessageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SupportTicketMessage extends Model<SupportTicketMessageAttributes, SupportTicketMessageCreationAttributes> implements SupportTicketMessageAttributes {
  declare id: string;
  declare ticketId: string;
  declare senderId: string;
  declare message: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

SupportTicketMessage.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    ticketId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    senderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
  },
  {
        sequelize,
        modelName: 'SupportTicketMessage',
        tableName: 'support_ticket_messages',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                name: 'idx_support_ticket_messages_ticket',
                fields: ['ticket_id'],
            },
        ],
    }
);

export default SupportTicketMessage;
module.exports = SupportTicketMessage;
Object.assign(module.exports, { default: SupportTicketMessage });
