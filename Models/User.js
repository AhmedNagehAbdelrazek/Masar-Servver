const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ROLES } = require('../config/constants');

class User extends Model { }

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(Object.values(ROLES)),
            allowNull: false,
            defaultValue: ROLES.CUSTOMER,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contactInfo: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        profilePictureUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'profile_picture_url',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        }
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
