const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { MESSAGE_TYPE } = require('../config/constants');

class Message extends Model { }

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
        tripId: {
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
                name: 'idx_messages_trip_created',
                fields: ['trip_id', 'createdat'],
            },
            {
                name: 'idx_messages_ticket_created',
                fields: ['support_ticket_id', 'createdat'],
            },
        ],
    }
);

module.exports = Message;
