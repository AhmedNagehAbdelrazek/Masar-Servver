"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    fullName: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
    },
    displayName: {
        type: sequelize_1.DataTypes.STRING(120),
        allowNull: true,
    },
    countryCode: {
        type: sequelize_1.DataTypes.STRING(5),
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(160),
        allowNull: true,
        unique: true,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.ROLES)),
        allowNull: false,
    },
    gender: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.GENDER)),
        allowNull: true,
        defaultValue: constants_1.GENDER.MALE,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    age: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: sequelize_1.DataTypes.DECIMAL(3),
        allowNull: true,
    },
    avatarUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    verificationStatus: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.VERIFICATION_STATUS)),
        allowNull: false,
        defaultValue: constants_1.VERIFICATION_STATUS.UNVERIFIED,
    },
    verificationSubmittedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    verificationRejectedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    verificationRejectionReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    verificationRejectionFields: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
    avgRating: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: sequelize_1.DataTypes.DECIMAL(2, 1),
        defaultValue: 0,
    },
    strikes: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    locale: {
        type: sequelize_1.DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'ar',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.USER_STATUS)),
        allowNull: false,
        defaultValue: constants_1.USER_STATUS.ACTIVE,
    },
    fcmToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    totalBalance: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    isInDebt: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
});
exports.default = User;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
module.exports = User;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
module.exports.default = User;
//# sourceMappingURL=User.js.map