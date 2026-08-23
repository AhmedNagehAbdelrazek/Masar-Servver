const jwt = require('jsonwebtoken');
const { isAccessTokenBlacklisted } = require('../Services/authService');

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
    return next(new Error('AUTH_REQUIRED'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new Error('TOKEN_EXPIRED'));
    }
    return next(new Error('INVALID_TOKEN'));
  }

  if (decoded.type !== 'access') {
    return next(new Error('INVALID_TOKEN_TYPE'));
  }

  try {
    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(new Error('TOKEN_REVOKED'));
    }

    const { User } = require('../Models');
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'status'],
    });

    if (!user) {
      return next(new Error('USER_NOT_FOUND'));
    }
    if (user.status === 'banned' || user.status === 'suspended') {
      return next(new Error('ACCOUNT_SUSPENDED'));
    }

    socket.data.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (err) {
    return next(new Error('AUTH_FAILED'));
  }
}

module.exports = socketAuth;
