import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

// Port of Main Server/middlewares/socketAuth.ts:
// token from auth.token || query.token, type === 'access',
// Redis blacklist, User must exist and not be banned/suspended.
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket & { data: { user?: { id: string; role: string } } }>();
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);
    if (!token) throw new WsException({ code: 'AUTH_REQUIRED', message: 'Authentication required.' });
    let decoded: { id?: string; role?: string; type?: string };
    try {
      decoded = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
    } catch (err) {
      const name = (err as Error)?.name;
      throw new WsException({
        code: name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: 'Invalid token.',
      });
    }
    if (decoded.type !== 'access' || !decoded.id) {
      throw new WsException({ code: 'INVALID_TOKEN_TYPE', message: 'Invalid token type.' });
    }
    if (await this.redis.getKey(`blacklist:${token}`)) {
      throw new WsException({ code: 'TOKEN_REVOKED', message: 'Token revoked.' });
    }
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, status: true },
    });
    if (!user) throw new WsException({ code: 'USER_NOT_FOUND', message: 'User not found.' });
    if (user.status === 'banned' || user.status === 'suspended') {
      throw new WsException({ code: 'ACCOUNT_SUSPENDED', message: 'Account suspended.' });
    }
    client.data.user = { id: user.id, role: user.role };
    return true;
  }
}
