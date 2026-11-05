"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateRegistrationToken = generateRegistrationToken;
exports.generateResetToken = generateResetToken;
exports.getAuthHeader = getAuthHeader;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
exports.JWT_SECRET = JWT_SECRET;
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, role: user.role, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
}
function generateRefreshToken(user) {
    const jti = crypto_1.default.randomUUID();
    return {
        token: jsonwebtoken_1.default.sign({ id: user.id, role: user.role, type: 'refresh', jti }, JWT_SECRET, { expiresIn: '7d' }),
        jti,
    };
}
function generateRegistrationToken(phone, role, countryCode) {
    return jsonwebtoken_1.default.sign({ phone, role, countryCode, type: 'registration' }, JWT_SECRET, { expiresIn: '10m' });
}
function generateResetToken(phone) {
    return jsonwebtoken_1.default.sign({ phone, type: 'reset' }, JWT_SECRET, { expiresIn: '10m' });
}
function getAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
}
exports.default = {
    generateAccessToken,
    generateRefreshToken,
    generateRegistrationToken,
    generateResetToken,
    getAuthHeader,
    JWT_SECRET,
};
module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateRegistrationToken,
    generateResetToken,
    getAuthHeader,
    JWT_SECRET,
};
//# sourceMappingURL=helpers.js.map