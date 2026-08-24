const jwt = require('jsonwebtoken');
const { isAccessTokenBlacklisted } = require('../Services/authService');
const { authError } = require('../utils/socketAck');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Socket.IO connection middleware. Mirrors `middlewares/protect.js` for the
 * REST API: the client must present an `access` JWT in
 * `socket.handshake.auth.token` (or `?token=` query param). The token is
 * verified against JWT_SECRET, checked against the logout blacklist, and the
 * authenticated user must still exist and be active.
 */
async function socketAuth(socket, next) {
  const token =
    (socket.handshake.auth && socket.handshake.auth.token) ||
    (socket.handshake.query && socket.handshake.query.token);

  if (!token) {
    return next(authError('AUTH_REQUIRED', 'Authentication token is required.'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(authError('TOKEN_EXPIRED', 'Access token has expired.'));
    }
    return next(authError('INVALID_TOKEN', 'Invalid access token.'));
  }

  if (decoded.type !== 'access') {
    return next(authError('INVALID_TOKEN_TYPE', 'An access token is required.'));
  }

  try {
    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(authError('TOKEN_REVOKED', 'Access token has been revoked.'));
    }

    const { User } = require('../Models');
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'status'],
    });

    if (!user) {
      return next(authError('USER_NOT_FOUND', 'User no longer exists.'));
    }
    if (user.status === 'banned' || user.status === 'suspended') {
      return next(authError('ACCOUNT_SUSPENDED', 'Account is banned or suspended.'));
    }

    socket.data.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (err) {
    return next(authError('AUTH_FAILED', 'Authentication failed.'));
  }
}

module.exports = socketAuth;
