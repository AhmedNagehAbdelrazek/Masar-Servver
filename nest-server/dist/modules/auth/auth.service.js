var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    redis;
    constructor(prisma, jwt, config, redis) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.redis = redis;
    }
    get secret() {
        return this.config.get('jwt.secret', 'dev-secret-change-in-production');
    }
    generateAccessToken(id, role) {
        return this.jwt.sign({ id, role, type: 'access' }, { secret: this.secret, expiresIn: this.config.get('jwt.expiry', '24h') });
    }
    async generateRefreshToken(id, role) {
        const jti = randomUUID();
        const token = this.jwt.sign({ id, role, type: 'refresh', jti }, {
            secret: this.secret,
            expiresIn: '7d',
        });
        await this.redis.setKey(`refresh:${id}:${jti}`, '1', 7 * 24 * 3600);
        return { token, jti };
    }
    async logout(accessToken, userId, refreshToken) {
        const decoded = this.jwt.decode(accessToken);
        const ttl = decoded?.exp ? Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1) : 24 * 3600;
        await this.redis.setKey(`blacklist:${accessToken}`, '1', ttl);
        if (refreshToken) {
            const payload = this.jwt.decode(refreshToken);
            if (payload?.id && payload?.jti) {
                await this.redis.deleteKey(`refresh:${payload.id}:${payload.jti}`);
            }
        }
        void userId;
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, { secret: this.secret });
        }
        catch {
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
    async me(userId) {
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
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService,
        ConfigService,
        RedisService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map