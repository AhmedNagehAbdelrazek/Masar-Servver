import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AddTicketMessageDto, CreateTicketDto, ListTicketsQuery, TicketIdParam, UpdateTicketDto, UpdateTicketStatusDto } from './dto/support-ticket.dto.js';
import { SupportTicketsService } from './support-tickets.service.js';
export declare class SupportTicketsController {
    private readonly tickets;
    constructor(tickets: SupportTicketsService);
    createTicket(dto: CreateTicketDto, user?: AuthUser): Promise<{
        support_ticket: Record<string, unknown>;
    }>;
    listTickets(query: ListTicketsQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getTicket(ticketId: string, user?: AuthUser): Promise<{
        support_ticket: Record<string, unknown>;
    }>;
    updateTicket(params: TicketIdParam, dto: UpdateTicketDto, user?: AuthUser): Promise<{
        support_ticket: Record<string, unknown>;
    }>;
    updateStatus(params: TicketIdParam, dto: UpdateTicketStatusDto, user?: AuthUser): Promise<{
        support_ticket: Record<string, unknown>;
    }>;
    addMessage(params: TicketIdParam, dto: AddTicketMessageDto, user?: AuthUser): Promise<{
        ticket_message: Record<string, unknown>;
    }>;
}
