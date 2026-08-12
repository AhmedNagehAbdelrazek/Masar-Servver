const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { VERIFICATION_STATUS } = require('../config/constants');

const VERIFICATION_STATUS_VALUES = Object.values(VERIFICATION_STATUS);

class VerificationStatusChange extends Model { }

VerificationStatusChange.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        fromStatus: {
            type: DataTypes.ENUM(...VERIFICATION_STATUS_VALUES),
            allowNull: true,
        },
        toStatus: {
            type: DataTypes.ENUM(...VERIFICATION_STATUS_VALUES),
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        markedFields: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        changedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'VerificationStatusChange',
        tableName: 'verification_status_changes',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

module.exports = VerificationStatusChange;
