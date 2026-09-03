import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { VEHICLE_TYPES } from '../config/constants';

export interface VehicleAttributes {
  id: string;
  driverId: string;
  manufacturer: string;
  model: string;
  vehicleType: string;
  modelYear?: number | null;
  plateNumber: string;
  codeNumber?: string | null;
  color?: string | null;
  seats: number;
  registrationDocFront?: number | null;
  registrationDocBack?: number | null;
  vehiclePhotoFront?: number | null;
  vehiclePhotoBack?: number | null;
  isVerified: boolean;
  verificationNotes?: string | null;
  verificationRejectionReason?: string | null;
  verificationRejectedAt?: Date | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VehicleCreationAttributes extends Optional<VehicleAttributes, 'id' | 'modelYear' | 'codeNumber' | 'color' | 'registrationDocFront' | 'registrationDocBack' | 'vehiclePhotoFront' | 'vehiclePhotoBack' | 'isVerified' | 'verificationNotes' | 'verificationRejectionReason' | 'verificationRejectedAt' | 'verifiedBy' | 'verifiedAt' | 'createdAt' | 'updatedAt'> {}

export class Vehicle extends Model<VehicleAttributes, VehicleCreationAttributes> implements VehicleAttributes {
  declare id: string;
  declare driverId: string;
  declare manufacturer: string;
  declare model: string;
  declare vehicleType: string;
  declare modelYear?: number | null;
  declare plateNumber: string;
  declare codeNumber?: string | null;
  declare color?: string | null;
  declare seats: number;
  declare registrationDocFront?: number | null;
  declare registrationDocBack?: number | null;
  declare vehiclePhotoFront?: number | null;
  declare vehiclePhotoBack?: number | null;
  declare isVerified: boolean;
  declare verificationNotes?: string | null;
  declare verificationRejectionReason?: string | null;
  declare verificationRejectedAt?: Date | null;
  declare verifiedBy?: string | null;
  declare verifiedAt?: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Vehicle.init(
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
    manufacturer: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
    model: {
            type: DataTypes.STRING(80),
            allowNull: false,
        },
    vehicleType: {
            type: DataTypes.ENUM(...Object.values(VEHICLE_TYPES)),
            allowNull: false,
        },
    modelYear: {
            type: DataTypes.SMALLINT,
            allowNull: true,
        },
    plateNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
    codeNumber: { // the plate code number
            type: DataTypes.STRING(20),
            allowNull: true,
        },
    color: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
    seats: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    registrationDocFront: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    registrationDocBack: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    vehiclePhotoFront: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    vehiclePhotoBack: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'uploaded_images',
                key: 'id',
            },
        },
    isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    verificationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    verificationRejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    verificationRejectedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
        sequelize,
        modelName: 'Vehicle',
        tableName: 'vehicles',
        underscored: true,
        timestamps: true,
    }
);

export default Vehicle;
module.exports = Vehicle;
Object.assign(module.exports, { default: Vehicle });
