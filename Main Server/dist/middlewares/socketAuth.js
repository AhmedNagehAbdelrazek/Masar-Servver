"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authService_1 = require("../Services/authService");
const socketAck_1 = require("../utils/socketAck");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
async function socketAuth(socket, next) {
    const handshakeAuth = socket.handshake.auth;
    const handshakeQuery = socket.handshake.query;
    const token = handshakeAuth?.token || handshakeQuery?.token;
    if (!token) {
        return next((0, socketAck_1.authError)('AUTH_REQUIRED', 'Authentication token is required.'));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        const error = err;
        if (error.name === 'TokenExpiredError') {
            return next((0, socketAck_1.authError)('TOKEN_EXPIRED', 'Access token has expired.'));
        }
        return next((0, socketAck_1.authError)('INVALID_TOKEN', 'Invalid access token.'));
    }
    if (decoded.type !== 'access') {
        return next((0, socketAck_1.authError)('INVALID_TOKEN_TYPE', 'An access token is required.'));
    }
    try {
        const blacklisted = await (0, authService_1.isAccessTokenBlacklisted)(token);
        if (blacklisted) {
            return next((0, socketAck_1.authError)('TOKEN_REVOKED', 'Access token has been revoked.'));
        }
        // Lazy require to avoid circular deps; Models is still JS
        const { User } = require('../Models');
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'role', 'status'],
        });
        if (!user) {
            return next((0, socketAck_1.authError)('USER_NOT_FOUND', 'User no longer exists.'));
        }
        if (user.status === 'banned' || user.status === 'suspended') {
            return next((0, socketAck_1.authError)('ACCOUNT_SUSPENDED', 'Account is banned or suspended.'));
        }
        socket.data.user = {
            id: user.id,
            role: user.role,
        };
        next();
    }
    catch (_err) {
        return next((0, socketAck_1.authError)('AUTH_FAILED', 'Authentication failed.'));
    }
}
exports.default = socketAuth;
module.exports = socketAuth;
//# sourceMappingURL=socketAuth.js.map