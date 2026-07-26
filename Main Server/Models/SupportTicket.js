const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { TICKET_STATUS, TICKET_PRIORITY } = require('../config/constants');

class SupportTicket extends Model { }

SupportTicket.init(
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
        category: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM(Object.values(TICKET_PRIORITY)),
            allowNull: true,
            defaultValue: TICKET_PRIORITY.MEDIUM,
        },
        status: {
            type: DataTypes.ENUM(Object.values(TICKET_STATUS)),
            allowNull: true,
            defaultValue: TICKET_STATUS.OPEN,
        },
        assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        resolutionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'SupportTicket',
        tableName: 'support_tickets',
        underscored: true,
        timestamps: true,
    }
);

module.exports = SupportTicket;
