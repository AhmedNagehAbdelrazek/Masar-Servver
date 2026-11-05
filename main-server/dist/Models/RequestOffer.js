"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestOffer = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class RequestOffer extends sequelize_1.Model {
}
exports.RequestOffer = RequestOffer;
RequestOffer.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    requestId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    driverId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    tripId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    offeredFare: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: true,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.REQUEST_OFFER_STATUS)),
        allowNull: false,
        defaultValue: constants_1.REQUEST_OFFER_STATUS.SENT,
    },
    agreedFare: {
        type: sequelize_1.DataTypes.NUMERIC(10, 2),
        allowNull: true,
    },
    bookingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'RequestOffer',
    tableName: 'request_offers',
    underscored: true,
    timestamps: true,
});
exports.default = RequestOffer;
module.exports = RequestOffer;
Object.assign(module.exports, { default: RequestOffer });
//# sourceMappingURL=RequestOffer.js.map