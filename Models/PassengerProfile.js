const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { GENDER } = require('../config/constants');

class PassengerProfile extends Model { }

PassengerProfile.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        passengerId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        preferredGender: {
            type: DataTypes.ENUM('male', 'female', 'any'),
            allowNull: true,
            defaultValue: 'any',
        },
        smokingPreference: {
            type: DataTypes.ENUM('no_preference', 'non_smoking', 'smoking_allowed'),
            allowNull: true,
            defaultValue: 'no_preference',
        },
        savedRoutes: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        emergencyContacts: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        sequelize,
        modelName: 'PassengerProfile',
        tableName: 'passenger_profiles',
        underscored: true,
        timestamps: true,
    }
);

module.exports = PassengerProfile;
