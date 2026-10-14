var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { RedisService } from '../../redis/redis.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
let WsJwtGuard = class WsJwtGuard {
    jwt;
    config;
    redis;
    prisma;
    constructor(jwt, config, redis, prisma) {
        this.jwt = jwt;
        this.config = config;
        this.redis = redis;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = client.handshake.auth?.token ??
            client.handshake.query?.token;
        if (!token)
            throw new WsException({ code: 'AUTH_REQUIRED', message: 'AUTH_REQUIRED' });
        let decoded;
        try {
            decoded = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.secret'),
            });
        }
        catch (err) {
            const name = err?.name;
            throw new WsException({
                code: name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
                message: name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_INVALID_TOKEN',
            });
        }
        if (decoded.type !== 'access' || !decoded.id) {
            throw new WsException({ code: 'INVALID_TOKEN_TYPE', message: 'INVALID_TOKEN_TYPE' });
        }
        if (await this.redis.getKey(`blacklist:${token}`)) {
            throw new WsException({ code: 'TOKEN_REVOKED', message: 'AUTH_TOKEN_REVOKED' });
        }
        const user = await this.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, status: true },
        });
        if (!user)
            throw new WsException({ code: 'USER_NOT_FOUND', message: 'USER_NOT_FOUND' });
        if (user.status === 'banned' || user.status === 'suspended') {
            throw new WsException({ code: 'ACCOUNT_SUSPENDED', message: 'ACCOUNT_HAS_BEEN_SUSPENDED' });
        }
        client.data.user = { id: user.id, role: user.role };
        return true;
    }
};
WsJwtGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        ConfigService,
        RedisService,
        PrismaService])
], WsJwtGuard);
export { WsJwtGuard };
//# sourceMappingURL=ws-jwt.guard.js.map