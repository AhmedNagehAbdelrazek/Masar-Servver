var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { sanitizeMessage } from '../../common/utils/sanitize.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway as RealtimeGatewayToken } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../realtime/realtime-metrics.service.js';
function serialize(row) {
    return {
        id: row.id,
        sender_id: row.senderId,
        sender_name: row.sender ? row.sender.fullName : null,
        message: row.message,
        message_type: row.messageType,
        booking_id: row.bookingId || null,
        support_ticket_id: row.supportTicketId || null,
        is_read: row.isRead,
        read_at: row.readAt ? row.readAt.toISOString() : null,
        created_at: row.createdAt ? row.createdAt.toISOString() : null,
    };
}
function validationError(message) {
    return new UnprocessableEntityException({ message, code: 'VALIDATION_FAILED' });
}
function forbidden(message) {
    return new ForbiddenException({ message, code: 'FORBIDDEN' });
}
let ChatService = class ChatService {
    prisma;
    realtime;
    metrics;
    constructor(prisma, realtime, metrics) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.metrics = metrics;
    }
    async getBookingChatContext(user, bookingId) {
        if (!user?.id || !bookingId)
            return { member: false, booking: null, trip: null };
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { trip: { select: { id: true, driverId: true, status: true } } },
        });
        if (!booking || !booking.trip)
            return { member: false, booking: null, trip: null };
        const member = booking.passengerId === user.id || booking.trip.driverId === user.id;
        return { member, booking, trip: booking.trip };
    }
    async isTicketMember(user, ticketId) {
        if (!user?.id || !ticketId)
            return false;
        if (['admin', 'support', 'moderator'].includes(user.role))
            return true;
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { id: true, userId: true },
        });
        return !!ticket && ticket.userId === user.id;
    }
    async assertBookingChatOpen(user, bookingId) {
        const { member, booking, trip } = await this.getBookingChatContext(user, bookingId);
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        if (!member)
            throw forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_BOOKING_CHAT');
        if (booking.status !== 'confirmed') {
            throw forbidden('BOOKING_CHAT_REQUIRES_A_CONFIRMED_BOOKING');
        }
        if (!trip || trip.status === 'completed' || trip.status === 'cancelled') {
            throw forbidden('BOOKING_CHAT_IS_CLOSED_BECAUSE_THE_TRIP_IS_COMPLETED_OR');
        }
        return { booking, trip };
    }
    async sendBookingMessage(user, input) {
        const { bookingId, message } = input ?? {};
        if (!bookingId)
            throw validationError('BOOKING_ID_IS_REQUIRED_FOR_BOOKING_CHAT');
        if (!message || !String(message).trim())
            throw validationError('MESSAGE_IS_REQUIRED');
        await this.assertBookingChatOpen(user, bookingId);
        const clean = sanitizeMessage(message);
        if (!clean)
            throw validationError('MESSAGE_IS_EMPTY_AFTER_SANITIZATION');
        const created = await this.prisma.message.create({
            data: {
                senderId: user.id,
                bookingId,
                message: clean,
                messageType: input.messageType === 'system' ? 'system' : 'text',
            },
        });
        const row = (await this.prisma.message.findUnique({
            where: { id: created.id },
            include: { sender: { select: { fullName: true } } },
        }));
        const out = {
            id: row.id,
            sender_id: row.senderId,
            sender_name: row.sender ? row.sender.fullName : null,
            message: row.message,
            message_type: row.messageType,
            booking_id: row.bookingId,
            support_ticket_id: null,
            created_at: row.createdAt ? row.createdAt.toISOString() : null,
            timestamp: Date.now(),
        };
        this.realtime.emitToRoom(`booking:${bookingId}`, 'chat:receive', out);
        this.metrics.recordEvent('chat:receive');
        this.metrics.recordDelivery();
        return { id: row.id, created_at: out.created_at };
    }
    async sendSupportMessage(user, input) {
        const { supportTicketId, message } = input ?? {};
        if (!supportTicketId)
            throw validationError('SUPPORT_TICKET_ID_IS_REQUIRED_FOR_SUPPORT_CHAT');
        if (!message || !String(message).trim())
            throw validationError('MESSAGE_IS_REQUIRED');
        const member = await this.isTicketMember(user, supportTicketId);
        if (!member)
            throw forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        const clean = sanitizeMessage(message);
        if (!clean)
            throw validationError('MESSAGE_IS_EMPTY_AFTER_SANITIZATION');
        const created = await this.prisma.message.create({
            data: { senderId: user.id, supportTicketId, message: clean, messageType: 'text' },
        });
        const row = (await this.prisma.message.findUnique({
            where: { id: created.id },
            include: { sender: { select: { fullName: true } } },
        }));
        const out = {
            id: row.id,
            sender_id: row.senderId,
            sender_name: row.sender ? row.sender.fullName : null,
            message: row.message,
            message_type: row.messageType,
            booking_id: null,
            support_ticket_id: row.supportTicketId,
            created_at: row.createdAt ? row.createdAt.toISOString() : null,
            timestamp: Date.now(),
        };
        this.realtime.emitToRoom(`support:${supportTicketId}`, 'chat:receive', out);
        this.metrics.recordEvent('chat:receive');
        this.metrics.recordDelivery();
        return { id: row.id, created_at: out.created_at };
    }
    async markRead(user, input) {
        const { messageId, bookingId, supportTicketId } = input ?? {};
        const readAt = new Date();
        if (messageId) {
            const message = await this.prisma.message.findUnique({ where: { id: messageId } });
            if (!message)
                throw new NotFoundException({ message: 'MESSAGE_NOT_FOUND', code: 'MESSAGE_NOT_FOUND' });
            if (message.senderId === user.id) {
                throw forbidden('YOU_CANNOT_MARK_YOUR_OWN_MESSAGE_AS_READ');
            }
            let room;
            if (message.bookingId) {
                await this.assertBookingChatOpen(user, message.bookingId);
                room = `booking:${message.bookingId}`;
            }
            else if (message.supportTicketId) {
                const member = await this.isTicketMember(user, message.supportTicketId);
                if (!member)
                    throw forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_CONVERSATION');
                room = `support:${message.supportTicketId}`;
            }
            else {
                throw new NotFoundException({ message: 'MESSAGE_NOT_FOUND', code: 'MESSAGE_NOT_FOUND' });
            }
            await this.prisma.message.update({
                where: { id: message.id },
                data: { isRead: true, readAt },
            });
            this.realtime.emitToRoom(room, 'chat:read_ack', {
                message_id: message.id,
                booking_id: message.bookingId,
                support_ticket_id: message.supportTicketId,
                read_by: user.id,
                read_at: readAt.toISOString(),
                timestamp: Date.now(),
            });
            this.metrics.recordEvent('chat:read_ack');
            return { message_id: message.id };
        }
        if (bookingId) {
            await this.assertBookingChatOpen(user, bookingId);
            await this.prisma.message.updateMany({
                where: { bookingId, senderId: { not: user.id }, isRead: false },
                data: { isRead: true, readAt },
            });
            this.realtime.emitToRoom(`booking:${bookingId}`, 'chat:read_ack', {
                message_id: null,
                booking_id: bookingId,
                support_ticket_id: null,
                read_by: user.id,
                read_at: readAt.toISOString(),
                timestamp: Date.now(),
            });
            this.metrics.recordEvent('chat:read_ack');
            return { booking_id: bookingId };
        }
        if (supportTicketId) {
            const member = await this.isTicketMember(user, supportTicketId);
            if (!member)
                throw forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
            await this.prisma.message.updateMany({
                where: { supportTicketId, senderId: { not: user.id }, isRead: false },
                data: { isRead: true, readAt },
            });
            this.realtime.emitToRoom(`support:${supportTicketId}`, 'chat:read_ack', {
                message_id: null,
                booking_id: null,
                support_ticket_id: supportTicketId,
                read_by: user.id,
                read_at: readAt.toISOString(),
                timestamp: Date.now(),
            });
            this.metrics.recordEvent('chat:read_ack');
            return { support_ticket_id: supportTicketId };
        }
        throw validationError('PROVIDE_MESSAGE_ID_BOOKING_ID_OR_SUPPORT_TICKET_ID');
    }
    async listBookingMessages(user, input) {
        const { bookingId } = input;
        if (!bookingId)
            throw validationError('BOOKING_ID_IS_REQUIRED');
        const { member, booking } = await this.getBookingChatContext(user, bookingId);
        if (!booking)
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        if (!member)
            throw forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_BOOKING_CHAT');
        const { page: p, limit: l, offset } = parsePagination(input);
        const where = { bookingId };
        if (input.beforeId) {
            const before = await this.prisma.message.findUnique({
                where: { id: input.beforeId },
                select: { id: true, bookingId: true, createdAt: true },
            });
            if (!before || before.bookingId !== bookingId) {
                throw new BadRequestException({ message: 'INVALID_BEFORE_ID', code: 'INVALID_BEFORE_ID' });
            }
            where.createdAt = { lt: before.createdAt };
        }
        const [rows, count] = await Promise.all([
            this.prisma.message.findMany({
                where,
                include: { sender: { select: { fullName: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: l,
            }),
            this.prisma.message.count({ where }),
        ]);
        return { data: rows.map((r) => serialize(r)), pagination: buildPagination(count, p, l) };
    }
    async listSupportMessages(user, input) {
        const { supportTicketId } = input;
        if (!supportTicketId)
            throw validationError('SUPPORT_TICKET_ID_IS_REQUIRED');
        const member = await this.isTicketMember(user, supportTicketId);
        if (!member)
            throw forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        const { page: p, limit: l, offset } = parsePagination(input);
        const where = { supportTicketId };
        if (input.beforeId) {
            const before = await this.prisma.message.findUnique({
                where: { id: input.beforeId },
                select: { id: true, supportTicketId: true, createdAt: true },
            });
            if (!before || before.supportTicketId !== supportTicketId) {
                throw new BadRequestException({ message: 'INVALID_BEFORE_ID', code: 'INVALID_BEFORE_ID' });
            }
            where.createdAt = { lt: before.createdAt };
        }
        const [rows, count] = await Promise.all([
            this.prisma.message.findMany({
                where,
                include: { sender: { select: { fullName: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: l,
            }),
            this.prisma.message.count({ where }),
        ]);
        return { data: rows.map((r) => serialize(r)), pagination: buildPagination(count, p, l) };
    }
};
ChatService = __decorate([
    Injectable(),
    __param(1, Inject(forwardRef(() => RealtimeGatewayToken))),
    __metadata("design:paramtypes", [PrismaService, Function, RealtimeMetricsService])
], ChatService);
export { ChatService };
//# sourceMappingURL=chat.service.js.map