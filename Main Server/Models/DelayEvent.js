const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class DelayEvent extends Model { }

DelayEvent.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        bookingId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        party: {
            type: DataTypes.ENUM('driver', 'passenger'),
            allowNull: false,
        },
        delayMinutes: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reportedBy: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'DelayEvent',
        tableName: 'delay_events',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

module.exports = DelayEvent;
