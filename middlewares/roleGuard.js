const { ApiErrors } = require('../utils/ApiError');

function roleGuard(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiErrors.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.globalRole)) {
      return next(
        ApiErrors.forbidden(
          'Access denied. You do not have the required permissions.'
        )
      );
    }

    next();
  };
}

function permissionGuard(resource, action) {
  return (req, res, next) => {
    if (!req.admin) {
      return next(ApiErrors.unauthorized('Authentication required.'));
    }

    if (req.admin.role === 'super_admin') {
      return next();
    }

    const hasPermission = req.admin.permissions?.[resource]?.includes(action) ?? false;

    if (!hasPermission) {
      return next(
        ApiErrors.forbidden(
          `Access denied. Missing permission: ${resource}:${action}`
        )
      );
    }

    next();
  };
}

module.exports = roleGuard;
module.exports.roleGuard = roleGuard;
module.exports.permissionGuard = permissionGuard;
