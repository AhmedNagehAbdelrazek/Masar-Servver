var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupportTicketsService_1;
import { randomBytes } from 'crypto';
import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
const STAFF_ROLES = ['admin', 'support', 'moderator'];
function isStaff(user) {
    return !!user && STAFF_ROLES.includes(user.role);
}
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateReferenceCode(prefix) {
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
    }
    return `${prefix}-${code}`;
}
function serializeMessage(message) {
    return {
        id: message.id,
        ticket_id: message.ticketId,
        sender_id: message.senderId,
        sender_name: message.sender ? message.sender.fullName : null,
        sender_role: message.sender ? message.sender.role : null,
        message: message.message,
        created_at: message.createdAt,
    };
}
function serializeTicket(ticket, includeMessages = false) {
    const base = {
        id: ticket.id,
        reference_code: ticket.referenceCode,
        user_id: ticket.userId,
        user_name: ticket.user ? ticket.user.fullName : null,
        category: ticket.category,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assignedTo || null,
        booking_id: ticket.bookingId || null,
        trip_id: ticket.tripId || null,
        resolution_notes: ticket.resolutionNotes || null,
        created_at: ticket.createdAt,
        updated_at: ticket.updatedAt,
    };
    if (includeMessages) {
        base.messages = (ticket.messages || []).map(serializeMessage);
    }
    return base;
}
let SupportTicketsService = SupportTicketsService_1 = class SupportTicketsService {
    prisma;
    notifications;
    logger = new Logger(SupportTicketsService_1.name);
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async uniqueTicketCode() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateReferenceCode('TKT');
            const existing = await this.prisma.supportTicket.findUnique({ where: { referenceCode: code } });
            if (!existing)
                return code;
        }
        throw new ConflictException({ message: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE', code: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE' });
    }
    async notifyStaff(ticket) {
        try {
            const staff = await this.prisma.user.findMany({
                where: { role: { in: [...STAFF_ROLES] }, status: 'active' },
                select: { id: true },
            });
            await Promise.allSettled(staff.map((member) => this.notifications.sendToUser({ id: member.id }, 'SUPPORT_TICKET_NEW', {
                channels: ['in_app'],
                vars: {
                    reference_code: ticket.referenceCode,
                    subject: ticket.subject,
                },
            })));
        }
        catch (err) {
            this.logger.warn(`staff notification failed: ${err.message}`);
        }
    }
    async createTicket(user, input) {
        const referenceCode = await this.uniqueTicketCode();
        if (input.booking_id) {
            const booking = await this.prisma.booking.findUnique({ where: { id: input.booking_id } });
            if (!booking)
                throw new NotFoundException({ message: 'REFERENCED_BOOKING_NOT_FOUND', code: 'REFERENCED_BOOKING_NOT_FOUND' });
        }
        const ticket = (await this.prisma.supportTicket.create({
            data: {
                userId: user.id,
                category: input.category,
                subject: input.subject,
                description: input.description,
                priority: (input.priority ?? 'medium'),
                status: 'open',
                referenceCode,
                bookingId: input.booking_id || null,
                tripId: input.trip_id || null,
            },
        }));
        setImmediate(() => {
            void this.notifyStaff(ticket);
        });
        return serializeTicket(ticket);
    }
    async listTickets(user, filters) {
        const where = {};
        if (!isStaff(user)) {
            where.userId = user.id;
        }
        if (filters.status)
            where.status = filters.status;
        if (filters.priority)
            where.priority = filters.priority;
        const { page, limit, offset } = parsePagination(filters);
        const [rows, count] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                include: { user: { select: { id: true, fullName: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return {
            data: rows.map((t) => serializeTicket(t)),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getTicket(user, ticketId) {
        const ticket = (await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: { select: { id: true, fullName: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            },
        }));
        if (!ticket)
            throw new NotFoundException({ message: 'SUPPORT_TICKET_NOT_FOUND', code: 'SUPPORT_TICKET_NOT_FOUND' });
        if (!isStaff(user) && ticket.userId !== user.id) {
            throw new ForbiddenException({ message: 'YOU_CAN_ONLY_VIEW_YOUR_OWN_SUPPORT_TICKETS', code: 'FORBIDDEN' });
        }
        const senderIds = [...new Set((ticket.messages || []).map((m) => m.senderId))];
        const senders = await this.prisma.user.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, fullName: true, role: true },
        });
        const byId = new Map(senders.map((s) => [s.id, s]));
        ticket.messages = (ticket.messages || []).map((m) => ({
            ...m,
            sender: byId.get(m.senderId) ?? null,
        }));
        return { support_ticket: serializeTicket(ticket, true) };
    }
    async assertTicketExists(ticketId) {
        const ticket = (await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        }));
        if (!ticket)
            throw new NotFoundException({ message: 'SUPPORT_TICKET_NOT_FOUND', code: 'SUPPORT_TICKET_NOT_FOUND' });
        return ticket;
    }
    async updateTicket(actorId, ticketId, input) {
        await this.assertTicketExists(ticketId);
        const updates = {};
        if (input.assigned_to !== undefined)
            updates.assignedTo = input.assigned_to;
        if (input.priority !== undefined)
            updates.priority = input.priority;
        if (input.category !== undefined)
            updates.category = input.category;
        if (input.resolution_notes !== undefined)
            updates.resolutionNotes = input.resolution_notes;
        const ticket = (await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: updates,
        }));
        void actorId;
        return serializeTicket(ticket);
    }
    async updateTicketStatus(actorId, ticketId, status) {
        const ticket = await this.assertTicketExists(ticketId);
        if (ticket.status === 'closed' && status !== 'closed') {
            throw new ConflictException({ message: 'CLOSED_TICKETS_CANNOT_BE_REOPENED', code: 'CLOSED_TICKETS_CANNOT_BE_REOPENED' });
        }
        const updated = (await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status },
        }));
        void actorId;
        return serializeTicket(updated);
    }
    async addMessage(user, ticketId, messageText) {
        const ticket = await this.assertTicketExists(ticketId);
        if (!isStaff(user) && ticket.userId !== user.id) {
            throw new ForbiddenException({ message: 'YOU_CAN_ONLY_REPLY_TO_YOUR_OWN_SUPPORT_TICKETS', code: 'FORBIDDEN' });
        }
        const message = await this.prisma.supportTicketMessage.create({
            data: { ticketId, senderId: user.id, message: messageText },
        });
        const sender = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, fullName: true, role: true },
        });
        return serializeMessage({
            ...message,
            sender: sender,
        });
    }
};
SupportTicketsService = SupportTicketsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService])
], SupportTicketsService);
export { SupportTicketsService };
//# sourceMappingURL=support-tickets.service.js.map