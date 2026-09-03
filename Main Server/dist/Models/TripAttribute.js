"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripAttribute = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class TripAttribute extends sequelize_1.Model {
}
exports.TripAttribute = TripAttribute;
TripAttribute.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    attrKey: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
    attrValue: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'TripAttribute',
    tableName: 'trip_attributes',
    underscored: true,
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['trip_id', 'attr_key'],
        },
    ],
});
exports.default = TripAttribute;
module.exports = TripAttribute;
Object.assign(module.exports, { default: TripAttribute });
//# sourceMappingURL=TripAttribute.js.map