// Test JWT factory. Mirrors Main Server/tests/setup/helpers.ts.
import { randomUUID } from 'node:crypto';
import { sign } from 'jsonwebtoken';

const secret = (): string => process.env.JWT_SECRET ?? 'test-secret-key-for-nest-tests';

export function generateAccessToken(user: { id: string; role: string }): string {
  return sign({ id: user.id, role: user.role, type: 'access' }, secret(), { expiresIn: '1h' });
}

export function generateRefreshToken(user: { id: string; role: string }): { token: string; jti: string } {
  const jti = randomUUID();
  const token = sign({ id: user.id, role: user.role, type: 'refresh', jti }, secret(), {
    expiresIn: '7d',
  });
  return { token, jti };
}

export function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
