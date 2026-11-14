import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TripEventAttributes {
  id: string;
  tripId: string;
  bookingId?: string | null;
  passengerId?: string | null;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  details?: unknown | null;
  occurredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripEventCreationAttributes extends Optional<TripEventAttributes,
  'id' | 'bookingId' | 'passengerId' | 'fromStatus' | 'toStatus' | 'actorId' | 'actorRole' | 'details' | 'occurredAt' | 'createdAt' | 'updatedAt'
> {}

export class TripEvent extends Model<TripEventAttributes, TripEventCreationAttributes> implements TripEventAttributes {
  declare id: string;
  declare tripId: string;
  declare bookingId?: string | null;
  declare passengerId?: string | null;
  declare eventType: string;
  declare fromStatus?: string | null;
  declare toStatus?: string | null;
  declare actorId?: string | null;
  declare actorRole?: string | null;
  declare details?: unknown | null;
  declare occurredAt?: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

TripEvent.init(
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
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    passengerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    eventType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fromStatus: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    toStatus: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    actorRole: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'TripEvent',
    tableName: 'trip_events',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'idx_trip_events_trip_time', fields: ['trip_id', 'occurred_at'] },
      { name: 'idx_trip_events_booking', fields: ['booking_id'] },
      { name: 'idx_trip_events_passenger', fields: ['passenger_id'] },
      { name: 'idx_trip_events_type', fields: ['event_type'] },
    ],
  }
);

export default TripEvent;
module.exports = TripEvent;
Object.assign(module.exports, { default: TripEvent });
