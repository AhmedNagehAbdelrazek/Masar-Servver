import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';

// Auth skeleton: OTP + password flows are ported incrementally from
// Main Server/Services/authService.ts. Token shapes match Express:
// access {id,role,type:'access'}, refresh {id,role,type:'refresh',jti} (7d, Redis),
// registration {phone,role,countryCode,type:'registration'} (10m), reset (10m).
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private get secret(): string {
    return this.config.get<string>('jwt.secret', 'dev-secret-change-in-production');
  }

  generateAccessToken(id: string, role: string): string {
    return this.jwt.sign(
      { id, role, type: 'access' },
      { secret: this.secret, expiresIn: this.config.get<string>('jwt.expiry', '24h') } as never,
    );
  }

  async generateRefreshToken(id: string, role: string): Promise<{ token: string; jti: string }> {
    const jti = randomUUID();
    const token = this.jwt.sign({ id, role, type: 'refresh', jti }, {
      secret: this.secret,
      expiresIn: '7d',
    } as never);
    await this.redis.setKey(`refresh:${id}:${jti}`, '1', 7 * 24 * 3600);
    return { token, jti };
  }

  async logout(accessToken: string, userId: string, refreshToken?: string): Promise<void> {
    // Blacklist access token until its exp (best-effort TTL 24h fallback).
    const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
    const ttl = decoded?.exp ? Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1) : 24 * 3600;
    await this.redis.setKey(`blacklist:${accessToken}`, '1', ttl);
    if (refreshToken) {
      const payload = this.jwt.decode(refreshToken) as { id?: string; jti?: string } | null;
      if (payload?.id && payload?.jti) {
        await this.redis.deleteKey(`refresh:${payload.id}:${payload.jti}`);
      }
    }
    void userId;
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { id: string; role: string; type: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.secret });
    } catch {
      throw new UnauthorizedException({ message: 'Invalid refresh token.', code: 'AUTH_INVALID_TOKEN' });
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({ message: 'Invalid token type.', code: 'AUTH_INVALID_TOKEN_TYPE' });
    }
    const stored = await this.redis.getKey(`refresh:${payload.id}:${payload.jti}`);
    if (!stored) {
      throw new UnauthorizedException({ message: 'Refresh token revoked.', code: 'AUTH_TOKEN_REVOKED' });
    }
    await this.redis.deleteKey(`refresh:${payload.id}:${payload.jti}`);
    const accessToken = this.generateAccessToken(payload.id, payload.role);
    const next = await this.generateRefreshToken(payload.id, payload.role);
    return { accessToken, refreshToken: next.token };
  }

  async me(userId: string): Promise<unknown> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, phone: true, email: true, role: true, fullName: true,
        displayName: true, isVerified: true, verificationStatus: true,
        status: true, locale: true, avatarUrl: true, avgRating: true,
        createdAt: true,
      },
    });
  }
}
