import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { isAccessTokenBlacklisted } from '../Services/authService';
import { authError } from '../utils/socketAck';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface AccessTokenPayload {
  id: string;
  role: string;
  type: string;
  exp?: number;
  iat?: number;
}

interface AuthenticatedSocketData {
  user: {
    id: string;
    role: string;
  };
}

interface UserModel {
  id: string;
  role: string;
  status: string;
}

async function socketAuth(socket: Socket, next: (err?: ExtendedError) => void): Promise<void> {
  const handshakeAuth = socket.handshake.auth as Record<string, unknown> | undefined;
  const handshakeQuery = socket.handshake.query as Record<string, unknown> | undefined;

  const token: string | undefined =
    (handshakeAuth?.token as string | undefined) || (handshakeQuery?.token as string | undefined);

  if (!token) {
    return next(authError('AUTH_REQUIRED', 'Authentication token is required.') as ExtendedError);
  }

  let decoded: AccessTokenPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch (err: unknown) {
    const error = err as Error & { name?: string };
    if (error.name === 'TokenExpiredError') {
      return next(authError('TOKEN_EXPIRED', 'Access token has expired.') as ExtendedError);
    }
    return next(authError('INVALID_TOKEN', 'Invalid access token.') as ExtendedError);
  }

  if (decoded.type !== 'access') {
    return next(authError('INVALID_TOKEN_TYPE', 'An access token is required.') as ExtendedError);
  }

  try {
    const blacklisted: boolean = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(authError('TOKEN_REVOKED', 'Access token has been revoked.') as ExtendedError);
    }

    // Lazy require to avoid circular deps; Models is still JS
    const { User } = require('../Models') as {
      User: {
        findByPk: (
          id: string,
          options: { attributes: string[] },
        ) => Promise<UserModel | null>;
      };
    };

    const user: UserModel | null = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'status'],
    });

    if (!user) {
      return next(authError('USER_NOT_FOUND', 'User no longer exists.') as ExtendedError);
    }
    if (user.status === 'banned' || user.status === 'suspended') {
      return next(authError('ACCOUNT_SUSPENDED', 'Account is banned or suspended.') as ExtendedError);
    }

    (socket.data as AuthenticatedSocketData).user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (_err: unknown) {
    return next(authError('AUTH_FAILED', 'Authentication failed.') as ExtendedError);
  }
}

export default socketAuth;
module.exports = socketAuth;
