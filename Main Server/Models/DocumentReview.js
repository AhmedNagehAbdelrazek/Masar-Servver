const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class DocumentReview extends Model { }

DocumentReview.init(
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
        documentKey: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        decision: {
            type: DataTypes.ENUM('approved', 'rejected'),
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        decidedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        decidedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'DocumentReview',
        tableName: 'document_reviews',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['driver_id', 'document_key'],
            },
            {
                fields: ['driver_id'],
            },
        ],
    }
);

module.exports = DocumentReview;
