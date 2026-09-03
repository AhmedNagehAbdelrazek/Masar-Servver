"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverProfile = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class DriverProfile extends sequelize_1.Model {
}
exports.DriverProfile = DriverProfile;
DriverProfile.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    userIdentificationFront: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    userIdentificationBack: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    linceseFront: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    linceseBack: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    personalImageWithId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    nationalID: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    idVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    licenseNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    licenseExpiry: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    subscriptionTier: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.SUBSCRIPTION_TIER)),
        allowNull: true,
        defaultValue: constants_1.SUBSCRIPTION_TIER.FREE,
    },
    subscriptionExpiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    totalTrips: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    totalEarnings: {
        type: sequelize_1.DataTypes.NUMERIC(12, 2),
        allowNull: true,
        defaultValue: 0,
    },
    responseRate: {
        type: sequelize_1.DataTypes.NUMERIC(5, 2),
        allowNull: true,
        defaultValue: 100,
    },
    punctualityRate: {
        type: sequelize_1.DataTypes.NUMERIC(5, 2),
        allowNull: true,
        defaultValue: null,
    },
    professionalDriver: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'DriverProfile',
    tableName: 'driver_profiles',
    underscored: true,
    timestamps: true,
});
exports.default = DriverProfile;
module.exports = DriverProfile;
Object.assign(module.exports, { default: DriverProfile });
//# sourceMappingURL=DriverProfile.js.map