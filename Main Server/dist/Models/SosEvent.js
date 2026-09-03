"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SosEvent = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class SosEvent extends sequelize_1.Model {
}
exports.SosEvent = SosEvent;
SosEvent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    lat: {
        type: sequelize_1.DataTypes.NUMERIC(10, 8),
        allowNull: false,
    },
    lng: {
        type: sequelize_1.DataTypes.NUMERIC(11, 8),
        allowNull: false,
    },
    urgency: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: constants_1.SOS_URGENCY.HIGH,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.SOS_STATUS)),
        allowNull: false,
        defaultValue: constants_1.SOS_STATUS.PENDING,
    },
    escalationLevel: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    lastAlertAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    acknowledgedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    acknowledgedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    resolvedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    resolutionNote: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    resolvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
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
exports.default = SosEvent;
module.exports = SosEvent;
Object.assign(module.exports, { default: SosEvent });
//# sourceMappingURL=SosEvent.js.map