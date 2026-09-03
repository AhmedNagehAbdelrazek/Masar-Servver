"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicket = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class SupportTicket extends sequelize_1.Model {
}
exports.SupportTicket = SupportTicket;
SupportTicket.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.TICKET_PRIORITY)),
        allowNull: true,
        defaultValue: constants_1.TICKET_PRIORITY.MEDIUM,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.TICKET_STATUS)),
        allowNull: true,
        defaultValue: constants_1.TICKET_STATUS.OPEN,
    },
    assignedTo: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    referenceCode: {
        type: sequelize_1.DataTypes.STRING(12),
        allowNull: true,
        unique: true,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    resolutionNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'SupportTicket',
    tableName: 'support_tickets',
    underscored: true,
    timestamps: true,
});
exports.default = SupportTicket;
module.exports = SupportTicket;
Object.assign(module.exports, { default: SupportTicket });
//# sourceMappingURL=SupportTicket.js.map