"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
class Notification extends Model {
}
Notification.init({
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
}, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
module.exports = Notification;
//# sourceMappingURL=Notification.js.map