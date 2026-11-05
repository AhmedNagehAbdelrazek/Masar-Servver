"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassengerProfile = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PassengerProfile extends sequelize_1.Model {
}
exports.PassengerProfile = PassengerProfile;
PassengerProfile.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    passengerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    preferredGender: {
        type: sequelize_1.DataTypes.ENUM('male', 'female', 'any'),
        allowNull: true,
        defaultValue: 'any',
    },
    smokingPreference: {
        type: sequelize_1.DataTypes.ENUM('no_preference', 'non_smoking', 'smoking_allowed'),
        allowNull: true,
        defaultValue: 'no_preference',
    },
    savedRoutes: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
    nationalID: {
        type: sequelize_1.DataTypes.STRING(30),
        field: 'national_id',
        allowNull: true,
    },
    homeAddress: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    emergencyContacts: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
}, {
    sequelize: database_1.default,
    modelName: 'PassengerProfile',
    tableName: 'passenger_profiles',
    underscored: true,
    timestamps: true,
});
exports.default = PassengerProfile;
module.exports = PassengerProfile;
Object.assign(module.exports, { default: PassengerProfile });
//# sourceMappingURL=PassengerProfile.js.map