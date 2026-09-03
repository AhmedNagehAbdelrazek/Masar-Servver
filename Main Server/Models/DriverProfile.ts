import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { SUBSCRIPTION_TIER } from '../config/constants';

export interface DriverProfileAttributes {
  id: string;
  driverId: string;
  userIdentificationFront?: number | null;
  userIdentificationBack?: number | null;
  linceseFront?: number | null;
  linceseBack?: number | null;
  personalImageWithId?: number | null;
  nationalID?: string | null;
  idVerified?: boolean | null;
  licenseNumber?: string | null;
  licenseExpiry?: Date | null;
  subscriptionTier?: string | null;
  subscriptionExpiresAt?: Date | null;
  totalTrips?: number | null;
  totalEarnings?: number | null;
  responseRate?: number | null;
  punctualityRate?: number | null;
  professionalDriver: boolean;
  bio?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DriverProfileCreationAttributes extends Optional<DriverProfileAttributes, 'id' | 'userIdentificationFront' | 'userIdentificationBack' | 'linceseFront' | 'linceseBack' | 'personalImageWithId' | 'nationalID' | 'idVerified' | 'licenseNumber' | 'licenseExpiry' | 'subscriptionTier' | 'subscriptionExpiresAt' | 'totalTrips' | 'totalEarnings' | 'responseRate' | 'punctualityRate' | 'professionalDriver' | 'bio' | 'createdAt' | 'updatedAt'> {}

export class DriverProfile extends Model<DriverProfileAttributes, DriverProfileCreationAttributes> implements DriverProfileAttributes {
  declare id: string;
  declare driverId: string;
  declare userIdentificationFront?: number | null;
  declare userIdentificationBack?: number | null;
  declare linceseFront?: number | null;
  declare linceseBack?: number | null;
  declare personalImageWithId?: number | null;
  declare nationalID?: string | null;
  declare idVerified?: boolean | null;
  declare licenseNumber?: string | null;
  declare licenseExpiry?: Date | null;
  declare subscriptionTier?: string | null;
  declare subscriptionExpiresAt?: Date | null;
  declare totalTrips?: number | null;
  declare totalEarnings?: number | null;
  declare responseRate?: number | null;
  declare punctualityRate?: number | null;
  declare professionalDriver: boolean;
  declare bio?: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

DriverProfile.init(
  {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
    driverId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
    userIdentificationFront: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    userIdentificationBack: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    linceseFront: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    linceseBack: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    personalImageWithId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    nationalID: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
    idVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
    licenseNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
    licenseExpiry: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    subscriptionTier: {
            type: DataTypes.ENUM(...Object.values(SUBSCRIPTION_TIER)),
            allowNull: true,
            defaultValue: SUBSCRIPTION_TIER.FREE,
        },
    subscriptionExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    totalTrips: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    totalEarnings: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(12, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
            defaultValue: 0,
        },
    responseRate: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(5, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
            defaultValue: 100,
        },
    punctualityRate: {
            type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).NUMERIC(5, 2) as unknown as import('sequelize').DataType,
            allowNull: true,
            defaultValue: null,
        },
    professionalDriver: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'DriverProfile',
        tableName: 'driver_profiles',
        underscored: true,
        timestamps: true,
    }
);

export default DriverProfile;
module.exports = DriverProfile;
Object.assign(module.exports, { default: DriverProfile });
