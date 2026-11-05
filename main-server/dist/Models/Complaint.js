"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Complaint = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Complaint extends sequelize_1.Model {
}
exports.Complaint = Complaint;
Complaint.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    reporterId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    accusedId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    evidenceUrls: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.COMPLAINT_STATUS)),
        allowNull: false,
        defaultValue: constants_1.COMPLAINT_STATUS.OPEN,
    },
    resolution: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    resolvedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    resolvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Complaint',
    tableName: 'complaints',
    underscored: true,
    timestamps: true,
});
exports.default = Complaint;
module.exports = Complaint;
Object.assign(module.exports, { default: Complaint });
//# sourceMappingURL=Complaint.js.map