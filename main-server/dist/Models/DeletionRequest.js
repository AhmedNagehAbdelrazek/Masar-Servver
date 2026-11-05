"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletionRequest = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class DeletionRequest extends sequelize_1.Model {
}
exports.DeletionRequest = DeletionRequest;
DeletionRequest.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    estimatedCompletion: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    reviewNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    reviewedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'DeletionRequest',
    tableName: 'deletion_requests',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_deletion_requests_user',
            fields: ['user_id'],
        },
        {
            name: 'idx_deletion_requests_status',
            fields: ['status'],
        },
    ],
});
exports.default = DeletionRequest;
module.exports = DeletionRequest;
Object.assign(module.exports, { default: DeletionRequest });
//# sourceMappingURL=DeletionRequest.js.map