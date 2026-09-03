import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { REQUEST_OFFER_STATUS } from '../config/constants';

export interface RequestOfferAttributes {
  id: string;
  requestId: string;
  driverId: string;
  tripId?: string | null;
  offeredFare?: number | null;
  message?: string | null;
  status: string;
  agreedFare?: number | null;
  bookingId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RequestOfferCreationAttributes extends Optional<RequestOfferAttributes, 'id' | 'tripId' | 'offeredFare' | 'message' | 'status' | 'agreedFare' | 'bookingId' | 'createdAt' | 'updatedAt'> {}

export class RequestOffer extends Model<RequestOfferAttributes, RequestOfferCreationAttributes> implements RequestOfferAttributes {
  declare id: string;
  declare requestId: string;
  declare driverId: string;
  declare tripId?: string | null;
  declare offeredFare?: number | null;
  declare message?: string | null;
  declare status: string;
  declare agreedFare?: number | null;
  declare bookingId?: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

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
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
        },
    message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    status: {
            type: DataTypes.ENUM(...Object.values(REQUEST_OFFER_STATUS)),
            allowNull: false,
            defaultValue: REQUEST_OFFER_STATUS.SENT,
        },
    agreedFare: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(10, 2) as unknown as import('sequelize').DataType,
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

export default RequestOffer;
module.exports = RequestOffer;
Object.assign(module.exports, { default: RequestOffer });
