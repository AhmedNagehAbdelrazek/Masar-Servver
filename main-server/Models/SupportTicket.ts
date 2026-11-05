import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TICKET_STATUS, TICKET_PRIORITY } from '../config/constants';

export interface SupportTicketAttributes {
  id: string;
  userId: string;
  category: string;
  subject: string;
  description: string;
  priority?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  referenceCode?: string | null;
  bookingId?: string | null;
  tripId?: string | null;
  resolutionNotes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupportTicketCreationAttributes extends Optional<SupportTicketAttributes, 'id' | 'priority' | 'status' | 'assignedTo' | 'referenceCode' | 'bookingId' | 'tripId' | 'resolutionNotes' | 'createdAt' | 'updatedAt'> {}

export class SupportTicket extends Model<SupportTicketAttributes, SupportTicketCreationAttributes> implements SupportTicketAttributes {
  declare id: string;
  declare userId: string;
  declare category: string;
  declare subject: string;
  declare description: string;
  declare priority?: string | null;
  declare status?: string | null;
  declare assignedTo?: string | null;
  declare referenceCode?: string | null;
  declare bookingId?: string | null;
  declare tripId?: string | null;
  declare resolutionNotes?: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

SupportTicket.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    category: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
    subject: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    priority: {
            type: DataTypes.ENUM(...Object.values(TICKET_PRIORITY)),
            allowNull: true,
            defaultValue: TICKET_PRIORITY.MEDIUM,
        },
    status: {
            type: DataTypes.ENUM(...Object.values(TICKET_STATUS)),
            allowNull: true,
            defaultValue: TICKET_STATUS.OPEN,
        },
    assignedTo: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    referenceCode: {
            type: DataTypes.STRING(12),
            allowNull: true,
            unique: true,
        },
    bookingId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    tripId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    resolutionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'SupportTicket',
        tableName: 'support_tickets',
        underscored: true,
        timestamps: true,
    }
);

export default SupportTicket;
module.exports = SupportTicket;
Object.assign(module.exports, { default: SupportTicket });
