"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { VEHICLE_TYPES } = require('../config/constants');
class Vehicle extends Model {
}
Vehicle.init({
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
    codeNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
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
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    registrationDocBack: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    vehiclePhotoFront: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    vehiclePhotoBack: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
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
    verificationRejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    verificationRejectedAt: {
        type: DataTypes.DATE,
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
}, {
    sequelize,
    modelName: 'Vehicle',
    tableName: 'vehicles',
    underscored: true,
    timestamps: true,
});
module.exports = Vehicle;
//# sourceMappingURL=Vehicle.js.map