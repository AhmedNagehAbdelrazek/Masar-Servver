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
import { RedisService } from '../../redis/redis.service.js';
let JwtAuthGuard = class JwtAuthGuard {
    jwt;
    config;
    redis;
    constructor(jwt, config, redis) {
        this.jwt = jwt;
        this.config = config;
        this.redis = redis;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new UnauthorizedException({ message: 'No token provided.', code: 'AUTH_NO_TOKEN' });
        }
        const token = header.slice('Bearer '.length).trim();
        let decoded;
        try {
            decoded = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.secret'),
            });
        }
        catch (err) {
            const name = err?.name;
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
};
JwtAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        ConfigService,
        RedisService])
], JwtAuthGuard);
export { JwtAuthGuard };
//# sourceMappingURL=jwt-auth.guard.js.map