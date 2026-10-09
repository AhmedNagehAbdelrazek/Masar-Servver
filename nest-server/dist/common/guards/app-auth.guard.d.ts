import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';
export declare class AppAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtGuard;
    private readonly rolesGuard;
    constructor(reflector: Reflector, jwtGuard: JwtAuthGuard, rolesGuard: RolesGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
