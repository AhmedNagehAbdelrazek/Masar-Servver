const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function getAuthToken(overrides = {}) {
  const payload = {
    id: 1,
    username: overrides.username || 'admin',
    globalRole: overrides.role || 'admin',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function getAuthHeader(token) {
  return { Authorization: `Bearer ${token || getAuthToken()}` };
}

module.exports = {
  getAuthToken,
  getAuthHeader,
};
