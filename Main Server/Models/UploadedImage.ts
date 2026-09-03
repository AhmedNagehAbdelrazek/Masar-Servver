import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UploadedImageAttributes {
  id: number;
  hash: string;
  url: string;
  filename: string;
  mimetype: string;
  size?: number | null;
  provider?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UploadedImageCreationAttributes extends Optional<UploadedImageAttributes, 'id' | 'size' | 'provider' | 'createdAt' | 'updatedAt'> {}

export class UploadedImage extends Model<UploadedImageAttributes, UploadedImageCreationAttributes> implements UploadedImageAttributes {
  declare id: number;
  declare hash: string;
  declare url: string;
  declare filename: string;
  declare mimetype: string;
  declare size?: number | null;
  declare provider?: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

UploadedImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    filename: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    provider: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UploadedImage',
    tableName: 'uploaded_images',
    underscored: true,
    timestamps: true,
  }
);

export default UploadedImage;
module.exports = UploadedImage;
Object.assign(module.exports, { default: UploadedImage });
