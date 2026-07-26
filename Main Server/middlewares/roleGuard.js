const { ApiErrors } = require('../utils/ApiError');

function roleGuard(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiErrors.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiErrors.forbidden(
          'Access denied. You do not have the required role.'
        )
      );
    }

    next();
  };
}

module.exports = roleGuard;
module.exports.roleGuard = roleGuard;
