"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { SOS_STATUS, SOS_URGENCY } = require('../config/constants');
class SosEvent extends Model {
}
SosEvent.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    tripId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    lat: {
        type: DataTypes.NUMERIC(10, 8),
        allowNull: false,
    },
    lng: {
        type: DataTypes.NUMERIC(11, 8),
        allowNull: false,
    },
    urgency: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: SOS_URGENCY.HIGH,
    },
    status: {
        type: DataTypes.ENUM(Object.values(SOS_STATUS)),
        allowNull: false,
        defaultValue: SOS_STATUS.PENDING,
    },
    escalationLevel: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    lastAlertAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    acknowledgedBy: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    acknowledgedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    resolvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    resolutionNote: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'SosEvent',
    tableName: 'sos_events',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            name: 'idx_sos_status',
            fields: ['status'],
        },
        {
            name: 'idx_sos_trip',
            fields: ['trip_id'],
        },
        {
            name: 'idx_sos_user',
            fields: ['user_id'],
        },
    ],
});
module.exports = SosEvent;
//# sourceMappingURL=SosEvent.js.map