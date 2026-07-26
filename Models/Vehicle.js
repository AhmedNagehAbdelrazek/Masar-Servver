const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { VEHICLE_TYPES } = require('../config/constants');

class Vehicle extends Model { }

Vehicle.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        manufacturer: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        vehicleType: {
            type: DataTypes.ENUM(Object.values(VEHICLE_TYPES)),
            allowNull: false,
        },
        modelYear: {
            type: DataTypes.SMALLINT,
            allowNull: true,
        },
        plateNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        color: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        seats: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        registrationDocFront: {
            type: DataTypes.NUMERIC,
            allowNull: true,
        },
        registrationDocBack: {
            type: DataTypes.NUMERIC,
            allowNull: true,
        },
        vehiclePhotoFront: {
            type: DataTypes.NUMERIC,
            allowNull: true,
        },
        vehiclePhotoBack: {
            type: DataTypes.NUMERIC,
            allowNull: true,
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        verificationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Vehicle',
        tableName: 'vehicles',
        underscored: true,
        timestamps: true,
    }
);

module.exports = Vehicle;
