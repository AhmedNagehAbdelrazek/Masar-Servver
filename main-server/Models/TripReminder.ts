import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TripReminderAttributes {
  id: string;
  tripId: string;
  userId: string;
  kind: string;
  occurrenceAt: Date;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripReminderCreationAttributes extends Optional<
  TripReminderAttributes,
  'id' | 'sentAt' | 'createdAt' | 'updatedAt'
> {}

export class TripReminder
  extends Model<TripReminderAttributes, TripReminderCreationAttributes>
  implements TripReminderAttributes
{
  declare id: string;
  declare tripId: string;
  declare userId: string;
  declare kind: string;
  declare occurrenceAt: Date;
  declare sentAt?: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

TripReminder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tripId: {
      type: DataTypes.UUID,
      field: 'trip_id',
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: false,
    },
    kind: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    occurrenceAt: {
      type: DataTypes.DATE,
      field: 'occurrence_at',
      allowNull: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at',
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'TripReminder',
    tableName: 'trip_reminders',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        name: 'uniq_trip_reminders_trip_user_kind_occurrence',
        unique: true,
        fields: ['trip_id', 'user_id', 'kind', 'occurrence_at'],
      },
      {
        name: 'idx_trip_reminders_trip_occurrence',
        fields: ['trip_id', 'occurrence_at'],
      },
    ],
  },
);

export default TripReminder;
module.exports = TripReminder;
Object.assign(module.exports, { default: TripReminder });
