"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketMessage = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class SupportTicketMessage extends sequelize_1.Model {
}
exports.SupportTicketMessage = SupportTicketMessage;
SupportTicketMessage.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    ticketId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    senderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'SupportTicketMessage',
    tableName: 'support_ticket_messages',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_support_ticket_messages_ticket',
            fields: ['ticket_id'],
        },
    ],
});
exports.default = SupportTicketMessage;
module.exports = SupportTicketMessage;
Object.assign(module.exports, { default: SupportTicketMessage });
//# sourceMappingURL=SupportTicketMessage.js.map