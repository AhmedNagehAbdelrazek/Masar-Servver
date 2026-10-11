import { Controller, Get, Param, Query } from '@nestjs/common';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ChatService } from './chat.service.js';
import {
  BookingMessagesParam,
  ChatHistoryQuery,
  TicketMessagesParam,
} from './dto/chat-history.query.js';

// Express parity: Routes/chatRoutes.ts — chat history is the REST fallback
// for offline/missed retrieval. Booking chat history stays readable
// (read-only) after its trip completes/cancels.
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('bookings/:bookingId/messages')
  getBookingMessages(
    @Param() params: BookingMessagesParam,
    @Query() query: ChatHistoryQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.chat.listBookingMessages({ id: user?.id ?? '', role: user?.role ?? '' }, {
      bookingId: params.bookingId,
      page: query.page,
      limit: query.limit,
      beforeId: query.before_id,
    });
  }

  @Get('tickets/:ticketId/messages')
  getTicketMessages(
    @Param() params: TicketMessagesParam,
    @Query() query: ChatHistoryQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.chat.listSupportMessages({ id: user?.id ?? '', role: user?.role ?? '' }, {
      supportTicketId: params.ticketId,
      page: query.page,
      limit: query.limit,
      beforeId: query.before_id,
    });
  }
}
