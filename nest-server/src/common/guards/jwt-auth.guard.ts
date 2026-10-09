import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RedisService } from '../../redis/redis.service.js';

export interface AuthUser {
  id: string;
  role: string;
}

// Port of Main Server/middlewares/protect.ts:
// Bearer access token only (type === 'access'), Redis blacklist check.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ message: 'No token provided.', code: 'AUTH_NO_TOKEN' });
    }
    const token = header.slice('Bearer '.length).trim();
    let decoded: { id?: string; role?: string; type?: string };
    try {
      decoded = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
    } catch (err) {
      const name = (err as Error)?.name;
      throw new UnauthorizedException({
        message: name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.',
        code: name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_INVALID_TOKEN',
      });
    }
    if (!decoded || decoded.type !== 'access' || !decoded.id || !decoded.role) {
      throw new UnauthorizedException({ message: 'Invalid token type.', code: 'AUTH_INVALID_TOKEN_TYPE' });
    }
    const blacklisted = await this.redis.getKey(`blacklist:${token}`);
    if (blacklisted) {
      throw new UnauthorizedException({ message: 'Token revoked.', code: 'AUTH_TOKEN_REVOKED' });
    }
    req.user = { id: decoded.id, role: decoded.role };
    return true;
  }
}
