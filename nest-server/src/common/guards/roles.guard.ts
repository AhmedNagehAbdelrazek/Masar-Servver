import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AuthUser } from './jwt-auth.guard.js';

// Port of Main Server/middlewares/roleGuard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed || allowed.length === 0) return true;
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!req.user) {
      throw new UnauthorizedException({ message: 'Authentication required.', code: 'AUTH_REQUIRED' });
    }
    if (!allowed.includes(req.user.role)) {
      throw new ForbiddenException({ message: 'Insufficient role.', code: 'AUTH_INSUFFICIENT_ROLE' });
    }
    return true;
  }
}
