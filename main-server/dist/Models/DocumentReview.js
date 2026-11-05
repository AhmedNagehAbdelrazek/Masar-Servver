"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentReview = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class DocumentReview extends sequelize_1.Model {
}
exports.DocumentReview = DocumentReview;
DocumentReview.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    documentKey: {
        type: sequelize_1.DataTypes.STRING(40),
        allowNull: false,
    },
    decision: {
        type: sequelize_1.DataTypes.ENUM('approved', 'rejected'),
        allowNull: false,
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    decidedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    decidedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
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
});
exports.default = DocumentReview;
module.exports = DocumentReview;
Object.assign(module.exports, { default: DocumentReview });
//# sourceMappingURL=DocumentReview.js.map