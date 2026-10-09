import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
export declare class WsJwtGuard implements CanActivate {
    private readonly jwt;
    private readonly config;
    private readonly redis;
    private readonly prisma;
    constructor(jwt: JwtService, config: ConfigService, redis: RedisService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
