"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelayEvent = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class DelayEvent extends sequelize_1.Model {
}
exports.DelayEvent = DelayEvent;
DelayEvent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    party: {
        type: sequelize_1.DataTypes.ENUM('driver', 'passenger'),
        allowNull: false,
    },
    delayMinutes: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    reportedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'DelayEvent',
    tableName: 'delay_events',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
exports.default = DelayEvent;
module.exports = DelayEvent;
Object.assign(module.exports, { default: DelayEvent });
//# sourceMappingURL=DelayEvent.js.map