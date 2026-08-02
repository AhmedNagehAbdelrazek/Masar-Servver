const jwt = require('jsonwebtoken');
const { ApiErrors } = require('../utils/ApiError');
const { isAccessTokenBlacklisted } = require('../Services/authService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiErrors.unauthorized('Access denied. No token provided.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'access') {
      return next(ApiErrors.unauthorized('Invalid token type'));
    }

    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(ApiErrors.unauthorized('Token has been revoked. Please login again.'));
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiErrors.unauthorized('Token expired. Please login again.'));
    }
    return next(ApiErrors.unauthorized('Invalid token.'));
  }
}

module.exports = protect;
