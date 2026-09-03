"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = roleGuard;
const ApiError_1 = require("../utils/ApiError");
function roleGuard(allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(ApiError_1.ApiErrors.unauthorized('AUTH_REQUIRED'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError_1.ApiErrors.forbidden('AUTH_INSUFFICIENT_ROLE'));
        }
        next();
    };
}
exports.default = roleGuard;
module.exports = roleGuard;
// Preserve named export for require() destructuring
module.exports.roleGuard = roleGuard;
//# sourceMappingURL=roleGuard.js.map