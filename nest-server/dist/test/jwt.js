import { randomUUID } from 'node:crypto';
import { sign } from 'jsonwebtoken';
const secret = () => process.env.JWT_SECRET ?? 'test-secret-key-for-nest-tests';
export function generateAccessToken(user) {
    return sign({ id: user.id, role: user.role, type: 'access' }, secret(), { expiresIn: '1h' });
}
export function generateRefreshToken(user) {
    const jti = randomUUID();
    const token = sign({ id: user.id, role: user.role, type: 'refresh', jti }, secret(), {
        expiresIn: '7d',
    });
    return { token, jti };
}
export function getAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
}
//# sourceMappingURL=jwt.js.map