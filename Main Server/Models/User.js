const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ROLES, GENDER, USER_STATUS, VERIFICATION_STATUS } = require('../config/constants');

class User extends Model { }

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        displayName: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        countryCode: {
            type: DataTypes.STRING(5),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(160),
            allowNull: true,
            unique: true,
        },
        role: {
            type: DataTypes.ENUM(Object.values(ROLES)),
            allowNull: false,
        },
        gender: {
            type: DataTypes.ENUM(Object.values(GENDER)),
            allowNull: true,
            defaultValue: GENDER.MALE,
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        age: {
            type: DataTypes.NUMERIC(3),
            allowNull: true,
        },
        avatarUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        verificationStatus: {
            type: DataTypes.ENUM(Object.values(VERIFICATION_STATUS)),
            allowNull: false,
            defaultValue: VERIFICATION_STATUS.UNVERIFIED,
        },
        verificationSubmittedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verificationRejectedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verificationRejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        verificationRejectionFields: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        avgRating: {
            type: DataTypes.NUMERIC(2, 1),
            defaultValue: 0,
        },
        strikes: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        locale: {
            type: DataTypes.STRING(5),
            allowNull: false,
            defaultValue: 'ar',
        },
        status: {
            type: DataTypes.ENUM(Object.values(USER_STATUS)),
            allowNull: false,
            defaultValue: USER_STATUS.ACTIVE,
        },
        fcmToken: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        totalBalance: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        isInDebt: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
        timestamps: true,
    }
);

module.exports = User;
