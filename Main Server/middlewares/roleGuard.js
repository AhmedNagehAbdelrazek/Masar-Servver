const { ApiErrors } = require('../utils/ApiError');

function roleGuard(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiErrors.unauthorized('AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiErrors.forbidden('AUTH_INSUFFICIENT_ROLE'));
    }

    next();
  };
}

module.exports = roleGuard;
module.exports.roleGuard = roleGuard;
