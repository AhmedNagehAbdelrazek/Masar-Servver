import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
export interface ChatUser {
    id: string;
    role: string;
}
export declare class ChatService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    getBookingChatContext(user: ChatUser, bookingId: string): Promise<{
        member: boolean;
        booking: {
            id: string;
            passengerId: string;
            status: string;
        } | null;
        trip: {
            id: string;
            driverId: string;
            status: string;
        } | null;
    }>;
    isTicketMember(user: ChatUser, ticketId: string): Promise<boolean>;
    assertBookingChatOpen(user: ChatUser, bookingId: string): Promise<{
        booking: {
            id: string;
            passengerId: string;
            status: string;
        };
        trip: {
            id: string;
            driverId: string;
            status: string;
        };
    }>;
    sendBookingMessage(user: ChatUser, input: {
        bookingId?: string;
        message?: string;
        messageType?: string;
    }): Promise<{
        id: string;
        created_at: string | null;
    }>;
    sendSupportMessage(user: ChatUser, input: {
        supportTicketId?: string;
        message?: string;
    }): Promise<{
        id: string;
        created_at: string | null;
    }>;
    markRead(user: ChatUser, input: {
        messageId?: string;
        bookingId?: string;
        supportTicketId?: string;
    }): Promise<Record<string, unknown>>;
    listBookingMessages(user: ChatUser, input: {
        bookingId: string;
        page?: number;
        limit?: number;
        beforeId?: string;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    listSupportMessages(user: ChatUser, input: {
        supportTicketId: string;
        page?: number;
        limit?: number;
        beforeId?: string;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
