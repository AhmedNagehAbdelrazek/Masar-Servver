"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
class SupportTicketMessage extends Model {
}
SupportTicketMessage.init({
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
}, {
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
});
module.exports = SupportTicketMessage;
//# sourceMappingURL=SupportTicketMessage.js.map