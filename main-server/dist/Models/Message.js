"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Message extends sequelize_1.Model {
}
exports.Message = Message;
Message.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    senderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    receiverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    supportTicketId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    messageType: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: constants_1.MESSAGE_TYPE.TEXT,
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Message',
    tableName: 'messages',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            name: 'idx_messages_booking_created',
            fields: ['booking_id', 'createdat'],
        },
        {
            name: 'idx_messages_ticket_created',
            fields: ['support_ticket_id', 'createdat'],
        },
    ],
});
exports.default = Message;
module.exports = Message;
Object.assign(module.exports, { default: Message });
//# sourceMappingURL=Message.js.map