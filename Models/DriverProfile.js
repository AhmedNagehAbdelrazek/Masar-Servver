const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { SUBSCRIPTION_TIER } = require('../config/constants');

class DriverProfile extends Model { }

DriverProfile.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        userIdentificationFront: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
        userIdentificationBack: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
        linceseFront: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
        linceseBack: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
        personalImageWithId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
        idVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        licenseNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        licenseExpiry: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        subscriptionTier: {
            type: DataTypes.ENUM(Object.values(SUBSCRIPTION_TIER)),
            allowNull: true,
            defaultValue: SUBSCRIPTION_TIER.FREE,
        },
        subscriptionExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        totalTrips: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        totalEarnings: {
            type: DataTypes.NUMERIC(12, 2),
            allowNull: true,
            defaultValue: 0,
        },
        responseRate: {
            type: DataTypes.NUMERIC(5, 2),
            allowNull: true,
            defaultValue: 100,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'DriverProfile',
        tableName: 'driver_profiles',
        underscored: true,
        timestamps: true,
    }
);

module.exports = DriverProfile;
