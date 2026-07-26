const jwt = require('jsonwebtoken');
const { ApiErrors } = require('../utils/ApiError');
const Admin = require('../Models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiErrors.unauthorized('Access denied. No token provided.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      globalRole: decoded.globalRole,
    };

    if (decoded.globalRole === 'admin' || decoded.globalRole === 'super_admin') {
      const admin = await Admin.findByPk(decoded.id);
      if (!admin || !admin.isActive) {
        return next(ApiErrors.unauthorized('Admin account is inactive or not found.'));
      }
      req.admin = admin;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiErrors.unauthorized('Token expired. Please login again.'));
    }
    return next(ApiErrors.unauthorized('Invalid token.'));
  }
}

module.exports = protect;
