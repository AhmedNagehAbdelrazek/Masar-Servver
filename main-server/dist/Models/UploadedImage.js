"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadedImage = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class UploadedImage extends sequelize_1.Model {
}
exports.UploadedImage = UploadedImage;
UploadedImage.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    hash: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false,
        unique: true,
    },
    url: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    filename: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    mimetype: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    size: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    provider: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'UploadedImage',
    tableName: 'uploaded_images',
    underscored: true,
    timestamps: true,
});
exports.default = UploadedImage;
module.exports = UploadedImage;
Object.assign(module.exports, { default: UploadedImage });
//# sourceMappingURL=UploadedImage.js.map