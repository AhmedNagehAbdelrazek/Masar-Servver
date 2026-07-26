const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { COMPLAINT_STATUS } = require('../config/constants');

class Complaint extends Model { }

Complaint.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        bookingId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        reporterId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        accusedId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        evidenceUrls: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(Object.values(COMPLAINT_STATUS)),
            allowNull: false,
            defaultValue: COMPLAINT_STATUS.OPEN,
        },
        resolution: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resolvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Complaint',
        tableName: 'complaints',
        underscored: true,
        timestamps: true,
    }
);

module.exports = Complaint;
