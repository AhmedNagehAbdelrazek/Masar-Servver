const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Account deletion requests (spec 010). A request is recorded for admin
 * review — the account is never erased here. Drivers may cancel their own
 * pending request (status → 'cancelled') before review completes.
 */
class DeletionRequest extends Model { }

DeletionRequest.init(
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
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        estimatedCompletion: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reviewNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'DeletionRequest',
        tableName: 'deletion_requests',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                name: 'idx_deletion_requests_user',
                fields: ['user_id'],
            },
            {
                name: 'idx_deletion_requests_status',
                fields: ['status'],
            },
        ],
    }
);

module.exports = DeletionRequest;
