import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ChatService } from './chat.service.js';
import { BookingMessagesParam, ChatHistoryQuery, TicketMessagesParam } from './dto/chat-history.query.js';
export declare class ChatController {
    private readonly chat;
    constructor(chat: ChatService);
    getBookingMessages(params: BookingMessagesParam, query: ChatHistoryQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getTicketMessages(params: TicketMessagesParam, query: ChatHistoryQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
