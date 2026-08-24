const jwt = require('jsonwebtoken');
const { ApiErrors } = require('../utils/ApiError');
const { isAccessTokenBlacklisted } = require('../Services/authService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiErrors.unauthorized('AUTH_NO_TOKEN'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'access') {
      return next(ApiErrors.unauthorized('AUTH_INVALID_TOKEN_TYPE'));
    }

    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(ApiErrors.unauthorized('AUTH_TOKEN_REVOKED'));
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiErrors.unauthorized('AUTH_TOKEN_EXPIRED'));
    }
    return next(ApiErrors.unauthorized('AUTH_INVALID_TOKEN'));
  }
}

module.exports = protect;
