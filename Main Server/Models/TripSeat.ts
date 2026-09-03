import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { SEAT_TYPE } from '../config/constants';

export interface TripSeatAttributes {
  id: string;
  tripId: string;
  seatNumber: number;
  seatType: string;
  createdAt?: Date;
}

export interface TripSeatCreationAttributes extends Optional<TripSeatAttributes, 'id' | 'createdAt'> {}

export class TripSeat extends Model<TripSeatAttributes, TripSeatCreationAttributes> implements TripSeatAttributes {
  declare id: string;
  declare tripId: string;
  declare seatNumber: number;
  declare seatType: string;
  declare readonly createdAt?: Date;
}

TripSeat.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    tripId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    seatNumber: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    seatType: {
            type: DataTypes.ENUM(...Object.values(SEAT_TYPE)),
            allowNull: false,
        },
  },
  {
        sequelize,
        modelName: 'TripSeat',
        tableName: 'trip_seats',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            {
                name: 'idx_trip_seats_trip',
                fields: ['trip_id'],
            },
            {
                name: 'idx_trip_seats_unique',
                unique: true,
                fields: ['trip_id', 'seat_number'],
            },
        ],
    }
);

export default TripSeat;
module.exports = TripSeat;
Object.assign(module.exports, { default: TripSeat });
