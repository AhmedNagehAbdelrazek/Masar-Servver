import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PassengerProfileAttributes {
  id: string;
  passengerId: string;
  preferredGender?: string | null;
  smokingPreference?: string | null;
  savedRoutes?: unknown | null;
  nationalID?: string | null;
  homeAddress?: string | null;
  emergencyContacts?: unknown | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PassengerProfileCreationAttributes extends Optional<PassengerProfileAttributes, 'id' | 'preferredGender' | 'smokingPreference' | 'savedRoutes' | 'nationalID' | 'homeAddress' | 'emergencyContacts' | 'createdAt' | 'updatedAt'> {}

export class PassengerProfile extends Model<PassengerProfileAttributes, PassengerProfileCreationAttributes> implements PassengerProfileAttributes {
  declare id: string;
  declare passengerId: string;
  declare preferredGender?: string | null;
  declare smokingPreference?: string | null;
  declare savedRoutes?: unknown | null;
  declare nationalID?: string | null;
  declare homeAddress?: string | null;
  declare emergencyContacts?: unknown | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

PassengerProfile.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    passengerId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
    preferredGender: {
            type: DataTypes.ENUM('male', 'female', 'any'),
            allowNull: true,
            defaultValue: 'any',
        },
    smokingPreference: {
            type: DataTypes.ENUM('no_preference', 'non_smoking', 'smoking_allowed'),
            allowNull: true,
            defaultValue: 'no_preference',
        },
    savedRoutes: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
    nationalID: {
            type: DataTypes.STRING(30),
            field: 'national_id',
            allowNull: true,
        },
    homeAddress: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    emergencyContacts: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
  },
  {
        sequelize,
        modelName: 'PassengerProfile',
        tableName: 'passenger_profiles',
        underscored: true,
        timestamps: true,
    }
);

export default PassengerProfile;
module.exports = PassengerProfile;
Object.assign(module.exports, { default: PassengerProfile });
