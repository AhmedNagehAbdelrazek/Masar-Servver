import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service.js';
export interface AuthUser {
    id: string;
    role: string;
}
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwt;
    private readonly config;
    private readonly redis;
    constructor(jwt: JwtService, config: ConfigService, redis: RedisService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
