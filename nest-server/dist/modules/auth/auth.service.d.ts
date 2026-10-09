import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly redis;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, redis: RedisService);
    private get secret();
    generateAccessToken(id: string, role: string): string;
    generateRefreshToken(id: string, role: string): Promise<{
        token: string;
        jti: string;
    }>;
    logout(accessToken: string, userId: string, refreshToken?: string): Promise<void>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    me(userId: string): Promise<unknown>;
}
