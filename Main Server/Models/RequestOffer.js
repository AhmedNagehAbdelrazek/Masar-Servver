const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { REQUEST_OFFER_STATUS } = require('../config/constants');

class RequestOffer extends Model { }

RequestOffer.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        driverId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        tripId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        offeredFare: {
            type: DataTypes.NUMERIC(10, 2),
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(Object.values(REQUEST_OFFER_STATUS)),
            allowNull: false,
            defaultValue: REQUEST_OFFER_STATUS.SENT,
        },
        agreedFare: {
            type: DataTypes.NUMERIC(10, 2),
            allowNull: true,
        },
        bookingId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'RequestOffer',
        tableName: 'request_offers',
        underscored: true,
        timestamps: true,
    }
);

module.exports = RequestOffer;
