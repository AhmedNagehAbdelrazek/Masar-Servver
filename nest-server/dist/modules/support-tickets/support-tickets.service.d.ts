import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TICKET_STATUSES } from './dto/support-ticket.dto.js';
export interface TicketUser {
    id: string;
    role: string;
}
export declare class SupportTicketsService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private uniqueTicketCode;
    private notifyStaff;
    createTicket(user: TicketUser, input: {
        category: string;
        subject: string;
        description: string;
        priority?: string;
        booking_id?: string;
        trip_id?: string;
    }): Promise<Record<string, unknown>>;
    listTickets(user: TicketUser, filters: {
        status?: string;
        priority?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getTicket(user: TicketUser, ticketId: string): Promise<{
        support_ticket: Record<string, unknown>;
    }>;
    private assertTicketExists;
    updateTicket(actorId: string, ticketId: string, input: {
        assigned_to?: string;
        priority?: string;
        category?: string;
        resolution_notes?: string;
    }): Promise<Record<string, unknown>>;
    updateTicketStatus(actorId: string, ticketId: string, status: (typeof TICKET_STATUSES)[number]): Promise<Record<string, unknown>>;
    addMessage(user: TicketUser, ticketId: string, messageText: string): Promise<Record<string, unknown>>;
}
