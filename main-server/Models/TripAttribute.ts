import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TripAttributeAttributes {
  id: string;
  tripId: string;
  attrKey: string;
  attrValue: string;
}

export interface TripAttributeCreationAttributes extends Optional<TripAttributeAttributes, 'id'> {}

export class TripAttribute extends Model<TripAttributeAttributes, TripAttributeCreationAttributes> implements TripAttributeAttributes {
  declare id: string;
  declare tripId: string;
  declare attrKey: string;
  declare attrValue: string;
}

TripAttribute.init(
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
    attrKey: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
    attrValue: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
  },
  {
        sequelize,
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
    }
);

export default TripAttribute;
module.exports = TripAttribute;
Object.assign(module.exports, { default: TripAttribute });
