const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class UploadedImage extends Model {}

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
  },
  {
    sequelize,
    modelName: 'UploadedImage',
    tableName: 'uploaded_images',
    underscored: true,
    timestamps: true,
  }
);

module.exports = UploadedImage;
