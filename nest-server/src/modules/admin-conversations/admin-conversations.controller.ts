import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminConversationsService } from './admin-conversations.service.js';
import {
  AdminConversationListQuery,
  AdminThreadQuery,
  ConversationBookingParam,
  ConversationPenaltyDto,
} from './dto/admin-conversations.dto.js';

// Admin conversations surface. Full paths carry the global /api prefix
// (main.ts). Static routes (stats) are declared before :booking_id so they
// are never captured as a booking id. Direct admin<->user chats (فتح محادثة)
// reuse the existing support:{ticketId} socket room + ticket message REST —
// intentionally no endpoints here for those.
@Controller('admin/conversations')
@Roles('admin')
export class AdminConversationsController {
  constructor(private readonly conversations: AdminConversationsService) {}

  @Get('stats')
  getStats(): Promise<Record<string, unknown>> {
    return this.conversations.getStats();
  }

  @Get()
  listConversations(
    @Query() query: AdminConversationListQuery,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.conversations.listConversations(query);
  }

  @Get('trip/:booking_id')
  getTripThread(
    @Param() params: ConversationBookingParam,
    @Query() query: AdminThreadQuery,
  ): Promise<Record<string, unknown>> {
    return this.conversations.getTripThread(params.booking_id, query);
  }

  @Post('trip/:booking_id/penalties')
  @HttpCode(200)
  penalize(
    @Param() params: ConversationBookingParam,
    @Body() dto: ConversationPenaltyDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ penalty: Record<string, unknown> }> {
    return this.conversations.penalize(user?.id ?? '', params.booking_id, dto);
  }
}
