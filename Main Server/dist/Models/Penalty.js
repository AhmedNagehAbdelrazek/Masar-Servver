"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PENALTY_TYPES } = require('../config/constants');
class Penalty extends Model {
}
Penalty.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    complaintId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    tripId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM(Object.values(PENALTY_TYPES)),
        allowNull: false,
    },
    penaltyType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'general',
    },
    severity: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: 'minor',
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    endsAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    issuedBy: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    isAppealed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    appealReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    appealResolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    createdat: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'Penalty',
    tableName: 'penalties',
    underscored: true,
    timestamps: false,
});
module.exports = Penalty;
//# sourceMappingURL=Penalty.js.map