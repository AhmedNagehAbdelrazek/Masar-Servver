import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ROLES, GENDER, USER_STATUS, VERIFICATION_STATUS } from '../config/constants';

export interface UserAttributes {
  id: string;
  fullName?: string | null;
  displayName?: string | null;
  countryCode?: string | null;
  phone: string;
  email?: string | null;
  role: string;
  gender?: string;
  passwordHash: string;
  age?: number | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  verificationStatus: string;
  verificationSubmittedAt?: Date | null;
  verificationRejectedAt?: Date | null;
  verificationRejectionReason?: string | null;
  verificationRejectionFields?: unknown;
  avgRating?: number;
  strikes: number;
  locale: string;
  status: string;
  fcmToken?: string | null;
  lastLoginAt?: Date | null;
  totalBalance: number;
  isInDebt: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'fullName' | 'displayName' | 'countryCode' | 'email' | 'gender' | 'age' | 'avatarUrl' | 'isVerified' | 'verificationStatus' | 'verificationSubmittedAt' | 'verificationRejectedAt' | 'verificationRejectionReason' | 'verificationRejectionFields' | 'avgRating' | 'strikes' | 'locale' | 'status' | 'fcmToken' | 'lastLoginAt' | 'totalBalance' | 'isInDebt'
> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare fullName?: string | null;
  declare displayName?: string | null;
  declare countryCode?: string | null;
  declare phone: string;
  declare email?: string | null;
  declare role: string;
  declare gender?: string;
  declare passwordHash: string;
  declare age?: number | null;
  declare avatarUrl?: string | null;
  declare isVerified: boolean;
  declare verificationStatus: string;
  declare verificationSubmittedAt?: Date | null;
  declare verificationRejectedAt?: Date | null;
  declare verificationRejectionReason?: string | null;
  declare verificationRejectionFields?: unknown;
  declare avgRating?: number;
  declare strikes: number;
  declare locale: string;
  declare status: string;
  declare fcmToken?: string | null;
  declare lastLoginAt?: Date | null;
  declare totalBalance: number;
  declare isInDebt: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    displayName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(GENDER)),
      allowNull: true,
      defaultValue: GENDER.MALE,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    age: {
      type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown; NUMERIC: (a?: number, b?: number) => unknown }).DECIMAL(3) as unknown as import('sequelize').DataType,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verificationStatus: {
      type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
      allowNull: false,
      defaultValue: VERIFICATION_STATUS.UNVERIFIED,
    },
    verificationSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationRejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationRejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verificationRejectionFields: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    avgRating: {
      type: (DataTypes as unknown as { DECIMAL: (a?: number, b?: number) => unknown }).DECIMAL(2, 1) as unknown as import('sequelize').DataType,
      defaultValue: 0,
    },
    strikes: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
    locale: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'ar',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(USER_STATUS)),
      allowNull: false,
      defaultValue: USER_STATUS.ACTIVE,
    },
    fcmToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    isInDebt: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
  }
);

export default User;
module.exports = User;
Object.assign(module.exports, { default: User });
