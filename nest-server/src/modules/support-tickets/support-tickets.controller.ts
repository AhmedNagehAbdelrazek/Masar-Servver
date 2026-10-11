import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import {
  AddTicketMessageDto,
  CreateTicketDto,
  ListTicketsQuery,
  TicketIdParam,
  UpdateTicketDto,
  UpdateTicketStatusDto,
} from './dto/support-ticket.dto.js';
import { SupportTicketsService } from './support-tickets.service.js';

// Express parity: Routes/supportTicketRoutes.ts mounted at
// /api/support-tickets (all protect; updates restricted to staff roles).
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Post()
  @HttpCode(201)
  createTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ support_ticket: Record<string, unknown> }> {
    return this.tickets
      .createTicket({ id: user?.id ?? '', role: user?.role ?? '' }, dto)
      .then((support_ticket) => ({ support_ticket }));
  }

  @Get()
  listTickets(
    @Query() query: ListTicketsQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.tickets.listTickets({ id: user?.id ?? '', role: user?.role ?? '' }, query);
  }

  // Note: Express skips validation on this route, so any id string is
  // accepted here (unknown ids 404) — do NOT enforce UUID on the param.
  @Get(':ticket_id')
  getTicket(
    @Param('ticket_id') ticketId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ support_ticket: Record<string, unknown> }> {
    return this.tickets.getTicket({ id: user?.id ?? '', role: user?.role ?? '' }, ticketId);
  }

  @Put(':ticket_id')
  @Roles('admin', 'support', 'moderator')
  updateTicket(
    @Param() params: TicketIdParam,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ support_ticket: Record<string, unknown> }> {
    return this.tickets
      .updateTicket(user?.id ?? '', params.ticket_id, dto)
      .then((support_ticket) => ({ support_ticket }));
  }

  @Put(':ticket_id/status')
  @Roles('admin', 'support', 'moderator')
  updateStatus(
    @Param() params: TicketIdParam,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ support_ticket: Record<string, unknown> }> {
    return this.tickets
      .updateTicketStatus(user?.id ?? '', params.ticket_id, dto.status)
      .then((support_ticket) => ({ support_ticket }));
  }

  @Post(':ticket_id/messages')
  @HttpCode(201)
  addMessage(
    @Param() params: TicketIdParam,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ ticket_message: Record<string, unknown> }> {
    return this.tickets
      .addMessage({ id: user?.id ?? '', role: user?.role ?? '' }, params.ticket_id, dto.message)
      .then((ticket_message) => ({ ticket_message }));
  }
}
