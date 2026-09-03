"use strict";
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
function generateAccessToken(user) {
    return jwt.sign({ id: user.id, role: user.role, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
}
function generateRefreshToken(user) {
    const jti = require('crypto').randomUUID();
    return {
        token: jwt.sign({ id: user.id, role: user.role, type: 'refresh', jti }, JWT_SECRET, { expiresIn: '7d' }),
        jti,
    };
}
function generateRegistrationToken(phone, role, countryCode) {
    return jwt.sign({ phone, role, countryCode, type: 'registration' }, JWT_SECRET, { expiresIn: '10m' });
}
function generateResetToken(phone) {
    return jwt.sign({ phone, type: 'reset' }, JWT_SECRET, { expiresIn: '10m' });
}
function getAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
}
module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateRegistrationToken,
    generateResetToken,
    getAuthHeader,
    JWT_SECRET,
};
//# sourceMappingURL=helpers.js.map