import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminModerationService } from './admin-moderation.service.js';
import {
  AdminUserListQuery,
  UpdateUserStatusDto,
  UserIdParam,
} from './dto/admin-moderation.dto.js';

// Express parity: Routes/adminModerationRoutes.ts user section mounted at
// /api/admin (all protect + admin). Free path — no other Nest controller
// registers admin/users.
@Controller('admin/users')
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly admin: AdminModerationService) {}

  @Get()
  listUsers(
    @Query() query: AdminUserListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.admin.listUsers(query);
  }

  @Put(':user_id')
  updateUserStatus(
    @Param() params: UserIdParam,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ user: Record<string, unknown> }> {
    return this.admin.updateUserStatus(user?.id ?? '', params.user_id, dto);
  }
}
