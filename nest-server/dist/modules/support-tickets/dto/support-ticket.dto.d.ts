export declare const TICKET_STATUSES: readonly ["open", "in_progress", "resolved", "closed"];
export declare const TICKET_PRIORITIES: readonly ["low", "medium", "high", "urgent"];
export declare class CreateTicketDto {
    category: string;
    subject: string;
    description: string;
    priority?: (typeof TICKET_PRIORITIES)[number];
    booking_id?: string;
    trip_id?: string;
}
export declare class ListTicketsQuery {
    status?: (typeof TICKET_STATUSES)[number];
    priority?: (typeof TICKET_PRIORITIES)[number];
    page?: number;
    limit?: number;
}
export declare class TicketIdParam {
    ticket_id: string;
}
export declare class UpdateTicketDto {
    assigned_to?: string;
    priority?: (typeof TICKET_PRIORITIES)[number];
    category?: string;
    resolution_notes?: string;
}
export declare class UpdateTicketStatusDto {
    status: (typeof TICKET_STATUSES)[number];
}
export declare class AddTicketMessageDto {
    message: string;
}
