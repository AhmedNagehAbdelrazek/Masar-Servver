const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class AuditLog extends Model { }

AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tableName: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        recordId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        action: {
            type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
            allowNull: false,
        },
        oldData: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        newData: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        performedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        ipAddress: {
            type: DataTypes.INET,
            allowNull: true,
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'AuditLog',
        tableName: 'audit_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

module.exports = AuditLog;
