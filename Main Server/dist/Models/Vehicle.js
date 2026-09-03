"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vehicle = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Vehicle extends sequelize_1.Model {
}
exports.Vehicle = Vehicle;
Vehicle.init({
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
    manufacturer: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    model: {
        type: sequelize_1.DataTypes.STRING(80),
        allowNull: false,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.VEHICLE_TYPES)),
        allowNull: false,
    },
    modelYear: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: true,
    },
    plateNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    codeNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    color: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    seats: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    registrationDocFront: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    registrationDocBack: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    vehiclePhotoFront: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    vehiclePhotoBack: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'uploaded_images',
            key: 'id',
        },
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    verificationNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    verificationRejectionReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    verificationRejectedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    verifiedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Vehicle',
    tableName: 'vehicles',
    underscored: true,
    timestamps: true,
});
exports.default = Vehicle;
module.exports = Vehicle;
Object.assign(module.exports, { default: Vehicle });
//# sourceMappingURL=Vehicle.js.map