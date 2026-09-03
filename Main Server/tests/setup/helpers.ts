import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET: string = process.env.JWT_SECRET || 'test-secret-key-for-jwt';

interface UserLike {
  id: string;
  role: string;
}

interface RefreshTokenResult {
  token: string;
  jti: string;
}

function generateAccessToken(user: UserLike): string {
  return jwt.sign(
    { id: user.id, role: user.role, type: 'access' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateRefreshToken(user: UserLike): RefreshTokenResult {
  const jti: string = crypto.randomUUID();
  return {
    token: jwt.sign(
      { id: user.id, role: user.role, type: 'refresh', jti },
      JWT_SECRET,
      { expiresIn: '7d' }
    ),
    jti,
  };
}

function generateRegistrationToken(phone: string, role: string, countryCode: string): string {
  return jwt.sign(
    { phone, role, countryCode, type: 'registration' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function generateResetToken(phone: string): string {
  return jwt.sign(
    { phone, type: 'reset' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export {
  generateAccessToken,
  generateRefreshToken,
  generateRegistrationToken,
  generateResetToken,
  getAuthHeader,
  JWT_SECRET,
};
export default {
  generateAccessToken,
  generateRefreshToken,
  generateRegistrationToken,
  generateResetToken,
  getAuthHeader,
  JWT_SECRET,
};
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateRegistrationToken,
  generateResetToken,
  getAuthHeader,
  JWT_SECRET,
};
