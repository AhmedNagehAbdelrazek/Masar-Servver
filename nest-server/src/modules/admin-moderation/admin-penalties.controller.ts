import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PenaltyService } from '../driver/penalty.service.js';
import { IssuePenaltyDto } from './dto/admin-moderation.dto.js';

// Express parity: Routes/adminModerationRoutes.ts penalty section
// (POST /api/admin/penalties, protect + admin). Wires the ported
// PenaltyService.issue() to HTTP. Free path — no other Nest controller
// registers admin/penalties.
@Controller('admin/penalties')
@Roles('admin')
export class AdminPenaltiesController {
  constructor(private readonly penalties: PenaltyService) {}

  @Post()
  @HttpCode(200)
  issuePenalty(
    @Body() dto: IssuePenaltyDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ penalty: Record<string, unknown> }> {
    return this.penalties.issue(user?.id ?? '', {
      user_id: dto.user_id,
      type: dto.type,
      reason: dto.reason,
      details: dto.details ?? null,
      complaint_id: dto.complaint_id ?? null,
      ends_at: dto.ends_at ?? null,
    });
  }
}
