import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DelayEventAttributes {
  id: string;
  bookingId: string;
  party: string;
  delayMinutes: number;
  reason?: string | null;
  reportedBy: string;
  createdAt?: Date;
}

export interface DelayEventCreationAttributes extends Optional<DelayEventAttributes, 'id' | 'reason' | 'createdAt'> {}

export class DelayEvent extends Model<DelayEventAttributes, DelayEventCreationAttributes> implements DelayEventAttributes {
  declare id: string;
  declare bookingId: string;
  declare party: string;
  declare delayMinutes: number;
  declare reason?: string | null;
  declare reportedBy: string;
  declare readonly createdAt?: Date;
}

DelayEvent.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    bookingId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    party: {
            type: DataTypes.ENUM('driver', 'passenger'),
            allowNull: false,
        },
    delayMinutes: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    reportedBy: {
            type: DataTypes.UUID,
            allowNull: false,
        },
  },
  {
        sequelize,
        modelName: 'DelayEvent',
        tableName: 'delay_events',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

export default DelayEvent;
module.exports = DelayEvent;
Object.assign(module.exports, { default: DelayEvent });
