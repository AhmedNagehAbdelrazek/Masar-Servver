"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = require("../utils/ApiError");
const authService_1 = require("../Services/authService");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
async function protect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(ApiError_1.ApiErrors.unauthorized('AUTH_NO_TOKEN'));
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return next(ApiError_1.ApiErrors.unauthorized('AUTH_NO_TOKEN'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'access') {
            return next(ApiError_1.ApiErrors.unauthorized('AUTH_INVALID_TOKEN_TYPE'));
        }
        const blacklisted = await (0, authService_1.isAccessTokenBlacklisted)(token);
        if (blacklisted) {
            return next(ApiError_1.ApiErrors.unauthorized('AUTH_TOKEN_REVOKED'));
        }
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        const error = err;
        if (error.name === 'TokenExpiredError') {
            return next(ApiError_1.ApiErrors.unauthorized('AUTH_TOKEN_EXPIRED'));
        }
        return next(ApiError_1.ApiErrors.unauthorized('AUTH_INVALID_TOKEN'));
    }
}
exports.default = protect;
// CommonJS interop for remaining JS files that use require()
module.exports = protect;
//# sourceMappingURL=protect.js.map